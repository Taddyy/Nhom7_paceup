# Vercel Python Serverless Functions - Quy Định và Cấu Hình

## Tóm Tắt Quy Định Chính Thức từ Vercel Docs

### 1. Python Version
- **Vercel HỖ TRỢ:** Python 3.12 (duy nhất, không thể thay đổi)
- **File:** `runtime.txt` KHÔNG cần thiết (Vercel tự động dùng Python 3.12)
- **Lưu ý:** Python 3.11 hoặc 3.10 KHÔNG được hỗ trợ

### 2. Cấu Trúc File

#### Option A: Tự Động Detect (Khuyến Nghị)
- Đặt file Python trong thư mục `api/`
- Vercel tự động nhận diện và tạo serverless function
- Không cần cấu hình trong `vercel.json`

**Ví dụ:**
```
api/
  └── hello.py
```
Truy cập: `https://your-app.vercel.app/api/hello`

#### Option B: Explicit Configuration
Cấu hình trong `vercel.json`:
```json
{
  "version": 2,
  "functions": {
    "api/**/*.py": {
      "includeFiles": "path/to/files"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

### 3. Handler Format

#### Format 1: Flask App (Tự Động Detect)
Vercel tự động nhận diện Flask app qua biến `app`:

```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return {'message': 'Hello World'}
```

**Export:** `app` variable (Flask instance)

#### Format 2: FastAPI App (Tự Động Detect)
Vercel tự động nhận diện FastAPI app qua biến `app`:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get('/')
def hello():
    return {'message': 'Hello World'}
```

**Export:** `app` variable (FastAPI instance)

#### Format 3: Lambda Handler (Manual)
Format Lambda handler với event/context:

```python
def handler(event, context):
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': '{"message": "Hello World"}'
    }
```

**Export:** `handler` function

**Lưu ý:** Format này cần explicit cấu hình trong `vercel.json`:
```json
{
  "functions": {
    "api/handler.py": {
      "runtime": "@vercel/python"
    }
  }
}
```

### 4. Requirements.txt

- **Vị trí:** Root của project (cùng cấp với `vercel.json`)
- **Format:** Standard pip requirements format
- **Giới hạn:** Tổng kích thước (uncompressed) không quá 250 MB

**Ví dụ:**
```
fastapi==0.104.1
pydantic>=2.9.0
```

### 5. Vercel.json Configuration

#### Minimal Configuration (Tự Động)
Không cần `vercel.json` nếu:
- File Python trong `api/` folder
- Dùng Flask hoặc FastAPI app
- Routes match với file structure

#### Full Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "functions": {
    "api/**/*.py": {
      "includeFiles": "additional-files/**",
      "excludeFiles": "tests/**"
    }
  }
}
```

### 6. Response Format

#### Flask/FastAPI App (Automatic)
App tự động xử lý HTTP requests và responses.

#### Lambda Handler (Manual)
Phải return dict với format:
```python
{
    'statusCode': 200,  # HTTP status code
    'headers': {        # Optional
        'Content-Type': 'application/json'
    },
    'body': '...'       # Response body (string)
}
```

### 7. Environment Variables
- Set trong Vercel Dashboard → Project → Settings → Environment Variables
- Hoặc qua Vercel CLI: `vercel env add`
- Truy cập trong code: `os.getenv('VAR_NAME')`

### 8. Kích Thước Giới Hạn

- **Uncompressed package:** 250 MB max
- **Function execution:** 10 seconds (Hobby), 60 seconds (Pro)
- **Memory:** 1024 MB default

### 9. Node.js Requirement

**Quan trọng:** Một số deployment có thể yêu cầu Node.js version được set trong `package.json`:

```json
{
  "engines": {
    "node": "18.x"
  }
}
```

**Lý do:** Vercel build system sử dụng Node.js để build, dù project là Python.

## So Sánh Với Cấu Hình Hiện Tại

### Vấn Đề Có Thể:

1. **Python Version:**
   - ❌ `runtime.txt` có `python-3.12` → KHÔNG CẦN (Vercel tự động)
   - ✅ Có thể giữ hoặc xóa (không ảnh hưởng)

2. **Handler Format:**
   - ❌ File `api/test-minimal.py` dùng Lambda handler nhưng không có explicit config
   - ✅ Nên dùng Flask/FastAPI app format để auto-detect

3. **Vercel.json:**
   - ⚠️ Đang dùng `rewrites` → OK
   - ⚠️ Không có explicit `builds` → Có thể cần thêm

4. **Package.json:**
   - ❓ Cần kiểm tra có Node.js version không

## Khuyến Nghị

1. **Thử Flask App Format Đầu Tiên** - Dễ nhất, tự động detect
2. **Thêm package.json với Node.js version** - Đảm bảo build system hoạt động
3. **Đơn giản hóa vercel.json** - Chỉ dùng rewrites, không cần builds nếu auto-detect
4. **Test với format Flask/FastAPI app** - Format được khuyến nghị nhất

## Files Cần Kiểm Tra/Sửa

1. ✅ Tạo file test Flask app format
2. ✅ Thêm package.json với Node.js version
3. ✅ Đơn giản hóa vercel.json
4. ✅ Test và so sánh kết quả

