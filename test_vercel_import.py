"""
Test script to simulate Vercel environment and check for import errors
"""
import sys
import os
import traceback

# Simulate Vercel environment
os.environ['VERCEL'] = '1'

# Add backend to path (similar to api/index.py)
current_file = os.path.abspath(__file__)
project_root = os.path.dirname(current_file)
backend_dir = os.path.join(project_root, 'backend')

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Change to backend directory
os.chdir(backend_dir)

print("=" * 60)
print("Testing import in Vercel-like environment")
print("=" * 60)
print(f"Python version: {sys.version}")
print(f"Current dir: {os.getcwd()}")
print(f"Backend dir: {backend_dir}")
print(f"Backend exists: {os.path.exists(backend_dir)}")
print(f"Python path: {sys.path[:3]}...")
print("=" * 60)

try:
    print("\n1. Testing import app.main...")
    from app.main import app
    print("✅ Successfully imported app.main")
    print(f"   App type: {type(app)}")
    print(f"   App: {app}")
    
    print("\n2. Testing Mangum import...")
    try:
        from mangum import Mangum
        print("✅ Mangum imported successfully")
        handler = Mangum(app, lifespan="off")
        print("✅ Mangum handler created")
        print(f"   Handler type: {type(handler)}")
    except ImportError as e:
        print(f"⚠️ Mangum not available: {e}")
        print("   (This is OK, Vercel will use app directly)")
    
    print("\n3. Testing app routes...")
    print(f"   Routes: {[route.path for route in app.routes[:5]]}")
    
    print("\n✅ All imports successful!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print(f"   Type: {type(e).__name__}")
    print("\nFull traceback:")
    traceback.print_exc()
    sys.exit(1)

