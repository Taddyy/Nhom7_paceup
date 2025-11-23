"""
Vercel Serverless Function entry point for FastAPI
"""
# IN LOG NGAY TỪ ĐẦU - TRƯỚC MỌI THỨ KHÁC
import sys
import os
try:
    current_file_info = __file__
except NameError:
    current_file_info = "N/A (running as script)"

print("=" * 80, file=sys.stderr, flush=True)
print("🚀 STARTING api/index.py - Vercel Function Entry Point", file=sys.stderr, flush=True)
print(f"Python version: {sys.version}", file=sys.stderr, flush=True)
print(f"Current file: {current_file_info}", file=sys.stderr, flush=True)
print("=" * 80, file=sys.stderr, flush=True)
sys.stderr.flush()

# Khai báo app ở module level để Vercel có thể export
app = None
handler = None

# --- BẮT ĐẦU ĐOẠN CODE BẪY LỖI ---
try:
    print("📦 Step 0: Importing basic modules...", file=sys.stderr, flush=True)
    import traceback
    print("✅ Basic modules imported", file=sys.stderr, flush=True)
    
    print("📦 Step 1: Setting up paths...", file=sys.stderr, flush=True)
    # Setup paths
    current_file = os.path.abspath(__file__)
    api_dir = os.path.dirname(current_file)
    project_root = os.path.dirname(api_dir)
    backend_dir = os.path.join(project_root, 'backend')
    
    print(f"   Current file: {current_file}", file=sys.stderr, flush=True)
    print(f"   API dir: {api_dir}", file=sys.stderr, flush=True)
    print(f"   Project root: {project_root}", file=sys.stderr, flush=True)
    print(f"   Backend dir: {backend_dir}", file=sys.stderr, flush=True)
    print(f"   Backend exists: {os.path.exists(backend_dir)}", file=sys.stderr, flush=True)
    print(f"   Python path (first 3): {sys.path[:3]}", file=sys.stderr, flush=True)
    
    # Add backend to Python path
    if os.path.exists(backend_dir):
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)
            print(f"✅ Added {backend_dir} to Python path", file=sys.stderr, flush=True)
        os.chdir(backend_dir)
        print(f"✅ Changed working dir to: {os.getcwd()}", file=sys.stderr, flush=True)
    else:
        print(f"⚠️ WARNING: Backend directory not found at {backend_dir}", file=sys.stderr, flush=True)
        # Try alternative paths
        alt_paths = [
            os.path.join(project_root, '..', 'backend'),
            '/var/task/backend',
            '/vercel/path0/backend',
        ]
        for alt_path in alt_paths:
            abs_alt = os.path.abspath(alt_path)
            if os.path.exists(abs_alt):
                print(f"✅ Found backend at alternative path: {abs_alt}", file=sys.stderr, flush=True)
                if abs_alt not in sys.path:
                    sys.path.insert(0, abs_alt)
                os.chdir(abs_alt)
                backend_dir = abs_alt
                break
    
    print("📦 Step 2: Importing app.main...", file=sys.stderr, flush=True)
    # Import app từ app.main
    from app.main import app
    print("✅ Successfully imported app.main", file=sys.stderr, flush=True)
    print(f"   App type: {type(app)}", file=sys.stderr, flush=True)
    print(f"   App title: {app.title if hasattr(app, 'title') else 'N/A'}", file=sys.stderr, flush=True)
    
    print("📦 Step 3: Setting up Mangum handler...", file=sys.stderr, flush=True)
    # Wrap với Mangum (nếu có) để tương thích với Vercel/Lambda
    try:
        from mangum import Mangum
        handler = Mangum(app, lifespan="off")
        print("✅ Mangum handler created", file=sys.stderr, flush=True)
    except ImportError as mangum_error:
        print(f"⚠️ Mangum not available: {mangum_error} (will use app directly)", file=sys.stderr, flush=True)
        handler = None
    
    print("=" * 80, file=sys.stderr, flush=True)
    print("✅ FUNCTION INITIALIZATION COMPLETE - Ready to handle requests", file=sys.stderr, flush=True)
    print("=" * 80, file=sys.stderr, flush=True)
    sys.stderr.flush()
    
