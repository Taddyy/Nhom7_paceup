import sys
import os

# Add the backend directory to sys.path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Set working directory to project root for relative imports
os.chdir(os.path.join(os.path.dirname(__file__), '..'))

try:
    from app.main import app
except ImportError as e:
    # Better error message for debugging
    import traceback
    error_msg = f"Failed to import app.main: {e}\n{traceback.format_exc()}"
    print(error_msg, file=sys.stderr)
    raise

# Vercel Serverless Function entry point
# Vercel supports ASGI apps directly, so we just export the app

