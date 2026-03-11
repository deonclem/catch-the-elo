#!/usr/bin/env python3
"""
import_games.py — NDJSON → Supabase

Reads the curated NDJSON file produced by extract_games.py, assigns
scheduled dates via round-robin interleaving across Elo brackets, and
bulk-inserts the rows into the target Supabase table.

Usage:
    # Populate daily_games (one game per calendar day)
    python3 scripts/import_games.py \\
        --input curated_games.ndjson \\
        --mode daily \\
        --days 90

    # Populate ranked_games (for ranked mode — table must exist first)
    python3 scripts/import_games.py \\
        --input curated_games.ndjson \\
        --mode ranked

Credentials are loaded from scripts/.env (see scripts/.env.example).
The service role key is required to bypass Row Level Security.

This script performs NO PGN parsing — the heavy lifting was done by
extract_games.py. It is safe to re-run: duplicate scheduled_for dates
are rejected by the UNIQUE constraint and logged, not silently swallowed.
"""

import argparse
import json
import os
import random
import sys
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client


# ---------------------------------------------------------------------------
# Batch size for Supabase inserts (stay well under the 1 MB request limit)
# ---------------------------------------------------------------------------

BATCH_SIZE = 100

# ---------------------------------------------------------------------------
# Table names
# ---------------------------------------------------------------------------

TABLE_DAILY = "daily_games"
TABLE_RANKED = "ranked_games"


# ---------------------------------------------------------------------------
# Supabase client
# ---------------------------------------------------------------------------

def create_supabase_client() -> Client:
    """Load credentials from scripts/.env and return an authenticated client."""
    # Look for .env relative to this script's directory
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


# ---------------------------------------------------------------------------
# Date detection for daily mode
# ---------------------------------------------------------------------------

def detect_start_date(client: Client) -> date:
    """
    Return the next date to schedule in daily_games.
    Queries MAX(scheduled_for) and adds one day; falls back to tomorrow
    if the table is empty.
    """
    result = (
        client.table(TABLE_DAILY)
        .select("scheduled_for")
        .order("scheduled_for", desc=True)
        .limit(1)
        .execute()
    )

    if result.data:
        last_date = date.fromisoformat(result.data[0]["scheduled_for"])
        next_date = last_date + timedelta(days=1)
        print(f"  Last scheduled date in DB: {last_date}", file=sys.stderr)
        print(f"  Starting from: {next_date}", file=sys.stderr)
        return next_date

    tomorrow = date.today() + timedelta(days=1)
    print(f"  Table is empty — starting from tomorrow: {tomorrow}", file=sys.stderr)
    return tomorrow


# ---------------------------------------------------------------------------
# Ranked mode guard
# ---------------------------------------------------------------------------

def verify_ranked_table(client: Client) -> None:
    """Exit with a clear message if ranked_games table does not exist yet."""
    try:
        client.table(TABLE_RANKED).select("id").limit(1).execute()
    except Exception as exc:
        sys.exit(
            f"Error: '{TABLE_RANKED}' table does not exist or is not accessible.\n"
            f"Run the ranked_games migration first.\n"
            f"Details: {exc}"
        )


# ---------------------------------------------------------------------------
# NDJSON loading
# ---------------------------------------------------------------------------

def load_games(input_path: str) -> list[dict]:
    """Load all games from the NDJSON file produced by extract_games.py."""
    games = []
    path = Path(input_path)
    if not path.exists():
        sys.exit(f"Error: input file '{input_path}' not found.")

    with open(path, encoding="utf-8") as f:
        for line_number, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                games.append(json.loads(line))
            except json.JSONDecodeError as exc:
                print(f"Warning: skipping malformed line {line_number}: {exc}", file=sys.stderr)

    print(f"  Loaded {len(games)} games from {input_path}", file=sys.stderr)
    return games


# ---------------------------------------------------------------------------
# Round-robin interleaving for homogeneous daily scheduling
# ---------------------------------------------------------------------------

def interleave_by_bracket(games: list[dict]) -> list[dict]:
    """
    Group games by Elo bracket, shuffle within each bracket, then interleave
    via round-robin across sorted brackets.

    Result: consecutive days cycle through the full Elo spectrum, e.g.:
      Day 1: ~800 elo
      Day 2: ~900 elo
      ...
      Day 20: ~2700 elo
      Day 21: ~800 elo (second game from that bracket)
      ...

    This ensures both homogeneous distribution and day-to-day variety.
    """
    buckets: dict[int, list[dict]] = defaultdict(list)
    for game in games:
        buckets[game["bracket"]].append(game)

    # Shuffle within each bracket for intra-bracket randomness
    for bracket in buckets:
        random.shuffle(buckets[bracket])

    # Round-robin across sorted brackets
    sorted_brackets = sorted(buckets.keys())
    ordered: list[dict] = []
    while any(buckets[b] for b in sorted_brackets):
        for b in sorted_brackets:
            if buckets[b]:
                ordered.append(buckets[b].pop(0))

    return ordered


