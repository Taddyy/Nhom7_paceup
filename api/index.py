"""
Vercel Serverless Function entry point for FastAPI
Updated: 2025-11-23 - Force redeploy
"""
import sys
import os

# Get absolute path to project root
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
backend_path = os.path.join(project_root, 'backend')

# Add backend to Python path
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Change to backend directory for imports
os.chdir(backend_path)

try:
    # Import FastAPI app
    from app.main import app
    print(f"✅ Successfully imported app from {backend_path}", file=sys.stderr)
except Exception as e:
    # Detailed error for debugging
    import traceback
    error_details = {
        "error": str(e),
        "error_type": type(e).__name__,
        "traceback": traceback.format_exc(),
        "sys_path": sys.path,
        "cwd": os.getcwd(),
        "backend_path": backend_path,
        "project_root": project_root
    }
    error_msg = f"❌ Failed to import app.main:\n{error_details}"
    print(error_msg, file=sys.stderr)
    raise

# Export app for Vercel
# Vercel will automatically detect ASGI apps

