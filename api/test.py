"""
Simple test endpoint to verify Vercel function is working
This is a minimal test that doesn't require any backend imports
"""
import sys
import os
import json

def handler(event, context):
    """Simple handler that returns environment info"""
    try:
        # Print to stderr for Vercel logs
        print("TEST ENDPOINT CALLED", file=sys.stderr, flush=True)
        
        response = {
            "status": "ok",
            "message": "Test endpoint is working",
            "python_version": sys.version.split()[0],
            "current_dir": os.getcwd(),
            "python_path_count": len(sys.path),
            "env_vars": {
                "VERCEL": os.getenv("VERCEL", "NOT_SET"),
                "DATABASE_URL_SET": "YES" if os.getenv("DATABASE_URL") else "NO",
                "DATABASE_URL_PREFIX": os.getenv("DATABASE_URL", "")[:30] if os.getenv("DATABASE_URL") else "NOT_SET",
            }
        }
        
        print(f"Response: {json.dumps(response)}", file=sys.stderr, flush=True)
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps(response)
        }
    except Exception as e:
        import traceback
        error_response = {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }
        error_trace = traceback.format_exc()
        print(f"ERROR: {error_response}", file=sys.stderr, flush=True)
        print(f"TRACEBACK:\n{error_trace}", file=sys.stderr, flush=True)
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps(error_response)
        }

# Export for Vercel
__all__ = ['handler']

