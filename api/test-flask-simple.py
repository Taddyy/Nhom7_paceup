"""
Test Flask app cực kỳ đơn giản - Minimal Flask format
"""
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def hello(path):
    """Handle all routes"""
    return jsonify({
        "status": "ok",
        "message": "Minimal Flask working",
        "format": "Flask App (auto-detect)",
        "path": path
    })

