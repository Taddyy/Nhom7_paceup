"""
Vercel Serverless Function entry point for FastAPI
"""
import sys
import os

# Get absolute paths
current_file = os.path.abspath(__file__)
api_dir = os.path.dirname(current_file)
project_root = os.path.dirname(api_dir)
backend_dir = os.path.join(project_root, 'backend')

# Add backend to Python path (must be absolute)
if os.path.exists(backend_dir) and backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Set working directory to backend for relative imports
if os.path.exists(backend_dir):
    os.chdir(backend_dir)

# Import FastAPI app
try:
    from app.main import app
except ImportError as e:
    # Print detailed error for debugging
    import traceback
    print(f"❌ Import Error Details:", file=sys.stderr)
    print(f"   Error: {e}", file=sys.stderr)
    print(f"   Type: {type(e).__name__}", file=sys.stderr)
    print(f"   Backend path: {backend_dir}", file=sys.stderr)
    print(f"   Backend exists: {os.path.exists(backend_dir)}", file=sys.stderr)
    print(f"   Current dir: {os.getcwd()}", file=sys.stderr)
    print(f"   Python path: {sys.path}", file=sys.stderr)
    print(f"   Traceback:\n{traceback.format_exc()}", file=sys.stderr)
    raise
except Exception as e:
    import traceback
    print(f"❌ Unexpected Error: {e}", file=sys.stderr)
    print(f"   Traceback:\n{traceback.format_exc()}", file=sys.stderr)
    raise

# Vercel handler - export app directly
# Vercel automatically detects ASGI apps (FastAPI)

