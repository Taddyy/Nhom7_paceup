# Test minimal - Cực kỳ đơn giản để test Python runtime
# Không import gì, không function, chỉ print

print("TEST MINIMAL: Python runtime is working!", flush=True)
print("TEST MINIMAL: This file should be executed when imported", flush=True)

# Export handler function cho Vercel
def handler(event, context):
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": '{"status": "ok", "message": "Minimal test working"}'
    }

