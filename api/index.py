"""
Vercel Serverless Function entry point for FastAPI
"""
import sys
import os

# Debug: Print environment info
print("=== Vercel Python Function Startup ===", file=sys.stderr)
print(f"Python version: {sys.version}", file=sys.stderr)
print(f"Current file: {__file__}", file=sys.stderr)
print(f"Current dir: {os.getcwd()}", file=sys.stderr)
print(f"Python path: {sys.path}", file=sys.stderr)

# Get absolute paths
current_file = os.path.abspath(__file__)
api_dir = os.path.dirname(current_file)
project_root = os.path.dirname(api_dir)
backend_dir = os.path.join(project_root, 'backend')

print(f"API dir: {api_dir}", file=sys.stderr)
print(f"Project root: {project_root}", file=sys.stderr)
print(f"Backend dir: {backend_dir}", file=sys.stderr)
print(f"Backend exists: {os.path.exists(backend_dir)}", file=sys.stderr)

# List files in project root
if os.path.exists(project_root):
    try:
        root_files = os.listdir(project_root)
        print(f"Files in project root: {root_files[:10]}", file=sys.stderr)
    except:
        pass

# Add backend to Python path (must be absolute)
if os.path.exists(backend_dir):
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
        print(f"Added backend to path: {backend_dir}", file=sys.stderr)
    
    # Set working directory to backend for relative imports
    os.chdir(backend_dir)
    print(f"Changed working dir to: {os.getcwd()}", file=sys.stderr)
else:
    print(f"⚠️ WARNING: Backend directory not found at {backend_dir}", file=sys.stderr)
    # Try alternative paths
    alt_paths = [
        os.path.join(project_root, '..', 'backend'),
        '/var/task/backend',
        '/vercel/path0/backend',
    ]
    for alt_path in alt_paths:
        abs_alt = os.path.abspath(alt_path)
        if os.path.exists(abs_alt):
            print(f"Found backend at alternative path: {abs_alt}", file=sys.stderr)
            if abs_alt not in sys.path:
                sys.path.insert(0, abs_alt)
            os.chdir(abs_alt)
            backend_dir = abs_alt
            break

# Import FastAPI app
try:
    print("Attempting to import app.main...", file=sys.stderr)
    from app.main import app
    print("✅ Successfully imported app.main", file=sys.stderr)
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
print("✅ Function ready to handle requests", file=sys.stderr)

