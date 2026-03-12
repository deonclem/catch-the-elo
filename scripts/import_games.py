#!/usr/bin/env python3
"""
import_games.py — NDJSON → Supabase

Reads the curated NDJSON file produced by extract_games.py (games are
already shuffled at extraction time) and assigns sequential scheduled_for
dates starting from today, then bulk-inserts into the target Supabase table.

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
# Duplicate detection
# ---------------------------------------------------------------------------

def fetch_existing_lichess_ids(client: Client, table: str) -> set[str]:
    """Return the set of lichess_id values already present in the given table."""
    result = client.table(table).select("lichess_id").execute()
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
    Return the next date to schedule in daily_games.
    Queries MAX(scheduled_for) and adds one day; falls back to today
    if the table is empty (so the first import always has a game for the current day).
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

    today = date.today()
    print(f"  Table is empty — starting from today: {today}", file=sys.stderr)
    return today


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
                "lichess_id":    g["lichess_id"],
                "metadata":      g["metadata"],
            }
            for j, g in enumerate(batch_games)
        ]

        client.table(TABLE_DAILY).upsert(batch, ignore_duplicates=True).execute()
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
                "lichess_id": g["lichess_id"],
                "metadata":   g["metadata"],
            }
            for g in batch_games
        ]

        client.table(TABLE_RANKED).upsert(batch, ignore_duplicates=True).execute()
        inserted += len(batch)
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
    table = TABLE_DAILY if mode == "daily" else TABLE_RANKED
    print(f"\n✓ Inserted {total} rows into {table}")

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

    # --- Check for duplicates already in the target table ---
    target_table = TABLE_DAILY if args.mode == "daily" else TABLE_RANKED
    print(f"\nChecking for duplicates in {target_table}...", file=sys.stderr)
    existing_ids = fetch_existing_lichess_ids(client, target_table)
    games, skipped_ids = filter_duplicates(games, existing_ids)
    if not games:
        print(f"\n⚠ All {len(skipped_ids)} games already in DB — nothing to import.", file=sys.stderr)
        for lid in skipped_ids:
            print(f"  - {lid}", file=sys.stderr)
        sys.exit(0)

    # --- Insert (ordering was fixed at extraction time by extract_games.py) ---
    if args.mode == "daily":
        print("\nDetecting start date...", file=sys.stderr)
        start_date = detect_start_date(client)
        print(f"\nInserting {len(games)} rows into {TABLE_DAILY}...", file=sys.stderr)
        insert_daily(client, games, start_date)
        print_summary(games, "daily", start_date, skipped_ids)

    else:  # ranked
        print(f"\nInserting {len(games)} rows into {TABLE_RANKED}...", file=sys.stderr)
        insert_ranked(client, games)
        print_summary(games, "ranked", skipped_ids=skipped_ids)


if __name__ == "__main__":
    main()
