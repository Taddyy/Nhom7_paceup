"""
Vercel Serverless Function entry point for FastAPI
Simplified version with clear error trapping
"""
import sys
import os
import traceback

# Log ngay từ đầu
print("=" * 80, file=sys.stderr, flush=True)
print("🚀 STARTING api/index.py", file=sys.stderr, flush=True)
print(f"Python: {sys.version.split()[0]}", file=sys.stderr, flush=True)
print(f"File: {__file__}", file=sys.stderr, flush=True)
print("=" * 80, file=sys.stderr, flush=True)

app = None

try:
    # Step 1: Setup paths
    print("📦 Step 1: Setting up paths...", file=sys.stderr, flush=True)
    current_file = os.path.abspath(__file__)
    api_dir = os.path.dirname(current_file)
    project_root = os.path.dirname(api_dir)
    backend_dir = os.path.join(project_root, 'backend')
    
    print(f"   Backend dir: {backend_dir}", file=sys.stderr, flush=True)
    print(f"   Backend exists: {os.path.exists(backend_dir)}", file=sys.stderr, flush=True)
    
    # Add backend to Python path
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
        print(f"✅ Added to sys.path: {backend_dir}", file=sys.stderr, flush=True)
    else:
        print(f"✅ Already in sys.path: {backend_dir}", file=sys.stderr, flush=True)
    
    # Step 2: Import app
    print("📦 Step 2: Importing app from backend/app/main...", file=sys.stderr, flush=True)
    from app.main import app
    
    print(f"✅ App imported successfully", file=sys.stderr, flush=True)
    print(f"   App type: {type(app)}", file=sys.stderr, flush=True)
    if app:
        print(f"   App title: {getattr(app, 'title', 'N/A')}", file=sys.stderr, flush=True)
    
    print("=" * 80, file=sys.stderr, flush=True)
    print("✅ INITIALIZATION SUCCESS - App ready", file=sys.stderr, flush=True)
    print("=" * 80, file=sys.stderr, flush=True)
    
except ImportError as ie:
    # Import errors - in chi tiết
    print("=" * 80, file=sys.stderr, flush=True)
    print("❌ IMPORT ERROR", file=sys.stderr, flush=True)
    print("=" * 80, file=sys.stderr, flush=True)
    print(f"Error: {ie}", file=sys.stderr, flush=True)
    print(f"Module: {ie.name if hasattr(ie, 'name') else 'Unknown'}", file=sys.stderr, flush=True)
    print("\nTraceback:", file=sys.stderr, flush=True)
    traceback.print_exc(file=sys.stderr)
    print("=" * 80, file=sys.stderr, flush=True)
    raise  # Re-raise để Vercel thấy lỗi
    
except Exception as e:
    # Các lỗi khác - in chi tiết
    print("=" * 80, file=sys.stderr, flush=True)
    print("❌ INITIALIZATION ERROR", file=sys.stderr, flush=True)
    print("=" * 80, file=sys.stderr, flush=True)
    print(f"Error Type: {type(e).__name__}", file=sys.stderr, flush=True)
    print(f"Error Message: {str(e)}", file=sys.stderr, flush=True)
    print("\nFull Traceback:", file=sys.stderr, flush=True)
    traceback.print_exc(file=sys.stderr)
    print("=" * 80, file=sys.stderr, flush=True)
    raise  # Re-raise để Vercel thấy lỗi

# Export app - Vercel sẽ tự động nhận diện FastAPI app
if app is None:
    print("⚠️ WARNING: app is None!", file=sys.stderr, flush=True)
