#!/bin/bash
# Bash script to run Alembic database migrations
# Usage:
#   ./run_migrations.sh              # Run all pending migrations
#   ./run_migrations.sh --current    # Show current revision
#   ./run_migrations.sh --history    # Show migration history
#   ./run_migrations.sh --heads      # Show head revisions
#   ./run_migrations.sh --downgrade  # Downgrade one revision

set -e

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if alembic.ini exists
if [ ! -f "$SCRIPT_DIR/alembic.ini" ]; then
    echo "Error: alembic.ini not found in $SCRIPT_DIR"
    echo "Please run this script from the backend directory."
    exit 1
fi

# Change to backend directory
cd "$SCRIPT_DIR"

# Check if alembic is installed
if ! python -m alembic --version > /dev/null 2>&1; then
    echo "Error: Alembic is not installed."
    echo "Please install it with: pip install alembic"
    exit 1
fi

# Parse command line arguments
case "${1:-}" in
    --current)
        python -m alembic current
        ;;
    --history)
        python -m alembic history
        ;;
    --heads)
        python -m alembic heads
        ;;
    --downgrade)
        python -m alembic downgrade -1
        ;;
    --help|-h)
        head -n 8 "$0" | tail -n 7
        exit 0
        ;;
    "")
        # Default: run upgrade head
        echo "Running database migrations..."
        echo "=================================================="
        python -m alembic upgrade head
        EXIT_CODE=$?
        echo "=================================================="
        if [ $EXIT_CODE -eq 0 ]; then
            echo "✓ Migrations completed successfully!"
        else
            echo "✗ Migration failed. Please check the error messages above."
        fi
        exit $EXIT_CODE
        ;;
    *)
        echo "Unknown command: $1"
        echo "Usage: $0 [--current|--history|--heads|--downgrade|--help]"
        exit 1
        ;;
esac

