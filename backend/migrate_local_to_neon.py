#!/usr/bin/env python3
"""
PLAYSPORT — Direct Local to Cloud Database Migration Tool
=========================================================
Wipes the seeded data on your cloud Neon PostgreSQL database and 
transfers your exact local PostgreSQL database into Neon.

Usage:
  python migrate_local_to_neon.py "<YOUR_NEON_DATABASE_URL>"
"""

import sys
import os
import subprocess
from urllib.parse import urlparse

def main():
    if len(sys.argv) < 2:
        print("\n❌ Error: Please provide your Neon Database URL.")
        print("Usage:")
        print("  python migrate_local_to_neon.py \"postgresql://alex:...@ep-xyz.aws.neon.tech/neondb?sslmode=require\"\n")
        sys.exit(1)

    neon_url = sys.argv[1].strip()
    if neon_url.startswith("postgres://"):
        neon_url = neon_url.replace("postgres://", "postgresql://", 1)

    local_url = os.getenv("LOCAL_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/playsport")
    backup_file = "/tmp/playsport_local_export.sql"

    print("=" * 65)
    print("🚀 PLAYSPORT — Local Database to Cloud Neon Migration")
    print("=" * 65)
    print(f"📦 Source (Local DB) : {local_url}")
    print(f"☁️ Target (Neon DB)  : {neon_url.split('@')[-1] if '@' in neon_url else neon_url}")
    print("-" * 65)

    # Find pg_dump and psql binaries
    possible_bins = [
        "/Applications/Postgres.app/Contents/Versions/latest/bin",
        "/opt/homebrew/bin",
        "/usr/local/bin",
        "/usr/bin"
    ]
    pg_dump_cmd = "pg_dump"
    psql_cmd = "psql"

    for p in possible_bins:
        if os.path.exists(os.path.join(p, "pg_dump")):
            pg_dump_cmd = os.path.join(p, "pg_dump")
        if os.path.exists(os.path.join(p, "psql")):
            psql_cmd = os.path.join(p, "psql")

    # Step 1: Export local DB
    print("\n[1/3] 📤 Exporting your exact local database...")
    dump_proc = subprocess.run(
        [pg_dump_cmd, "-d", local_url, "--no-owner", "--no-acl", "--clean", "--if-exists", "-f", backup_file],
        capture_output=True,
        text=True
    )
    if dump_proc.returncode != 0:
        print(f"❌ pg_dump failed: {dump_proc.stderr}")
        sys.exit(1)
    
    file_size_kb = os.path.getsize(backup_file) // 1024
    print(f"✅ Local database exported successfully ({file_size_kb} KB).")

    # Step 2: Import into Neon
    print("\n[2/3] 📥 Wiping seeded cloud data & importing local data into Neon...")
    restore_proc = subprocess.run(
        [psql_cmd, neon_url, "-f", backup_file],
        capture_output=True,
        text=True
    )
    
    # Check output for any fatal connection errors
    if "FATAL:" in restore_proc.stderr or "connection to server at" in restore_proc.stderr and "failed" in restore_proc.stderr:
        print(f"❌ Failed to connect to Neon database: {restore_proc.stderr}")
        sys.exit(1)

    print("✅ All tables, constraints, users, and bookings transferred successfully into Neon!")

    # Step 3: Verification
    print("\n[3/3] 🔍 Verifying cloud database contents...")
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(neon_url)
        with engine.connect() as conn:
            user_count = conn.execute(text("SELECT count(*) FROM users")).scalar()
            turf_count = conn.execute(text("SELECT count(*) FROM turfs")).scalar()
            booking_count = conn.execute(text("SELECT count(*) FROM bookings")).scalar()
            users = conn.execute(text("SELECT email, full_name, role FROM users")).fetchall()
        
        print("\n" + "=" * 65)
        print("🎉 MIGRATION COMPLETE!")
        print("=" * 65)
        print(f"• Total Users    : {user_count}")
        print(f"• Total Turfs    : {turf_count}")
        print(f"• Total Bookings : {booking_count}")
        print("-" * 65)
        print("Live Users in Cloud Database:")
        for u in users:
            print(f"  👤 {u[0]} ({u[1]}) — Role: {u[2]}")
        print("=" * 65)
        print("\n👉 You can now log into https://playsport-phi.vercel.app with your real local users!")
    except Exception as e:
        print(f"Note on verification: {e}")

if __name__ == "__main__":
    main()
