#!/usr/bin/env python3
"""
import_games.py — NDJSON → Supabase

Reads the curated NDJSON file produced by extract_games.py (games are
already shuffled at extraction time) and inserts into the games pool.

For daily mode: inserts game into `games` + scheduling row into `daily_schedule`.
For ranked mode: inserts game into `games` only (no schedule row needed —
  ranked games are pulled randomly from the pool at session start).

Usage:
    # Populate daily schedule (one game per calendar day)
    python3 scripts/import_games.py \\
        --input curated_games.ndjson \\
        --mode daily \\
        --days 90

    # Populate games pool for ranked mode (no schedule rows created)
    python3 scripts/import_games.py \\
        --input curated_games.ndjson \\
        --mode ranked

Credentials are loaded from scripts/.env (see scripts/.env.example).
The service role key is required to bypass Row Level Security.

This script performs NO PGN parsing — the heavy lifting was done by
extract_games.py. It is safe to re-run: duplicate lichess_id values
are rejected by the UNIQUE constraint and logged, not silently swallowed.
"""

import argparse
import json
import os
import sys
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

TABLE_GAMES = "games"
TABLE_SCHEDULE = "daily_schedule"


# ---------------------------------------------------------------------------
# Supabase client
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Duplicate detection
# ---------------------------------------------------------------------------

def fetch_existing_lichess_ids(client: Client) -> set[str]:
    """Return the set of lichess_id values already present in the games pool."""
    result = client.table(TABLE_GAMES).select("lichess_id").execute()
    return {row["lichess_id"] for row in result.data if row.get("lichess_id")}


def filter_duplicates(games: list[dict], existing_ids: set[str]) -> tuple[list[dict], list[str]]:
    """
    Split games into (new_games, skipped_ids).
    Logs a warning for each duplicate found.
    """
    new_games: list[dict] = []
    skipped_ids: list[str] = []

    for g in games:
        lid = g["lichess_id"]
        if lid in existing_ids:
            print(f"  Warning: duplicate — {lid} already in DB, skipping", file=sys.stderr)
            skipped_ids.append(lid)
        else:
            new_games.append(g)

    return new_games, skipped_ids


# ---------------------------------------------------------------------------
# Date detection for daily mode
# ---------------------------------------------------------------------------

