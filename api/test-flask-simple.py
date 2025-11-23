"""
Test Flask app cực kỳ đơn giản - Minimal Flask format
"""
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({"status": "ok", "message": "Minimal Flask working"})