# ---------------------------------------------------------------------------
# Insertion
# ---------------------------------------------------------------------------

def insert_daily(client: Client, games: list[dict], start_date: date) -> None:
    """
    Insert games into daily_games with sequential scheduled_for dates
    starting from start_date. Uses batched inserts.
    """
    total = len(games)
    inserted = 0

    for i in range(0, total, BATCH_SIZE):
        batch_games = games[i : i + BATCH_SIZE]
        batch = [
            {
                "scheduled_for": str(start_date + timedelta(days=i + j)),
                "pgn":           g["pgn"],
                "target_elo":    g["target_elo"],
                "white_elo":     g["white_elo"],
                "black_elo":     g["black_elo"],
                "metadata":      g["metadata"],
            }
            for j, g in enumerate(batch_games)
        ]

        client.table(TABLE_DAILY).insert(batch).execute()
        inserted += len(batch)
        print(f"  Inserted rows {i + 1}–{inserted} / {total}", file=sys.stderr, flush=True)


def insert_ranked(client: Client, games: list[dict]) -> None:
    """Insert games into ranked_games (no date assignment)."""
    total = len(games)
    inserted = 0

    for i in range(0, total, BATCH_SIZE):
        batch_games = games[i : i + BATCH_SIZE]
        batch = [
            {
                "pgn":        g["pgn"],
                "target_elo": g["target_elo"],
                "white_elo":  g["white_elo"],
                "black_elo":  g["black_elo"],
                "metadata":   g["metadata"],
            }
            for g in batch_games
        ]

        client.table(TABLE_RANKED).insert(batch).execute()
        inserted += len(batch)
        print(f"  Inserted rows {i + 1}–{inserted} / {total}", file=sys.stderr, flush=True)


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

def print_summary(games: list[dict], mode: str, start_date: date | None = None) -> None:
    total = len(games)
    print(f"\n✓ Inserted {total} rows into {TABLE_DAILY if mode == 'daily' else TABLE_RANKED}")

    if mode == "daily" and start_date is not None:
        end_date = start_date + timedelta(days=total - 1)
        print(f"  Date range: {start_date} → {end_date}")

    # Elo distribution breakdown
    from collections import Counter
    bracket_counts = Counter(g["bracket"] for g in games)
    print("\nElo distribution:")
    for bracket in sorted(bracket_counts.keys()):
        print(f"  {bracket}–{bracket + 99}: {bracket_counts[bracket]} rows")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import curated NDJSON games into Supabase (daily_games or ranked_games)."
    )
    parser.add_argument(
        "--input", default="curated_games.ndjson",
        help="Path to the NDJSON file produced by extract_games.py (default: curated_games.ndjson)"
    )
    parser.add_argument(
        "--mode", required=True, choices=["daily", "ranked"],
        help="'daily' inserts into daily_games with scheduled dates. 'ranked' inserts into ranked_games."
    )
    parser.add_argument(
        "--days", type=int, default=90,
        help="(daily mode only) Expected number of days to schedule. Used for informational output only. Default: 90"
    )
    args = parser.parse_args()

    print("Connecting to Supabase...", file=sys.stderr)
    client = create_supabase_client()

    # --- Validate target table exists ---
    if args.mode == "ranked":
        print(f"Verifying '{TABLE_RANKED}' table exists...", file=sys.stderr)
        verify_ranked_table(client)

    # --- Load games from NDJSON ---
    print(f"\nLoading games from {args.input}...", file=sys.stderr)
    games = load_games(args.input)
    if not games:
        sys.exit("Error: no games found in input file.")

    # --- Interleave for scheduling variety ---
    print("\nInterleaving by Elo bracket (round-robin)...", file=sys.stderr)
    ordered_games = interleave_by_bracket(games)

    # --- Insert ---
    if args.mode == "daily":
        print("\nDetecting start date...", file=sys.stderr)
        start_date = detect_start_date(client)
        print(f"\nInserting {len(ordered_games)} rows into {TABLE_DAILY}...", file=sys.stderr)
        insert_daily(client, ordered_games, start_date)
        print_summary(ordered_games, "daily", start_date)

    else:  # ranked
        print(f"\nInserting {len(ordered_games)} rows into {TABLE_RANKED}...", file=sys.stderr)
        insert_ranked(client, ordered_games)
        print_summary(ordered_games, "ranked")


if __name__ == "__main__":
    main()
