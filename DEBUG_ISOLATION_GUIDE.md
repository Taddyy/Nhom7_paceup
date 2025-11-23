# Hướng Dẫn Debug - Chiến Thuật "Cô Lập và Thay Thế"

## Vấn Đề

Nếu lỗi xảy ra TRƯỚC KHI code Python được chạy (try-catch không bắt được), có thể:
1. Lỗi ở tầng Build (khi cài thư viện)
2. Lỗi ở cấu hình môi trường
3. Lỗi ở `requirements.txt` (thư viện Windows-only hoặc xung đột)

## Bước 1: Test File Debug Đơn Giản ✅

Đã tạo file `api/debug.py` - file đơn giản nhất, **KHÔNG import bất kỳ thư viện nặng nào**.

### Cách Test:

1. **Deploy code hiện tại** (đã có file debug.py và route `/api/debug`)

2. **Test endpoint debug:**
   ```
   https://nhom7-paceup.vercel.app/api/debug
   ```
   hoặc
   ```
   https://nhom7-paceup.vercel.app/debug
   ```

3. **Kiểm tra kết quả:**

   ✅ **Nếu thấy response:**
   ```json
   {
     "status": "ok",
     "message": "Hello World - Môi trường ổn ✅",
     ...
   }
   ```
   → **Môi trường Vercel OK!** Lỗi nằm ở `requirements.txt` hoặc code backend. → **Sang Bước 2.**

   ❌ **Nếu vẫn lỗi:** → **Sang Bước 3** (kiểm tra Build Logs)

---

## Bước 2: Kiểm Tra "Sát Thủ Thầm Lặng" trong requirements.txt

Nếu Bước 1 chạy được, thì 99% lỗi nằm ở `requirements.txt`.

### Các thư viện "sát thủ" cần XÓA:

- ❌ `pywin32` (Chỉ chạy trên Windows - **Thủ phạm số 1**)
- ❌ `tkinter` (Vercel không hỗ trợ GUI)
- ❌ `psycopg2` (Nên đổi thành `psycopg2-binary`)
- ❌ Các thư viện local path (ví dụ: `C:\Users\...`)

### Kiểm Tra requirements.txt Hiện Tại:

Hiện tại file `requirements.txt` của bạn **KHÔNG có** các thư viện trên. Nhưng có thể có xung đột giữa các version.

### Thử Giải Pháp: Giảm Tối Thiểu Dependencies

1. Tạo file `requirements-minimal.txt`:
   ```txt
   fastapi==0.104.1
   pydantic>=2.9.0
   pydantic-settings>=2.5.0
   mangum>=0.17.0
   ```

2. Test với minimal requirements:
   - Tạm thời rename `requirements.txt` → `requirements-full.txt`
   - Copy `requirements-minimal.txt` → `requirements.txt`
   - Deploy và test

3. Nếu chạy được, thêm dần các thư viện khác vào.

---

## Bước 3: Kiểm Tra Build Logs (KHÔNG PHẢI Runtime Logs)

**QUAN TRỌNG:** Lỗi có thể xảy ra ở tầng **Build**, không phải Runtime!

### Cách Xem Build Logs:

1. Vào Vercel Dashboard: https://vercel.com/dashboard
2. Chọn project: **nhom7-paceup**
3. Click vào **deployment gần nhất** (đang bị lỗi)
4. Tìm tab **"Build Logs"** hoặc phần **"Building"**
5. Scroll xuống và tìm các dòng **màu đỏ** có:
   - `Error: Could not install...`
   - `ERROR: Failed building wheel for...`
   - `ModuleNotFoundError: No module named...`
   - `ERROR: Dependency resolution failed`

### Các Lỗi Build Phổ Biến:

- ❌ **Failed building wheel**: Thư viện cần compile nhưng thiếu build tools
- ❌ **Dependency resolution failed**: Xung đột version giữa các thư viện
- ❌ **Could not find version**: Thư viện không có version đó cho Python 3.12

### Nếu Thấy Lỗi Build:

Copy **TOÀN BỘ** error message từ Build Logs và gửi để fix.

---

## Bước 4: Kiểm Tra Runtime Logs (Sau Khi Build Thành Công)

Nếu Build thành công nhưng Runtime vẫn lỗi:

1. Vào Vercel Dashboard → Deployment → Tab **"Logs"** (Runtime Logs)
2. Test endpoint: `/api/debug`
3. Xem log để biết lỗi gì

---

## Tóm Tắt Các Endpoint Test:

1. **Test môi trường đơn giản:**
   - `https://nhom7-paceup.vercel.app/api/debug`
   - `https://nhom7-paceup.vercel.app/debug`

2. **Test endpoint cũ (nếu có):**
   - `https://nhom7-paceup.vercel.app/api/test`

3. **Test backend chính:**
   - `https://nhom7-paceup.vercel.app/api/v1/health`

---

## Checklist Debug:

- [ ] Test `/api/debug` - có chạy không?
- [ ] Kiểm tra Build Logs - có lỗi build không?
- [ ] Kiểm tra Runtime Logs - có lỗi runtime không?
- [ ] Kiểm tra `requirements.txt` - có thư viện Windows-only không?
- [ ] Test với minimal requirements - có chạy không?

---

## Kết Quả Mong Đợi:

✅ **File debug.py chạy được** → Môi trường OK, lỗi ở dependencies hoặc code
❌ **File debug.py KHÔNG chạy** → Lỗi ở cấu hình môi trường hoặc Build

