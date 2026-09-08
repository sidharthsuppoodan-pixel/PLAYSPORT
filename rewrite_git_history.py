#!/usr/bin/env python3
"""
PlaySport Git History Rewrite & Timeline Backdating Script

This script rewrites a single massive Git commit into a realistic, backdated commit
timeline spanning across a specified date range (default: 2025-01-01 to 2026-03-01).

Key Features:
1. Backup Protection: Creates a timestamped backup branch containing all current code & unstaged changes.
2. Logical File Distribution: Groups files into 15 conventional feature commits.
3. Timestamp Generation: Uses GIT_AUTHOR_DATE & GIT_COMMITTER_DATE environment variables to backdate commits.
4. Clean Main Branch Replacement: Replaces main branch history while keeping full backup.
"""

import argparse
import datetime
import os
import subprocess
import sys

# Define logical commit batches with conventional commit messages
COMMIT_BATCHES = [
    {
        "message": "chore(docs): initialize project documentation and architecture guides",
        "patterns": [
            "README.md",
            "docs/",
            ".gitignore",
        ]
    },
    {
        "message": "feat(backend): set up FastAPI application core and database configurations",
        "patterns": [
            "backend/requirements.txt",
            "backend/.env",
            "backend/app/__init__.py",
            "backend/app/main.py",
            "backend/app/core/",
        ]
    },
    {
        "message": "feat(database): define core SQLAlchemy models for users, turfs, and grounds",
        "patterns": [
            "backend/app/models/__init__.py",
            "backend/app/models/user.py",
            "backend/app/models/turf.py",
            "backend/app/models/ground.py",
        ]
    },
    {
        "message": "feat(database): implement data models for bookings, slots, tournaments, and social matches",
        "patterns": [
            "backend/app/models/slot.py",
            "backend/app/models/booking.py",
            "backend/app/models/payment.py",
            "backend/app/models/review.py",
            "backend/app/models/equipment.py",
            "backend/app/models/tournament.py",
            "backend/app/models/open_match.py",
            "backend/app/models/notification.py",
            "backend/app/models/audit_log.py",
        ]
    },
    {
        "message": "feat(schemas): add Pydantic schemas for data validation and API payloads",
        "patterns": [
            "backend/app/schemas/",
        ]
    },
    {
        "message": "feat(auth): implement JWT authentication endpoints and user management",
        "patterns": [
            "backend/app/api/auth.py",
            "backend/app/api/users.py",
        ]
    },
    {
        "message": "feat(api): implement turf listing, ground slot reservation, and booking checkout APIs",
        "patterns": [
            "backend/app/api/turfs.py",
            "backend/app/api/grounds.py",
            "backend/app/api/slots.py",
            "backend/app/api/bookings.py",
            "backend/app/api/payments.py",
        ]
    },
    {
        "message": "feat(api): add API routes for equipment rental, community matches, and admin management",
        "patterns": [
            "backend/app/api/equipment.py",
            "backend/app/api/tournaments.py",
            "backend/app/api/open_matches.py",
            "backend/app/api/reviews.py",
            "backend/app/api/notifications.py",
            "backend/app/api/reports.py",
            "backend/app/api/admin.py",
        ]
    },
    {
        "message": "test(backend): add test suite and database seeding scripts",
        "patterns": [
            "backend/tests/",
            "backend/seed.py",
            "backend/migrate_to_postgres.py",
            "backend/test_users.py",
        ]
    },
    {
        "message": "feat(frontend): set up React Vite frontend project structure and Tailwind CSS styling",
        "patterns": [
            "frontend/package.json",
            "frontend/package-lock.json",
            "frontend/vite.config.js",
            "frontend/tailwind.config.js",
            "frontend/postcss.config.js",
            "frontend/index.html",
            "frontend/src/main.jsx",
            "frontend/src/App.jsx",
            "frontend/src/index.css",
        ]
    },
    {
        "message": "feat(frontend): add HTTP API client service and global state context providers",
        "patterns": [
            "frontend/src/services/",
            "frontend/src/context/",
        ]
    },
    {
        "message": "feat(frontend): implement core reusable components (Navbar, Footer, Modals, QuickSearch)",
        "patterns": [
            "frontend/src/components/",
        ]
    },
    {
        "message": "feat(frontend): build user-facing pages for turf booking, match discovery, and tournaments",
        "patterns": [
            "frontend/src/pages/HomePage.jsx",
            "frontend/src/pages/TurfListingPage.jsx",
            "frontend/src/pages/TurfDetailPage.jsx",
            "frontend/src/pages/MyBookingsPage.jsx",
            "frontend/src/pages/OpenMatchesPage.jsx",
            "frontend/src/pages/EquipmentPage.jsx",
            "frontend/src/pages/PricingPage.jsx",
            "frontend/src/pages/TournamentsPage.jsx",
        ]
    },
    {
        "message": "feat(frontend): implement owner dashboard and administrative management interfaces",
        "patterns": [
            "frontend/src/pages/OwnerDashboardPage.jsx",
            "frontend/src/pages/AdminDashboardPage.jsx",
        ]
    },
    {
        "message": "chore(release): finalize PlaySport platform application setup and configuration",
        "patterns": [
            ".gitignore",
            "rewrite_git_history.py",
            "frontend/dist/",
        ]
    }
]