except Exception as e:
    # BẪY LỖI - In chi tiết ra cả stderr và stdout
    error_separator = "=" * 80
    error_header = "❌ CRITICAL ERROR DURING STARTUP ❌"
    
    # In ra stderr (Vercel logs)
    print(error_separator, file=sys.stderr, flush=True)
    print(error_header, file=sys.stderr, flush=True)
    print(error_separator, file=sys.stderr, flush=True)
    print(f"Error Type: {type(e).__name__}", file=sys.stderr, flush=True)
    print(f"Error Message: {str(e)}", file=sys.stderr, flush=True)
    print(error_separator, file=sys.stderr, flush=True)
    print("FULL TRACEBACK:", file=sys.stderr, flush=True)
    try:
        traceback.print_exc(file=sys.stderr)
    except:
        print("Could not print traceback", file=sys.stderr, flush=True)
    print(error_separator, file=sys.stderr, flush=True)
    
    # Cũng in ra stdout để chắc chắn
    print(error_separator, flush=True)
    print(error_header, flush=True)
    print(error_separator, flush=True)
    print(f"Error Type: {type(e).__name__}", flush=True)
    print(f"Error Message: {str(e)}", flush=True)
    print(error_separator, flush=True)
    print("FULL TRACEBACK:", flush=True)
    try:
        traceback.print_exc()
    except:
        print("Could not print traceback", flush=True)
    print(error_separator, flush=True)
    
    sys.stderr.flush()
    sys.stdout.flush()
    
    # Tạo error app để server không crash hoàn toàn, giúp ta có thể đọc log qua endpoint
    print("🔧 Attempting to create error handler app...", file=sys.stderr, flush=True)
    try:
        from fastapi import FastAPI
        error_app = FastAPI(title="Error Handler", description="Startup Error - Check logs for details")
        
        @error_app.get("/")
        @error_app.get("/{path:path}")
        def error_handler(path: str = ""):
            error_trace = ""
            try:
                error_trace = traceback.format_exc()
            except:
                error_trace = "Could not generate traceback"
            
            return {
                "error": "Startup Error",
                "message": str(e),
                "type": type(e).__name__,
                "traceback": error_trace,
                "note": "Check Vercel logs for full details"
            }
        
        app = error_app
        handler = None
        print("✅ Error handler app created", file=sys.stderr, flush=True)
    except Exception as fallback_error:
        print(f"⚠️ Failed to create error app: {fallback_error}", file=sys.stderr, flush=True)
        try:
            from fastapi import FastAPI
            app = FastAPI()
            handler = None
            print("✅ Created minimal FastAPI app", file=sys.stderr, flush=True)
        except Exception as final_error:
            print(f"❌ Complete failure: {final_error}", file=sys.stderr, flush=True)
            app = None
            handler = None
            # Không re-raise ở đây để tránh crash hoàn toàn
            # Vercel sẽ log lỗi khi app = None
    sys.stderr.flush()
    
except BaseException as be:
    # Bắt cả BaseException để chắc chắn bắt được mọi lỗi (kể cả SystemExit, KeyboardInterrupt)
    print("=" * 80, file=sys.stderr, flush=True)
    print(f"❌ BASE EXCEPTION CAUGHT: {type(be).__name__}: {be}", file=sys.stderr, flush=True)
    try:
        traceback.print_exc(file=sys.stderr)
    except:
        pass
    print("=" * 80, file=sys.stderr, flush=True)
    sys.stderr.flush()
    # Re-raise để Vercel biết có lỗi
    raise
# --- KẾT THÚC ĐOẠN CODE BẪY LỖI ---

# Export app (Vercel will auto-detect it as ASGI)
# Vercel requires 'app' to be a module-level variable
if app is None:
    print("⚠️ WARNING: app is None at module level - Vercel may fail to load function", file=sys.stderr, flush=True)
    sys.stderr.flush()

