"""
PLAYSPORT — Full SQLite to PostgreSQL Data Migration Script
============================================================
This script migrates all table structures, constraints, and data from 
the local SQLite database (playsport.db) into a PostgreSQL target database.

Usage:
  source venv/bin/activate
  python migrate_to_postgres.py --postgres-url "postgresql://postgres:postgres@localhost:5432/playsport"
"""

import sys
import os
import argparse
from sqlalchemy import create_engine, MetaData, Table, inspect, text
from sqlalchemy.orm import sessionmaker

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base
import app.models  # Register all models for metadata creation

def run_migration(sqlite_path: str, postgres_url: str):
    print("=" * 65)
    print("🚀 PLAYSPORT — Full SQLite to PostgreSQL Migration Tool")
    print("=" * 65)
    print(f"📦 Source SQLite DB  : {sqlite_path}")
    print(f"🐘 Target PostgreSQL : {postgres_url}")
    print("-" * 65)

    if not os.path.exists(sqlite_path):
        print(f"❌ Error: SQLite source database file '{sqlite_path}' not found.")
        sys.exit(1)

    # 1. Create engines with auto-create database support
    try:
        pg_engine = create_engine(postgres_url, pool_pre_ping=True)
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        if "does not exist" in str(e):
            print("💡 Target database does not exist yet. Creating database automatically...")
            import psycopg2
            from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
            from urllib.parse import urlparse
            parsed = urlparse(postgres_url)
            db_name = parsed.path.lstrip('/') or 'playsport'
            user_name = parsed.username or 'postgres'
            pass_word = parsed.password or ''
            host_name = parsed.hostname or 'localhost'
            port_num = parsed.port or 5432

            conn = psycopg2.connect(dbname='postgres', user=user_name, password=pass_word, host=host_name, port=port_num)
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            cursor.execute(f'CREATE DATABASE "{db_name}";')
            cursor.close()
            conn.close()
            print(f"✅ Database '{db_name}' created.")
            pg_engine = create_engine(postgres_url, pool_pre_ping=True)
        else:
            print(f"❌ PostgreSQL Connection Error: {e}")
            sys.exit(1)

    sqlite_engine = create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})

    # 3. Create all tables in PostgreSQL
    print("\n🔨 Creating PostgreSQL table schemas...")
    Base.metadata.create_all(bind=pg_engine)
    print("✅ PostgreSQL table schemas created successfully.")

    # 4. Table data migration order (handling foreign key dependencies)
    table_order = [
        "users",
        "turfs",
        "grounds",
        "time_slots",
        "bookings",
        "payments",
        "open_matches",
        "match_participants",
        "tournaments",
        "equipment",
        "reviews",
        "notifications",
        "audit_logs"
    ]

    sqlite_inspector = inspect(sqlite_engine)
    existing_tables = sqlite_inspector.get_table_names()

    print("\n📦 Migrating data table by table...")

    sqlite_meta = MetaData()
    sqlite_meta.reflect(bind=sqlite_engine)

    pg_meta = MetaData()
    pg_meta.reflect(bind=pg_engine)

    with sqlite_engine.connect() as sqlite_conn, pg_engine.begin() as pg_conn:
        # Temporarily disable referential integrity checks during batch insert if possible
        for table_name in table_order:
            if table_name not in existing_tables:
                print(f"  - Table '{table_name}' not in SQLite, skipping.")
                continue

            src_table = Table(table_name, sqlite_meta, autoload_with=sqlite_engine)
            dst_table = Table(table_name, pg_meta, autoload_with=pg_engine)

            # Fetch rows from SQLite
            rows = sqlite_conn.execute(src_table.select()).mappings().all()
            if not rows:
                print(f"  - Table '{table_name}': 0 rows.")
                continue

            # Convert row mappings to list of dicts
            data = [dict(row) for row in rows]

            # Clear destination table first to prevent duplicate key errors
            pg_conn.execute(text(f'TRUNCATE TABLE "{table_name}" CASCADE;'))

            # Insert batch into PostgreSQL
            pg_conn.execute(dst_table.insert(), data)
            print(f"  ✅ Table '{table_name}': Successfully migrated {len(data)} rows.")

        # Reset PostgreSQL primary key auto-increment sequences
        print("\n🔄 Resetting PostgreSQL primary key sequences...")
        for table_name in table_order:
            if table_name in existing_tables:
                seq_query = text(f"""
                    SELECT setval(
                        pg_get_serial_sequence('"{table_name}"', 'id'),
                        COALESCE((SELECT MAX(id) FROM "{table_name}"), 1),
                        true
                    );
                """)
                try:
                    pg_conn.execute(seq_query)
                except Exception:
                    pass  # Ignore if table doesn't have serial id sequence

    print("\n" + "=" * 65)
    print("🎉 FULL MIGRATION COMPLETE!")
    print("=" * 65)
    print("To use PostgreSQL in your backend, set environment variable:")
    print(f'  export DATABASE_URL="{postgres_url}"')
    print("=" * 65)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate PLAYSPORT from SQLite to PostgreSQL")
    parser.add_argument("--sqlite-path", default="playsport.db", help="Path to source playsport.db")
    parser.add_argument("--postgres-url", default=os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/playsport"), help="PostgreSQL Connection URL")

    args = parser.parse_args()
    run_migration(args.sqlite_path, args.postgres_url)
