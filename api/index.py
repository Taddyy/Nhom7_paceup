import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

from app.main import app

# Vercel Serverless Function entry point
# No need to wrap in handler, Vercel supports ASGI apps directly

