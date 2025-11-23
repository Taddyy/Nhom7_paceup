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
    error_msg = f"""
❌ Import Error Details:
   Error: {e}
   Type: {type(e).__name__}
   Backend path: {backend_dir}
   Backend exists: {os.path.exists(backend_dir)}
   Current dir: {os.getcwd()}
   Python path: {sys.path}
   Traceback:
{traceback.format_exc()}
"""
    print(error_msg, file=sys.stderr)
    raise
except Exception as e:
    import traceback
    error_msg = f"""
❌ Unexpected Error: {e}
   Traceback:
{traceback.format_exc()}
"""
    print(error_msg, file=sys.stderr)
    raise

# Vercel handler function
# Vercel automatically detects ASGI apps when app is exported
# For explicit handler, we can also use: handler = app

