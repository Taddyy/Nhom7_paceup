"""
Test file theo đúng Vercel Python spec - Flask App Format
Format này được Vercel tự động nhận diện qua biến 'app'
"""
from flask import Flask, jsonify
import sys
import os

# Log ngay khi module được import
print("=" * 80, file=sys.stderr, flush=True)
print("🚀 TEST-VERCEL-SPEC.PY LOADED - Flask App Format", file=sys.stderr, flush=True)
print(f"Python version: {sys.version}", file=sys.stderr, flush=True)
print(f"Current dir: {os.getcwd()}", file=sys.stderr, flush=True)
print("=" * 80, file=sys.stderr, flush=True)

# Tạo Flask app - Vercel tự động nhận diện biến 'app'
app = Flask(__name__)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def hello(path):
    """Handle all routes"""
    print(f"Flask route called: /{path}", file=sys.stderr, flush=True)
    
    info = {
        "status": "ok",
        "message": "Flask app format working ✅ - Vercel auto-detected",
        "python_version": sys.version.split()[0],
        "current_dir": os.getcwd(),
        "format": "Flask App (auto-detect)",
        "path": path,
        "test": "Nếu bạn thấy message này, Flask format hoạt động!"
    }
    
    print(f"Response: {info}", file=sys.stderr, flush=True)
    return jsonify(info)

# Export app - Vercel tự động detect Flask app qua biến này
# Không cần __all__ vì Vercel tìm biến 'app' tự động

