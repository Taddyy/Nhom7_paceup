#!/usr/bin/env python3
"""
Script to run Alembic database migrations.

This script can be run from the backend directory or from the project root.
It will automatically detect the correct path and run migrations.

Usage:
    python run_migrations.py              # Run all pending migrations
    python run_migrations.py --current    # Show current revision
    python run_migrations.py --history    # Show migration history
    python run_migrations.py --heads      # Show head revisions
    python run_migrations.py --downgrade  # Downgrade one revision
"""

import os
import sys
import subprocess
from pathlib import Path


def get_backend_dir() -> Path:
    """Get the backend directory path."""
    # Get the directory where this script is located
    script_dir = Path(__file__).parent.absolute()
    
    # If script is in backend/, return it
    if (script_dir / "alembic.ini").exists():
        return script_dir
    
    # If script is in project root, look for backend/
    backend_dir = script_dir / "backend"
    if (backend_dir / "alembic.ini").exists():
        return backend_dir
    
    # Otherwise, assume we're in backend/ already
    return script_dir


def check_alembic_installed() -> bool:
    """Check if alembic is installed."""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "--version"],
            capture_output=True,
            text=True,
            cwd=get_backend_dir()
        )
        return result.returncode == 0
    except Exception:
        return False


def run_alembic_command(command: list[str]) -> int:
    """Run an alembic command and return the exit code."""
    backend_dir = get_backend_dir()
    
    # Check if we're in the right directory
    if not (backend_dir / "alembic.ini").exists():
        print(f"Error: alembic.ini not found in {backend_dir}")
        print("Please run this script from the backend directory or project root.")
        return 1
    
    # Check if alembic is installed
    if not check_alembic_installed():
        print("Error: Alembic is not installed.")
        print("Please install it with: pip install alembic")
        return 1
    
    # Run the command
    try:
        result = subprocess.run(
            [sys.executable, "-m", "alembic"] + command,
            cwd=backend_dir,
            check=False
        )
        return result.returncode
    except KeyboardInterrupt:
        print("\nMigration interrupted by user.")
        return 1
    except Exception as e:
        print(f"Error running migration: {e}")
        return 1


def main():
    """Main entry point."""
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "--current":
            exit_code = run_alembic_command(["current"])
        elif command == "--history":
            exit_code = run_alembic_command(["history"])
        elif command == "--heads":
            exit_code = run_alembic_command(["heads"])
        elif command == "--downgrade":
            exit_code = run_alembic_command(["downgrade", "-1"])
        elif command == "--help" or command == "-h":
            print(__doc__)
            exit_code = 0
        else:
            print(f"Unknown command: {command}")
            print(__doc__)
            exit_code = 1
    else:
        # Default: run upgrade head
        print("Running database migrations...")
        print("=" * 50)
        exit_code = run_alembic_command(["upgrade", "head"])
        print("=" * 50)
        if exit_code == 0:
            print("✓ Migrations completed successfully!")
        else:
            print("✗ Migration failed. Please check the error messages above.")
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