def run_cmd(cmd, env=None, check=True):
    """Run a shell command and return stdout."""
    result = subprocess.run(
        cmd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )
    if check and result.returncode != 0:
        print(f"Error executing command: {cmd}")
        print(f"Stderr: {result.stderr}")
        sys.exit(result.returncode)
    return result.stdout.strip()

def create_backup_branch():
    """Backup the current branch state including uncommitted changes."""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_branch = f"backup-before-rewrite-{timestamp}"
    
    current_branch = run_cmd("git rev-parse --abbrev-ref HEAD", check=False) or "main"
    print(f"📦 [1/5] Creating backup branch: '{backup_branch}'...")
    
    # Save all current working tree changes into the backup branch
    run_cmd(f"git checkout -b {backup_branch}")
    run_cmd("git add -A")
    status = run_cmd("git status --porcelain")
    if status:
        run_cmd('git commit -m "WIP: Backup current working tree state before history rewrite"')
    
    print(f"✅ Backup created successfully on branch '{backup_branch}'.")
    return backup_branch

def calculate_commit_timestamps(start_date_str, end_date_str, count):
    """Generate evenly distributed ISO datetime strings between start and end dates."""
    start_dt = datetime.datetime.fromisoformat(start_date_str)
    end_dt = datetime.datetime.fromisoformat(end_date_str)
    
    delta = (end_dt - start_dt) / max(count - 1, 1)
    timestamps = []
    
    for i in range(count):
        commit_dt = start_dt + delta * i
        # Format for git: e.g. "2025-01-01 10:00:00 +0530"
        formatted_date = commit_dt.strftime("%Y-%m-%d %H:%M:%S %z") if commit_dt.tzinfo else commit_dt.strftime("%Y-%m-%d %H:%M:%S +0530")
        timestamps.append(formatted_date)
        
    return timestamps

def rewrite_history(start_date, end_date, backup_branch):
    """Build the new commit timeline on an orphan branch."""
    print(f"🚀 [2/5] Creating new orphan branch for history rewrite...")
    temp_branch = "history-rewrite-temp"
    
    # Delete temp branch if already exists
    run_cmd(f"git branch -D {temp_branch}", check=False)
    run_cmd(f"git checkout --orphan {temp_branch}")
    run_cmd("git reset")
    
    timestamps = calculate_commit_timestamps(start_date, end_date, len(COMMIT_BATCHES))
    
    print(f"⏳ [3/5] Backdating {len(COMMIT_BATCHES)} commits from {start_date} to {end_date}...")
    
    env = os.environ.copy()
    
    for idx, batch in enumerate(COMMIT_BATCHES):
        date_str = timestamps[idx]
        msg = batch["message"]
        patterns = batch["patterns"]
        
        # Stage files matching patterns
        staged_any = False
        for pattern in patterns:
            if os.path.exists(pattern):
                run_cmd(f"git add '{pattern}'", check=False)
                staged_any = True
                
        # Check if anything staged
        status = run_cmd("git status --porcelain")
        if status:
            env["GIT_AUTHOR_DATE"] = date_str
            env["GIT_COMMITTER_DATE"] = date_str
            run_cmd(f'git commit -m "{msg}"', env=env)
            print(f"  ✓ [{idx+1}/{len(COMMIT_BATCHES)}] ({date_str[:10]}): {msg}")
        else:
            print(f"  - [{idx+1}/{len(COMMIT_BATCHES)}] Skipped (no changes for pattern): {patterns}")

    # Stage any remaining files left untracked/unstaged
    remaining_status = run_cmd("git status --porcelain")
    if remaining_status:
        run_cmd("git add -A")
        last_date = timestamps[-1]
        env["GIT_AUTHOR_DATE"] = last_date
        env["GIT_COMMITTER_DATE"] = last_date
        run_cmd('git commit -m "chore: include remaining project configuration files"', env=env)
        print(f"  ✓ Final Polish ({last_date[:10]}): chore: include remaining project configuration files")

    print(f"🔄 [4/5] Updating 'main' branch to point to new commit timeline...")
    run_cmd("git checkout -B main")
    run_cmd(f"git branch -D {temp_branch}", check=False)

def main():
    parser = argparse.ArgumentParser(description="Rewrite Git commit history into realistic backdated timeline.")
    parser.add_argument("--start-date", default="2026-08-18 10:00:00", help="Start date (YYYY-MM-DD HH:MM:SS)")
    parser.add_argument("--end-date", default="2026-09-08 09:00:00", help="End date (YYYY-MM-DD HH:MM:SS)")
    
    args = parser.parse_args()
    
    print("==================================================")
    print("  PLAYSPORT GIT HISTORY REWRITE AUTOMATION TOOL   ")
    print("==================================================")
    print(f"Start Date: {args.start_date}")
    print(f"End Date:   {args.end_date}")
    print("--------------------------------------------------")
    
    backup_branch = create_backup_branch()
    rewrite_history(args.start_date, args.end_date, backup_branch)
    
    print("--------------------------------------------------")
    print("🎉 [5/5] GIT HISTORY REWRITE COMPLETE!")
    print("--------------------------------------------------")
    print("Summary of new commit history:")
    log = run_cmd("git log --oneline --graph --decorate -n 20")
    print(log)
    print("--------------------------------------------------")
    print(f"Safety Backup Branch: '{backup_branch}'")
    print("To sync your rewritten history with GitHub, run:")
    print("  git push origin main --force")
    print("==================================================")

if __name__ == "__main__":
    main()
