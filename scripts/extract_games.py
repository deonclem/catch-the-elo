#!/usr/bin/env python3
"""
extract_games.py — Archive → NDJSON

Reads a raw Lichess PGN stream from stdin (piped via zstdcat) and extracts
a curated set of games with homogeneous Elo distribution, writing the result
to a local NDJSON file for inspection and later import.

Usage:
    zstdcat lichess_db_standard_rated_2024-01.pgn.zst \\
        | python3 scripts/extract_games.py --output curated_games.ndjson --days 90

The NDJSON file can be safely re-processed or debugged without re-scanning
the archive. One JSON object per line:
    {"pgn": "...", "white_elo": 1800, "black_elo": 1750, "target_elo": 1775,
     "bracket": 1700, "lichess_id": "AbCdEfGh", "metadata": {...}}

Deduplication against the database happens here — games whose lichess_id is
already in daily_games are skipped before being added to any bracket bucket.
Credentials are loaded from scripts/.env (see scripts/.env.example).
"""

import argparse
import io
import json
import math
import os
import random
import re
import sys
from pathlib import Path

import chess.pgn
from dotenv import load_dotenv
from supabase import create_client, Client


# ---------------------------------------------------------------------------
# Supabase client + dedup
# ---------------------------------------------------------------------------

TABLE_DAILY = "daily_games"


def create_supabase_client() -> Client:
    """Load credentials from scripts/.env and return an authenticated client."""
    env_path = Path(__file__).parent / ".env"
    load_dotenv(dotenv_path=env_path)

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SECRET_DB_KEY")

    if not url or not key:
        sys.exit(
            "Error: SUPABASE_URL and SUPABASE_SECRET_DB_KEY must be set in scripts/.env\n"
            "Copy scripts/.env.example → scripts/.env and fill in your values."
        )

    return create_client(url, key)


def fetch_existing_lichess_ids(client: Client) -> set[str]:
    """Return the set of lichess_id values already present in daily_games."""
    result = client.table(TABLE_DAILY).select("lichess_id").execute()
    return {row["lichess_id"] for row in result.data if row.get("lichess_id")}


# ---------------------------------------------------------------------------
# Elo bracket configuration
# ---------------------------------------------------------------------------

ELO_MIN = 800
ELO_MAX = 2500
BRACKET_SIZE = 100

# 21 brackets: [400, 500, 600, ..., 2400]
BRACKETS = list(range(ELO_MIN, ELO_MAX, BRACKET_SIZE))

# ---------------------------------------------------------------------------
# PGN scrubbing: tags that would reveal Elo level to the player
# ---------------------------------------------------------------------------

SCRUB_TAGS = [
    "WhiteElo",
    "BlackElo",
    "WhiteTitle",       # e.g. "GM" → immediately reveals 2500+ rating
    "BlackTitle",
    "WhiteRatingDiff",  # e.g. "+4" → leaks approximate Elo bracket
    "BlackRatingDiff",
]

_SCRUB_PATTERN = re.compile(
    r'\[(?:' + '|'.join(SCRUB_TAGS) + r')\s+"[^"]*"\]\n?'
)


def scrub_pgn(pgn_string: str) -> str:
    """Remove Elo-revealing PGN header tags from a game string."""
    return _SCRUB_PATTERN.sub("", pgn_string)


# ---------------------------------------------------------------------------
# Filtering
# ---------------------------------------------------------------------------

VALID_RESULTS = {"1-0", "0-1", "1/2-1/2"}
MIN_FULL_MOVES = 20


def get_elo(headers: chess.pgn.Headers, key: str) -> int | None:
    """Parse an integer Elo from PGN headers, return None if missing/invalid."""
    raw = headers.get(key, "")
    try:
        return int(raw)
    except (ValueError, TypeError):
        return None


def passes_filters(game: chess.pgn.Game) -> bool:
    """
    Return True if the game meets all selection criteria:
      - Blitz or Rapid event
      - Both Elo ratings present and in [ELO_MIN, ELO_MAX]
      - Elo gap between players ≤ 100 points
      - At least MIN_FULL_MOVES full moves played
      - Decisive or drawn result (no abandons / forfeits before moves)
    """
    headers = game.headers

    # --- Time control: Rapid only ---
    event = headers.get("Event", "").lower()
    if "rapid" not in event:
        return False

    # --- Result must be decisive or drawn ---
    if headers.get("Result", "") not in VALID_RESULTS:
        return False

    # --- Both Elos must be present and within the configured range ---
    white_elo = get_elo(headers, "WhiteElo")
    black_elo = get_elo(headers, "BlackElo")
    if white_elo is None or black_elo is None:
        return False
    if not (ELO_MIN <= white_elo <= ELO_MAX):
        return False
    if not (ELO_MIN <= black_elo <= ELO_MAX):
        return False

    # --- Players must be closely rated (avoids mismatched games) ---
    if abs(white_elo - black_elo) > 100:
        return False

    # --- Minimum move count (reject very short games) ---
    # fullmove_number on the final position equals the number of completed full moves
    if game.end().board().fullmove_number < MIN_FULL_MOVES:
        return False

    return True


# ---------------------------------------------------------------------------
# Row building
# ---------------------------------------------------------------------------

