# PowerShell script to run Alembic database migrations
# Usage:
#   .\run_migrations.ps1              # Run all pending migrations
#   .\run_migrations.ps1 -Current     # Show current revision
#   .\run_migrations.ps1 -History      # Show migration history
#   .\run_migrations.ps1 -Heads        # Show head revisions
#   .\run_migrations.ps1 -Downgrade   # Downgrade one revision

param(
    [switch]$Current,
    [switch]$History,
    [switch]$Heads,
    [switch]$Downgrade,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if alembic.ini exists
if (-not (Test-Path (Join-Path $ScriptDir "alembic.ini"))) {
    Write-Host "Error: alembic.ini not found in $ScriptDir" -ForegroundColor Red
    Write-Host "Please run this script from the backend directory." -ForegroundColor Yellow
    exit 1
}

# Change to backend directory
Set-Location $ScriptDir

# Check if alembic is installed
try {
    $null = python -m alembic --version 2>&1
} catch {
    Write-Host "Error: Alembic is not installed." -ForegroundColor Red
    Write-Host "Please install it with: pip install alembic" -ForegroundColor Yellow
    exit 1
}

# Run appropriate command
if ($Help) {
    Get-Help $MyInvocation.MyCommand.Path -Full
    exit 0
}
elseif ($Current) {
    python -m alembic current
}
elseif ($History) {
    python -m alembic history
}
elseif ($Heads) {
    python -m alembic heads
}
elseif ($Downgrade) {
    python -m alembic downgrade -1
}
else {
    # Default: run upgrade head
    Write-Host "Running database migrations..." -ForegroundColor Cyan
    Write-Host ("=" * 50) -ForegroundColor Cyan
    
    python -m alembic upgrade head
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ("=" * 50) -ForegroundColor Cyan
        Write-Host "✓ Migrations completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ("=" * 50) -ForegroundColor Cyan
        Write-Host "✗ Migration failed. Please check the error messages above." -ForegroundColor Red
    }
    
    exit $LASTEXITCODE
}

