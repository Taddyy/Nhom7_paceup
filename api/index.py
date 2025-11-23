"""
Vercel Serverless Function entry point for FastAPI
"""
import os
import sys
import traceback

# Khai báo app ở module level để Vercel có thể export
app = None
handler = None

# --- BẮT ĐẦU ĐOẠN CODE BẪY LỖI ---
try:
    # Đặt toàn bộ các dòng import của bạn ở đây
    
    # Bước 1: Setup paths
    current_file = os.path.abspath(__file__)
    api_dir = os.path.dirname(current_file)
    project_root = os.path.dirname(api_dir)
    backend_dir = os.path.join(project_root, 'backend')
    
    # Add backend to Python path
    if os.path.exists(backend_dir):
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)
        os.chdir(backend_dir)
    
    # Bước 2: Import app từ app.main (thay vì tạo lại)
    # Điều này đảm bảo app được khởi tạo đúng cách với tất cả routes và middleware
    from app.main import app
    
    # Bước 3: Wrap với Mangum (nếu có) để tương thích với Vercel/Lambda
    try:
        from mangum import Mangum
        handler = Mangum(app, lifespan="off")
    except ImportError:
        handler = None
    
except Exception as e:
    # Nếu có lỗi, in nó ra Console để Vercel ghi lại
    print("--------------------------------------------------", file=sys.stderr, flush=True)
    print("CRITICAL ERROR DURING STARTUP:", file=sys.stderr, flush=True)
    print(str(e), file=sys.stderr, flush=True)
    traceback.print_exc(file=sys.stderr)  # In chi tiết dòng lỗi
    print("--------------------------------------------------", file=sys.stderr, flush=True)
    # Cũng in ra stdout để chắc chắn Vercel thấy
    print("--------------------------------------------------", flush=True)
    print("CRITICAL ERROR DURING STARTUP:", flush=True)
    print(str(e), flush=True)
    traceback.print_exc()  # In chi tiết dòng lỗi
    print("--------------------------------------------------", flush=True)
    
    # (Tùy chọn) Tạo một app giả để server không bị crash 500, giúp ta đọc được log
    try:
        from fastapi import FastAPI
        app = FastAPI(title="Error", description="Startup Error")
        
        @app.get("/")
        @app.get("/{path:path}")
        def error_handler(path: str = ""):
            return {
                "error": "Startup Error",
                "message": str(e),
                "type": type(e).__name__,
                "traceback": traceback.format_exc()
            }
        
        handler = None
    except Exception as fallback_error:
        # Nếu không thể tạo app, tạo một app đơn giản nhất
        print(f"⚠️ Failed to create error app: {fallback_error}", file=sys.stderr, flush=True)
        try:
            from fastapi import FastAPI
            app = FastAPI()
            handler = None
        except:
            # Last resort: không thể tạo app gì cả - để app = None để Vercel log lỗi
            app = None
            handler = None
            # Re-raise để Vercel thấy lỗi
            raise
# --- KẾT THÚC ĐOẠN CODE BẪY LỖI ---

# Export app (Vercel will auto-detect it as ASGI)
# Vercel requires 'app' to be a module-level variable
# Nếu app vẫn là None, Vercel sẽ log lỗi khi load function

