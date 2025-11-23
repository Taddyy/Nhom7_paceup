# Test minimal - Flask format (Vercel auto-detect)
from flask import Flask, jsonify

print("TEST MINIMAL: Flask app being created", flush=True)

# Tạo Flask app - Vercel tự động nhận diện
app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({
        "status": "ok",
        "message": "Minimal Flask test working",
        "format": "Flask App (auto-detect)"
    })

print("TEST MINIMAL: Flask app created successfully", flush=True)

