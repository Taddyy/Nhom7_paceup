"""
Vercel Serverless Function entry point for FastAPI
"""
import sys
import os
import traceback

# Print immediately to ensure we see something
print("STARTING api/index.py", file=sys.stderr, flush=True)
print("STARTING api/index.py", flush=True)  # Also to stdout

# Wrap everything in try-except to catch any error
try:
    # Ensure all output goes to both stderr and stdout for maximum visibility
    def log(msg):
        """Log to both stderr and stdout for Vercel visibility"""
        try:
            print(msg, file=sys.stderr, flush=True)
            print(msg, flush=True)  # Also stdout
        except Exception as e:
            # If even logging fails, try basic print
            try:
                print(f"LOG_ERROR: {e}", flush=True)
            except:
                pass
    
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
    # Try importing step by step to identify where it fails
    try:
        log("Step 1: Testing basic imports...")
        import fastapi
        log(f"✅ FastAPI version: {fastapi.__version__}")
        
        log("Step 2: Testing app.core.config import...")
        from app.core import config
        log(f"✅ Config loaded, DATABASE_URL: {config.settings.DATABASE_URL[:50]}...")
        
        log("Step 3: Testing app.core.database import...")
        from app.core import database
        log("✅ Database module imported")
        
        log("Step 4: Testing app.main import...")
        from app.main import app
        log("✅ Successfully imported app.main")
        log(f"✅ App type: {type(app)}")
        log(f"✅ App title: {app.title}")
        
    except ImportError as e:
        # Print detailed error for debugging
        error_msg = f"""
❌ Import Error Details:
   Error: {e}
   Type: {type(e).__name__}
   Backend path: {backend_dir}
   Backend exists: {os.path.exists(backend_dir)}
   Current dir: {os.getcwd()}
   Python path: {sys.path[:5]}
   Traceback:
{traceback.format_exc()}
"""
        log(error_msg)
        sys.stderr.flush()
        raise
    except Exception as e:
        error_msg = f"""
❌ Unexpected Error during import: {e}
   Type: {type(e).__name__}
   Traceback:
{traceback.format_exc()}
"""
        log(error_msg)
        sys.stderr.flush()
        raise
    
    # Vercel handler function
    # Use Mangum to wrap FastAPI app for Vercel/Lambda
    log("✅ Function ready to handle requests")
    
    # Make sure app is defined
    if app is None:
        error_msg = "Failed to import app from app.main - app is None"
        log(f"❌ {error_msg}")
        sys.stderr.flush()
        raise RuntimeError(error_msg)
    
    # Wrap FastAPI app with Mangum for Vercel serverless
    # Vercel can auto-detect ASGI apps, but Mangum provides better compatibility
    handler = None
    try:
        log("Attempting to import Mangum...")
        from mangum import Mangum
        log("✅ Mangum imported successfully")
        mangum_handler = Mangum(app, lifespan="off")
        log("✅ Mangum handler created")
        
        # Create handler function for Vercel
        # Vercel expects handler(event) or handler(event, context)
        # Mangum returns a callable that handles both
        handler = mangum_handler
        log("✅ Handler function created")
    except ImportError as e:
        # Fallback: export app directly (Vercel may auto-detect ASGI)
        log(f"⚠️ Mangum not available ({e}), will export app directly")
        handler = None  # Let Vercel auto-detect ASGI app
    except Exception as e:
        log(f"❌ Error creating Mangum handler: {e}")
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()
        # Don't raise - fallback to app export
        handler = None

    log("✅ Function initialization complete")
    sys.stderr.flush()
    
    # Store in globals for export (ensure they're available at module level)
    globals()['app'] = app
    if handler is not None:
        globals()['handler'] = handler
    
except Exception as e:
    # Catch ANY error that occurs during initialization
    error_msg = f"""
❌ CRITICAL ERROR DURING FUNCTION INITIALIZATION:
   Error: {e}
   Type: {type(e).__name__}
   Traceback:
{traceback.format_exc()}
"""
    # Print to both stderr and stdout
    try:
        print(error_msg, file=sys.stderr, flush=True)
        print(error_msg, flush=True)  # Also stdout
    except:
        # If even printing fails, try basic print
        try:
            print(f"CRITICAL ERROR: {e}", file=sys.stderr, flush=True)
            print(f"CRITICAL ERROR: {e}", flush=True)
        except:
            pass
    # Re-raise to ensure Vercel sees the error
    raise

# Export app and handler at module level (outside try-except)
# CRITICAL: Vercel requires 'app' to be a module-level variable, not from globals()
# Vercel automatically detects ASGI apps when 'app' is exported at module level

# Initialize app and handler to None at module level
app = None
handler = None

# Get app and handler from globals (set in try-except above)
if 'app' in globals() and globals()['app'] is not None:
    app = globals()['app']
if 'handler' in globals() and globals()['handler'] is not None:
    handler = globals()['handler']

# Ensure app is exported (required for Vercel ASGI auto-detection)
if app is None:
    # If app is not defined, something went wrong during initialization
    # The error should have been logged in the try-except above
    # Create a minimal error app so Vercel can at least load the function
    try:
        from fastapi import FastAPI
        app = FastAPI(title="Error", description="App failed to initialize")
        @app.get("/error")
        async def error_endpoint():
            return {"error": "Backend failed to initialize", "status": "error"}
        print("⚠️ Created error app due to initialization failure", file=sys.stderr, flush=True)
    except Exception as e:
        print(f"❌ Failed to create error app: {e}", file=sys.stderr, flush=True)
        # Last resort: create a minimal dict-like object
        app = {"error": "Complete initialization failure"}

# Export app (Vercel will auto-detect it as ASGI)
# Also export handler if available
if handler is not None:
    __all__ = ['app', 'handler']
else:
    __all__ = ['app']