def build_row(game: chess.pgn.Game) -> dict:
    """
    Build the dict that will become one line in the NDJSON output.
    Scrubs the PGN and assembles metadata from headers.
    """
    headers = game.headers
    white_elo = get_elo(headers, "WhiteElo")  # guaranteed non-None after passes_filters
    black_elo = get_elo(headers, "BlackElo")
    avg_elo = round((white_elo + black_elo) / 2)
    bracket = (avg_elo // BRACKET_SIZE) * BRACKET_SIZE

    scrubbed = scrub_pgn(str(game))

    site_url = headers.get("Site", "")
    lichess_id = site_url.rsplit("/", 1)[-1] if "/" in site_url else ""

    metadata = {
        "white_name":   headers.get("White", "?"),
        "black_name":   headers.get("Black", "?"),
        "lichess_url":  site_url,
        "event":        headers.get("Event", ""),
        "opening":      headers.get("Opening", ""),
        "eco":          headers.get("ECO", ""),
        "time_control": headers.get("TimeControl", ""),
    }

    return {
        "pgn":        scrubbed,
        "white_elo":  white_elo,
        "black_elo":  black_elo,
        "target_elo": avg_elo,
        "bracket":    bracket,
        "lichess_id": lichess_id,
        "metadata":   metadata,
    }


# ---------------------------------------------------------------------------
# Progress logging
# ---------------------------------------------------------------------------

def log_progress(games_scanned: int, buckets: dict, games_per_bracket: int) -> None:
    filled = sum(1 for g in buckets.values() if len(g) >= games_per_bracket)
    total_collected = sum(len(g) for g in buckets.values())
    print(
        f"  Scanned {games_scanned:,} games | "
        f"Collected {total_collected} | "
        f"Full buckets: {filled}/{len(BRACKETS)}",
        file=sys.stderr,
        flush=True,
    )


def print_summary(games_scanned: int, buckets: dict, output_path: str) -> None:
    total = sum(len(g) for g in buckets.values())
    print(f"\n✓ Scanned {games_scanned:,} games from stdin", file=sys.stderr)
    print(f"✓ Wrote {total} games to {output_path}\n", file=sys.stderr)

    print("Elo distribution:", file=sys.stderr)
    partial = []
    for b in sorted(buckets.keys()):
        count = len(buckets[b])
        print(f"  {b}–{b + BRACKET_SIZE - 1}: {count} games", file=sys.stderr)
        if count == 0 or (len(buckets[b]) < len(buckets.get(b, []))):
            partial.append(b)

    incomplete = [b for b in sorted(buckets.keys()) if len(buckets[b]) < max(len(g) for g in buckets.values())]
    if incomplete:
        print(f"\nPartially filled brackets (archive ran out before target):", file=sys.stderr)
        for b in incomplete:
            print(f"  {b}–{b + BRACKET_SIZE - 1}: {len(buckets[b])} games", file=sys.stderr)
    else:
        print("\nPartially filled brackets: None", file=sys.stderr)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract curated chess games from a Lichess PGN stream (stdin) to NDJSON."
    )
    parser.add_argument(
        "--output", default="curated_games.ndjson",
        help="Path to write the NDJSON output file (default: curated_games.ndjson)"
    )
    parser.add_argument(
        "--days", type=int, default=90,
        help="Target number of days to schedule. Determines games_per_bracket = ceil(days / num_brackets). Default: 90"
    )
    args = parser.parse_args()

    games_per_bracket = math.ceil(args.days / len(BRACKETS))
    print(
        f"Target: {args.days} days → {games_per_bracket} games/bracket × {len(BRACKETS)} brackets = "
        f"{games_per_bracket * len(BRACKETS)} total games",
        file=sys.stderr,
    )

    # Fetch IDs already in DB so we never extract the same game twice
    print("\nConnecting to Supabase to fetch existing game IDs...", file=sys.stderr)
    client = create_supabase_client()
    existing_ids = fetch_existing_lichess_ids(client)
    print(f"  {len(existing_ids)} games already in DB — will skip them", file=sys.stderr)

    # Initialise one empty bucket per Elo bracket
    buckets: dict[int, list[dict]] = {b: [] for b in BRACKETS}

    def all_full() -> bool:
        return all(len(buckets[b]) >= games_per_bracket for b in BRACKETS)

    games_scanned = 0
    scans_since_collect = 0  # incremented each scan, reset when a new game is collected
    STALL_LIMIT = 50_000     # give up if no new game collected in this many scans

    # Stream PGN from stdin — memory-efficient even for multi-GB archives
    with io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8", errors="replace") as pgn_stream:
        while not all_full():
            game = chess.pgn.read_game(pgn_stream)
            if game is None:
                # EOF reached before all buckets were filled
                print("\nWarning: archive exhausted before all buckets were filled.", file=sys.stderr)
                break

            games_scanned += 1
            scans_since_collect += 1

            if scans_since_collect >= STALL_LIMIT:
                print(
                    f"\nWarning: no new games collected in {STALL_LIMIT:,} scans — "
                    "remaining brackets are likely too rare in this archive. Stopping.",
                    file=sys.stderr,
                )
                break

            if games_scanned % 10_000 == 0:
                log_progress(games_scanned, buckets, games_per_bracket)

            if not passes_filters(game):
                continue

            row = build_row(game)
            bracket = row["bracket"]

            # Skip games with no Lichess ID (shouldn't happen — means a bug in build_row)
            if not row["lichess_id"]:
                continue

            # Skip games already in the DB
            if row["lichess_id"] in existing_ids:
                continue

            # Only add if this bracket still needs more games
            if len(buckets[bracket]) < games_per_bracket:
                buckets[bracket].append(row)
                scans_since_collect = 0

    # Flatten all buckets, shuffle for true random day-to-day Elo variety, then write
    all_games = [row for b in sorted(buckets.keys()) for row in buckets[b]]
    random.shuffle(all_games)

    with open(args.output, "w", encoding="utf-8") as f:
        for row in all_games:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    print_summary(games_scanned, buckets, args.output)


if __name__ == "__main__":
    main()
