# Hướng Dẫn Debug Lỗi Python Runtime Crash trên Vercel

## Vấn Đề Hiện Tại

Endpoint `/api/debug` trả về **500 Internal Server Error** với message:
```
Python process exited with exit status: 1
```

**Đặc điểm:**
- ✅ Build logs không có lỗi (build thành công)
- ❌ Runtime logs chỉ có error message chung chung, không có chi tiết
- ❌ **Không thấy log từ code Python** (như "🚀 DEBUG.PY LOADED") 
- → **Kết luận**: Lỗi xảy ra **TRƯỚC KHI** code Python được chạy

## Chiến Thuật Debug: Test Nhiều Format Khác Nhau

Vì không biết Vercel mong đợi format nào, chúng ta đã tạo **3 file test** với các format khác nhau:

### 1. Test Minimal - Cực Kỳ Đơn Giản
**File:** `api/test-minimal.py`
**Endpoint:** `/api/test-minimal`
**Mục đích:** Test xem Python runtime có hoạt động không

**Format:**
- Chỉ có print statements
- Handler function đơn giản nhất
- Không import thư viện ngoài

### 2. Lambda Handler Format
**File:** `api/debug-lambda.py`
**Endpoint:** `/api/debug-lambda`
**Mục đích:** Test format Lambda handler chuẩn

**Format:**
```python
def handler(event, context):
    return {"statusCode": 200, ...}
```

**Đặc điểm:**
- Error trapping toàn diện
- Log chi tiết từng bước
- Bẫy mọi exception

### 3. ASGI App Format
**File:** `api/debug-asgi.py`
**Endpoint:** `/api/debug-asgi`
**Mục đích:** Test format ASGI app (FastAPI)

**Format:**
```python
app = FastAPI()
# Export app
```

**Đặc điểm:**
- FastAPI app đơn giản
- Export `app` thay vì `handler`
- Vercel tự động nhận diện ASGI

## Cách Test

### Bước 1: Deploy Code
Sau khi code được push, đợi Vercel build xong (1-3 phút).

### Bước 2: Test Từng Endpoint

Test theo thứ tự từ đơn giản đến phức tạp:

#### 1. Test Minimal
```
https://nhom7-paceup.vercel.app/api/test-minimal
```

**Kết quả mong đợi:**
- ✅ Nếu thấy response JSON → Python runtime hoạt động
- ❌ Nếu vẫn lỗi 500 → Python runtime có vấn đề

#### 2. Test Lambda Handler
```
https://nhom7-paceup.vercel.app/api/debug-lambda
```

**Kết quả mong đợi:**
- ✅ Nếu thấy response → Lambda handler format hoạt động
- ❌ Nếu lỗi → Kiểm tra logs để xem lỗi gì

#### 3. Test ASGI App
```
https://nhom7-paceup.vercel.app/api/debug-asgi
```

**Kết quả mong đợi:**
- ✅ Nếu thấy response → ASGI format hoạt động
- ❌ Nếu lỗi → Kiểm tra logs

### Bước 3: Kiểm Tra Logs

Với mỗi endpoint, kiểm tra **Runtime Logs** trên Vercel:

1. Vào Vercel Dashboard → Deployment → Tab **"Logs"**
2. Test endpoint (gọi URL)
3. Xem logs mới xuất hiện

**Tìm kiếm:**
- `🚀 DEBUG-LAMBDA.PY LOADED` → File được load
- `🚀 DEBUG-ASGI.PY LOADED` → File được load
- `TEST MINIMAL: Python runtime is working!` → File được load
- `ERROR:` → Có lỗi, xem chi tiết

### Bước 4: Phân Tích Kết Quả

#### Scenario 1: Cả 3 đều lỗi
**Nguyên nhân:** Python runtime không hoạt động hoặc cấu hình sai
**Giải pháp:**
- Kiểm tra `runtime.txt` có đúng không
- Kiểm tra Build Logs xem Python có được cài đặt không

#### Scenario 2: Test Minimal OK, Lambda/ASGI lỗi
**Nguyên nhân:** Format handler không đúng
**Giải pháp:** Dùng format của test-minimal

#### Scenario 3: Lambda OK, ASGI lỗi
**Nguyên nhân:** Vercel không nhận diện ASGI hoặc thiếu dependencies
**Giải pháp:** Dùng Lambda handler format

#### Scenario 4: ASGI OK, Lambda lỗi
**Nguyên nhân:** Lambda handler format không tương thích
**Giải pháp:** Dùng ASGI format cho tất cả

#### Scenario 5: Tất cả đều OK
**Nguyên nhân:** File `api/debug.py` ban đầu có vấn đề
**Giải pháp:** Sửa `api/debug.py` theo format hoạt động được

## Checklist Debug

- [ ] Deploy code mới
- [ ] Test `/api/test-minimal` → Ghi lại kết quả
- [ ] Test `/api/debug-lambda` → Ghi lại kết quả và logs
- [ ] Test `/api/debug-asgi` → Ghi lại kết quả và logs
- [ ] So sánh logs giữa các endpoint
- [ ] Xác định format nào hoạt động
- [ ] Sửa `api/debug.py` theo format đúng

## So Sánh Logs

### Logs Từ Lambda Handler
```
🚀 DEBUG-LAMBDA.PY LOADED
Python version: ...
DEBUG-LAMBDA HANDLER CALLED
Response: {...}
```

### Logs Từ ASGI
```
🚀 DEBUG-ASGI.PY LOADED
DEBUG-ASGI: Attempting to import FastAPI...
DEBUG-ASGI: FastAPI imported successfully
DEBUG-ASGI: FastAPI app created successfully
```

### Logs Từ Minimal
```
TEST MINIMAL: Python runtime is working!
TEST MINIMAL: This file should be executed when imported
```

## Nếu Vẫn Không Thấy Logs

Nếu không thấy BẤT KỲ log nào từ code (kể cả print statements), có nghĩa là:
- File không được load
- Vercel không nhận diện file Python
- Route không đúng

**Giải pháp:**
1. Kiểm tra file có đúng trong repo không
2. Kiểm tra route trong `vercel.json` có đúng không
3. Kiểm tra tên file có đúng extension `.py` không

## Bước Tiếp Theo

Sau khi xác định được format nào hoạt động:

1. **Fix file `api/debug.py`** theo format hoạt động được
2. **Cập nhật `api/index.py`** nếu cần (để dùng format đúng)
3. **Document format đúng** để tránh lỗi tương tự

## Files Liên Quan

- `api/test-minimal.py` - Test cực kỳ đơn giản
- `api/debug-lambda.py` - Lambda handler format
- `api/debug-asgi.py` - ASGI app format
- `api/debug.py` - File ban đầu cần được fix
- `vercel.json` - Cấu hình routes