def detect_start_date(client: Client) -> date:
    """
    Return the next date to schedule in daily_schedule.
    Queries MAX(scheduled_for) and adds one day; falls back to today
    if the table is empty.
    """
    result = (
        client.table(TABLE_SCHEDULE)
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

    today = date.today()
    print(f"  Table is empty — starting from today: {today}", file=sys.stderr)
    return today


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
                row = json.loads(line)
                if not row.get("lichess_id"):
                    sys.exit(
                        f"Error: line {line_number} is missing 'lichess_id'. "
                        "Re-run extract_games.py to regenerate the NDJSON file."
                    )
                games.append(row)
            except json.JSONDecodeError as exc:
                print(f"Warning: skipping malformed line {line_number}: {exc}", file=sys.stderr)

    print(f"  Loaded {len(games)} games from {input_path}", file=sys.stderr)
    return games


# ---------------------------------------------------------------------------
# Insertion
# ---------------------------------------------------------------------------

def insert_games_batch(client: Client, games: list[dict]) -> list[dict]:
    """
    Upsert a batch into the games pool.
    Returns the inserted rows (with their generated UUIDs) for schedule linking.
    """
    batch = [
        {
            "pgn":        g["pgn"],
            "target_elo": g["target_elo"],
            "white_elo":  g["white_elo"],
            "black_elo":  g["black_elo"],
            "lichess_id": g["lichess_id"],
            "metadata":   g["metadata"],
        }
        for g in games
    ]
    result = (
        client.table(TABLE_GAMES)
        .upsert(batch, ignore_duplicates=True)
        .execute()
    )
    return result.data or []


def insert_daily(client: Client, games: list[dict], start_date: date) -> None:
    """
    Insert games into the pool and create daily_schedule rows with sequential dates.
    """
    total = len(games)
    inserted = 0

    for i in range(0, total, BATCH_SIZE):
        batch_games = games[i : i + BATCH_SIZE]

        # 1. Insert game data into the pool
        inserted_rows = insert_games_batch(client, batch_games)

        # Build a lichess_id → uuid map from the inserted rows
        id_map = {row["lichess_id"]: row["id"] for row in inserted_rows if row.get("lichess_id")}

        # Fall back to a DB lookup for rows that were skipped by ignore_duplicates
        missing_ids = [g["lichess_id"] for g in batch_games if g["lichess_id"] not in id_map]
        if missing_ids:
            lookup = (
                client.table(TABLE_GAMES)
                .select("id, lichess_id")
                .in_("lichess_id", missing_ids)
                .execute()
            )
            for row in lookup.data or []:
                if row.get("lichess_id"):
                    id_map[row["lichess_id"]] = row["id"]

        # 2. Insert schedule rows
        schedule_batch = [
            {
                "game_id":      id_map[g["lichess_id"]],
                "scheduled_for": str(start_date + timedelta(days=i + j)),
            }
            for j, g in enumerate(batch_games)
            if g["lichess_id"] in id_map
        ]

        if schedule_batch:
            client.table(TABLE_SCHEDULE).upsert(schedule_batch, ignore_duplicates=True).execute()

        inserted += len(batch_games)
        print(f"  Processed rows {i + 1}–{inserted} / {total}", file=sys.stderr, flush=True)


def insert_ranked(client: Client, games: list[dict]) -> None:
    """Insert games into the pool only (no schedule rows — ranked pulls randomly)."""
    total = len(games)
    inserted = 0

    for i in range(0, total, BATCH_SIZE):
        batch_games = games[i : i + BATCH_SIZE]
        insert_games_batch(client, batch_games)
        inserted += len(batch_games)
        print(f"  Inserted rows {i + 1}–{inserted} / {total}", file=sys.stderr, flush=True)


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

def print_summary(
    games: list[dict],
    mode: str,
    start_date: date | None = None,
    skipped_ids: list[str] | None = None,
) -> None:
    from collections import Counter

    total = len(games)
    print(f"\n✓ Inserted {total} rows into {TABLE_GAMES}", end="")
    if mode == "daily":
        print(f" + {TABLE_SCHEDULE}", end="")
    print()

    if mode == "daily" and start_date is not None:
        end_date = start_date + timedelta(days=total - 1)
        print(f"  Date range: {start_date} → {end_date}")

    if skipped_ids:
        print(f"\n⚠ Skipped {len(skipped_ids)} duplicate(s) already in DB:")
        for lid in skipped_ids:
            print(f"  - {lid}")

    bracket_counts = Counter(g["bracket"] for g in games)
    print("\nElo distribution:")
    for bracket in sorted(bracket_counts.keys()):
        print(f"  {bracket}–{bracket + 99}: {bracket_counts[bracket]} rows")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import curated NDJSON games into Supabase games pool."
    )
    parser.add_argument(
        "--input", default="curated_games.ndjson",
        help="Path to the NDJSON file produced by extract_games.py (default: curated_games.ndjson)"
    )
    parser.add_argument(
        "--mode", required=True, choices=["daily", "ranked"],
        help=(
            "'daily' inserts into games pool + creates daily_schedule rows. "
            "'ranked' inserts into games pool only."
        )
    )
    parser.add_argument(
        "--days", type=int, default=90,
        help="(daily mode only) Expected number of days to schedule. Used for informational output only. Default: 90"
    )
    args = parser.parse_args()

    print("Connecting to Supabase...", file=sys.stderr)
    client = create_supabase_client()

    # --- Load games from NDJSON ---
    print(f"\nLoading games from {args.input}...", file=sys.stderr)
    games = load_games(args.input)
    if not games:
        sys.exit("Error: no games found in input file.")

    # --- Check for duplicates already in the games pool ---
    print(f"\nChecking for duplicates in {TABLE_GAMES}...", file=sys.stderr)
    existing_ids = fetch_existing_lichess_ids(client)
    games, skipped_ids = filter_duplicates(games, existing_ids)
    if not games:
        print(f"\n⚠ All {len(skipped_ids)} games already in DB — nothing to import.", file=sys.stderr)
        for lid in skipped_ids:
            print(f"  - {lid}", file=sys.stderr)
        sys.exit(0)

    # --- Insert ---
    if args.mode == "daily":
        print("\nDetecting start date...", file=sys.stderr)
        start_date = detect_start_date(client)
        print(f"\nInserting {len(games)} games (pool + schedule)...", file=sys.stderr)
        insert_daily(client, games, start_date)
        print_summary(games, "daily", start_date, skipped_ids)

    else:  # ranked
        print(f"\nInserting {len(games)} games into pool...", file=sys.stderr)
        insert_ranked(client, games)
        print_summary(games, "ranked", skipped_ids=skipped_ids)


if __name__ == "__main__":
    main()
