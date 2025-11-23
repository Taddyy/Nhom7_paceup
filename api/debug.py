"""
Debug endpoint - Hello World để test môi trường Vercel
File này dùng để kiểm tra xem môi trường Vercel có hoạt động không
KHÔNG import bất kỳ thư viện nặng nào - chỉ dùng thư viện built-in của Python
"""
import sys
import os
import json

# Log ngay từ đầu để biết file đã được load
print("=" * 80, file=sys.stderr, flush=True)
print("🚀 DEBUG.PY LOADED - Testing Vercel environment", file=sys.stderr, flush=True)
print(f"Python version: {sys.version}", file=sys.stderr, flush=True)
print(f"Current dir: {os.getcwd()}", file=sys.stderr, flush=True)
print("=" * 80, file=sys.stderr, flush=True)


def handler(event, context):
    """
    Simple handler function for Vercel
    Đây là handler đơn giản nhất - không cần import gì cả
    """
    try:
        print("DEBUG HANDLER CALLED", file=sys.stderr, flush=True)
        
        # Collect info
        info = {
            "status": "ok",
            "message": "Hello World - Môi trường ổn ✅",
            "python_version": sys.version.split()[0],
            "current_dir": os.getcwd(),
            "python_path_count": len(sys.path),
            "python_path_first_3": sys.path[:3],
            "env_vercel": os.getenv("VERCEL", "NOT_SET"),
            "test": "Nếu bạn thấy message này, môi trường Vercel đang hoạt động tốt!"
        }
        
        print(f"Response: {json.dumps(info, indent=2)}", file=sys.stderr, flush=True)
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json; charset=utf-8",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(info, indent=2, ensure_ascii=False)
        }
        
    except Exception as e:
        # Nếu có lỗi, vẫn cố gắng trả về response
        import traceback
        error_info = {
            "status": "error",
            "message": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
        
        print(f"ERROR in handler: {error_info}", file=sys.stderr, flush=True)
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json; charset=utf-8"
            },
            "body": json.dumps(error_info, indent=2, ensure_ascii=False)
        }


# Export handler
__all__ = ['handler']

