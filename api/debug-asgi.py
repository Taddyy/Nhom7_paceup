"""
Debug ASGI app - FastAPI app đơn giản để test ASGI format
"""
import sys
import os

# BẪY LỖI NGAY TỪ ĐẦU
try:
    print("=" * 80, file=sys.stderr, flush=True)
    print("🚀 DEBUG-ASGI.PY LOADED", file=sys.stderr, flush=True)
    print(f"Python version: {sys.version}", file=sys.stderr, flush=True)
    print("=" * 80, file=sys.stderr, flush=True)
    sys.stderr.flush()
except Exception as e:
    print(f"ERROR during initial logging: {e}", file=sys.stderr, flush=True)

# Tạo app đơn giản
try:
    print("DEBUG-ASGI: Attempting to import FastAPI...", file=sys.stderr, flush=True)
    from fastapi import FastAPI
    
    print("DEBUG-ASGI: FastAPI imported successfully", file=sys.stderr, flush=True)
    
    # Tạo app cực kỳ đơn giản
    app = FastAPI(
        title="Debug ASGI",
        description="Simple ASGI app for testing",
        version="1.0.0"
    )
    
    @app.get("/")
    async def root():
        return {
            "status": "ok",
            "message": "ASGI app format working ✅",
            "python_version": sys.version.split()[0],
            "current_dir": os.getcwd(),
            "format": "ASGI (FastAPI app)",
            "test": "Nếu bạn thấy message này, ASGI format hoạt động!"
        }
    
    @app.get("/{path:path}")
    async def catch_all(path: str):
        return {
            "status": "ok",
            "message": "ASGI app format working ✅",
            "path": path,
            "format": "ASGI (FastAPI app)"
        }
    
    print("DEBUG-ASGI: FastAPI app created successfully", file=sys.stderr, flush=True)
    print(f"DEBUG-ASGI: App type: {type(app)}", file=sys.stderr, flush=True)
    sys.stderr.flush()
    
except Exception as e:
    # Nếu không thể tạo app, tạo error app
    print(f"ERROR creating FastAPI app: {e}", file=sys.stderr, flush=True)
    import traceback
    traceback.print_exc(file=sys.stderr)
    sys.stderr.flush()
    
    # Tạo error app
    try:
        from fastapi import FastAPI
        app = FastAPI()
        
        @app.get("/{path:path}")
        async def error_handler(path: str):
            return {
                "error": "Failed to initialize app",
                "message": str(e),
                "type": type(e).__name__
            }
    except:
        app = None
        print("CRITICAL: Could not create any app", file=sys.stderr, flush=True)

# Export app cho Vercel
__all__ = ['app'] if app is not None else []

