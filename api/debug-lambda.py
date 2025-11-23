"""
Debug Lambda handler - Format Lambda handler chuẩn với error trapping toàn diện
"""
import sys
import os
import json

# BẪY LỖI NGAY TỪ ĐẦU - TRƯỚC MỌI THỨ KHÁC
try:
    # Log ngay khi file được load
    print("=" * 80, file=sys.stderr, flush=True)
    print("🚀 DEBUG-LAMBDA.PY LOADED", file=sys.stderr, flush=True)
    print(f"Python version: {sys.version}", file=sys.stderr, flush=True)
    print(f"Current dir: {os.getcwd()}", file=sys.stderr, flush=True)
    print(f"File: {__file__ if '__file__' in globals() else 'N/A'}", file=sys.stderr, flush=True)
    print("=" * 80, file=sys.stderr, flush=True)
    sys.stderr.flush()
except Exception as e:
    print(f"ERROR during initial logging: {e}", file=sys.stderr, flush=True)


def handler(event, context):
    """
    Lambda handler function chuẩn cho Vercel
    Format: handler(event, context) -> dict
    """
    try:
        print("DEBUG-LAMBDA HANDLER CALLED", file=sys.stderr, flush=True)
        print(f"Event: {json.dumps(event, default=str)}", file=sys.stderr, flush=True)
        
        # Collect info
        info = {
            "status": "ok",
            "message": "Lambda handler format working ✅",
            "python_version": sys.version.split()[0],
            "current_dir": os.getcwd(),
            "python_path_count": len(sys.path),
            "python_path_first_3": sys.path[:3],
            "env_vercel": os.getenv("VERCEL", "NOT_SET"),
            "handler_format": "Lambda handler (event, context)",
            "test": "Nếu bạn thấy message này, Lambda handler format hoạt động!"
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
        # Nếu có lỗi trong handler, vẫn cố gắng trả về response
        import traceback
        error_info = {
            "status": "error",
            "message": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
        
        print(f"ERROR in handler: {error_info}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json; charset=utf-8"
            },
            "body": json.dumps(error_info, indent=2, ensure_ascii=False)
        }


# Bẫy lỗi khi import module
try:
    print("DEBUG-LAMBDA: Module imported successfully", file=sys.stderr, flush=True)
except Exception as e:
    print(f"ERROR importing module: {e}", file=sys.stderr, flush=True)
    import traceback
    traceback.print_exc(file=sys.stderr)
    sys.stderr.flush()


# Export handler
__all__ = ['handler']

