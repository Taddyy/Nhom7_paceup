"""
Debug endpoint - Hello World để test môi trường Vercel
File này dùng để kiểm tra xem môi trường Vercel có hoạt động không
Đã đổi sang Flask format (Vercel auto-detect)
"""
from flask import Flask, jsonify
import sys
import os

# Log ngay khi module được import
print("=" * 80, file=sys.stderr, flush=True)
print("🚀 DEBUG.PY LOADED - Flask App Format", file=sys.stderr, flush=True)
print(f"Python version: {sys.version}", file=sys.stderr, flush=True)
print(f"Current dir: {os.getcwd()}", file=sys.stderr, flush=True)
print("=" * 80, file=sys.stderr, flush=True)

# Tạo Flask app - Vercel tự động nhận diện biến 'app'
app = Flask(__name__)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def debug_handler(path):
    """Handle all routes"""
    print(f"DEBUG route called: /{path}", file=sys.stderr, flush=True)
    
    info = {
        "status": "ok",
        "message": "Hello World - Môi trường ổn ✅",
        "python_version": sys.version.split()[0],
        "current_dir": os.getcwd(),
        "python_path_count": len(sys.path),
        "python_path_first_3": sys.path[:3],
        "env_vercel": os.getenv("VERCEL", "NOT_SET"),
        "format": "Flask App (auto-detect)",
        "path": path,
        "test": "Nếu bạn thấy message này, môi trường Vercel đang hoạt động tốt!"
    }
    
    print(f"Response: {info}", file=sys.stderr, flush=True)
    return jsonify(info)

# Export app - Vercel tự động detect Flask app qua biến này

