"""
Vercel Serverless Function entry point for FastAPI
"""
import sys
import os
import traceback

# Wrap everything in try-except to catch any error
try:
    # Ensure all output goes to stderr for Vercel logs
    def log(msg):
        """Log to stderr for Vercel visibility"""
        try:
            print(msg, file=sys.stderr, flush=True)
        except:
            pass  # If even logging fails, continue
    
    # Debug: Print environment info
    log("=== Vercel Python Function Startup ===")
    log(f"Python version: {sys.version}")
    log(f"Current file: {__file__}")
    log(f"Current dir: {os.getcwd()}")
    log(f"Python path: {sys.path}")
    
    # Get absolute paths
    current_file = os.path.abspath(__file__)
    api_dir = os.path.dirname(current_file)
    project_root = os.path.dirname(api_dir)
    backend_dir = os.path.join(project_root, 'backend')
    
    log(f"API dir: {api_dir}")
    log(f"Project root: {project_root}")
    log(f"Backend dir: {backend_dir}")
    log(f"Backend exists: {os.path.exists(backend_dir)}")
    
    # List files in project root
    if os.path.exists(project_root):
        try:
            root_files = os.listdir(project_root)
            log(f"Files in project root: {root_files[:10]}")
        except:
            pass
    
    # Add backend to Python path (must be absolute)
    if os.path.exists(backend_dir):
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)
            log(f"Added backend to path: {backend_dir}")
        
        # Set working directory to backend for relative imports
        os.chdir(backend_dir)
        log(f"Changed working dir to: {os.getcwd()}")
    else:
        log(f"⚠️ WARNING: Backend directory not found at {backend_dir}")
        # Try alternative paths
        alt_paths = [
            os.path.join(project_root, '..', 'backend'),
            '/var/task/backend',
            '/vercel/path0/backend',
        ]
        for alt_path in alt_paths:
            abs_alt = os.path.abspath(alt_path)
            if os.path.exists(abs_alt):
                log(f"Found backend at alternative path: {abs_alt}")
                if abs_alt not in sys.path:
                    sys.path.insert(0, abs_alt)
                os.chdir(abs_alt)
                backend_dir = abs_alt
                break
    
    # Import FastAPI app
    try:
        log("Attempting to import app.main...")
        try:
            from app.main import app
            log("✅ Successfully imported app.main")
        except Exception as import_err:
            log(f"❌ Error during import: {import_err}")
            log(f"Error type: {type(import_err).__name__}")
            log("Full traceback:")
            traceback.print_exc(file=sys.stderr)
            sys.stderr.flush()
            raise
    except ImportError as e:
        # Print detailed error for debugging
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
        log(error_msg)
        sys.stderr.flush()
        raise
    except Exception as e:
        error_msg = f"""
❌ Unexpected Error: {e}
   Traceback:
{traceback.format_exc()}
"""
        log(error_msg)
        sys.stderr.flush()
        raise
    
    # Vercel handler function
    # Use Mangum to wrap FastAPI app for Vercel/Lambda
    log("✅ Function ready to handle requests")
    
    # Make sure app is in scope
    if 'app' not in locals():
        error_msg = "Failed to import app from app.main"
        log(f"❌ {error_msg}")
        sys.stderr.flush()
        raise RuntimeError(error_msg)
    
    # Wrap FastAPI app with Mangum for Vercel serverless
    # Vercel can auto-detect ASGI apps, but Mangum provides better compatibility
    try:
        log("Attempting to import Mangum...")
        from mangum import Mangum
        log("✅ Mangum imported successfully")
        mangum_handler = Mangum(app, lifespan="off")
        log("✅ Mangum handler created")
        
        # Create handler function for Vercel
        def handler(event, context):
            """Vercel serverless function handler"""
            return mangum_handler(event, context)
        log("✅ Handler function created")
    except ImportError as e:
        # Fallback: export app directly (Vercel may auto-detect ASGI)
        log(f"⚠️ Mangum not available ({e}), exporting app directly")
        mangum_handler = app
        handler = app
    except Exception as e:
        log(f"❌ Error creating Mangum handler: {e}")
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()
        raise

    log("✅ Function initialization complete")
    sys.stderr.flush()
    
    # Export app for Vercel
    # Vercel automatically detects ASGI apps when 'app' is exported at module level
    # Also export handler function for explicit handling
    # Vercel will try to use handler first, then fall back to app
    __all__ = ['app', 'handler']
    
except Exception as e:
    # Catch ANY error that occurs during initialization
    error_msg = f"""
❌ CRITICAL ERROR DURING FUNCTION INITIALIZATION:
   Error: {e}
   Type: {type(e).__name__}
   Traceback:
{traceback.format_exc()}
"""
    try:
        print(error_msg, file=sys.stderr, flush=True)
    except:
        # If even printing fails, try basic print
        print(f"CRITICAL ERROR: {e}", flush=True)
    # Re-raise to ensure Vercel sees the error
    raise

