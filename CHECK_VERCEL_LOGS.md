# Cách Kiểm Tra Vercel Logs Để Debug Backend Error

## ✅ Đã Áp Dụng Phương Pháp "Bẫy Lỗi"

Code đã được cập nhật với phương pháp **"Bẫy Lỗi"** - tất cả import và khởi tạo app đã được bọc trong `try-except` để bắt mọi lỗi và in ra log chi tiết.

### Các Thay Đổi Đã Thực Hiện:
1. ✅ `api/index.py` - Bọc toàn bộ import và app initialization trong try-except
2. ✅ `backend/app/main.py` - Bọc import trong try-except để bắt lỗi sớm
3. ✅ `requirements.txt` - Đổi sang Pydantic v1.10.13 và FastAPI 0.103.0 (tránh xung đột)
4. ✅ `backend/app/core/config.py` - Sửa import từ `pydantic_settings` sang `pydantic`

## Bước 1: Commit và Push Code Lên GitHub

**LƯU Ý QUAN TRỌNG:** Bạn cần commit và push các thay đổi này lên GitHub để Vercel tự động deploy lại.

### Cách Push Code:
```bash
# Kiểm tra các file đã thay đổi
git status

# Thêm các file đã sửa
git add api/index.py backend/app/main.py requirements.txt backend/requirements.txt backend/app/core/config.py

# Commit với message rõ ràng
git commit -m "Apply error trapping method - wrap imports in try-except and fix Pydantic version"

# Push lên GitHub
git push
```

## Bước 2: Đợi Vercel Build

1. Vào Vercel Dashboard: https://vercel.com/dashboard
2. Chọn project: **nhom7-paceup**
3. Đợi deployment mới nhất build xong (thường mất 1-3 phút)

## Bước 3: Xem Deployment Logs

1. Click vào **deployment mới nhất** (deployment vừa build xong)
2. Click tab **"Logs"** ở trên cùng
3. Tìm các dòng có format:
   ```
   --------------------------------------------------
   CRITICAL ERROR DURING STARTUP:
   [Error message cụ thể]
   [Full traceback chi tiết]
   --------------------------------------------------
   ```

## Bước 4: Tìm Error Message Chi Tiết

Với phương pháp "Bẫy lỗi", bạn sẽ thấy lỗi rõ ràng hơn. Tìm các dòng có:
- `CRITICAL ERROR DURING STARTUP` (từ api/index.py)
- `CRITICAL ERROR DURING APP MAIN INITIALIZATION` (từ backend/app/main.py)
- `ModuleNotFoundError: No module named 'xxx'`
- `ImportError: cannot import name 'xxx'`
- `PydanticUserError` (nếu có vấn đề với Pydantic)
- Full traceback với đường dẫn file và số dòng lỗi

## Bước 5: Copy Toàn Bộ Error Message

Copy **TOÀN BỘ** error message bao gồm:
- Dòng `--------------------------------------------------`
- `CRITICAL ERROR DURING STARTUP`
- Error type và message
- Full traceback (toàn bộ stack trace)

## Bước 6: Gửi Error Message

Sau khi có error message chi tiết, gửi cho tôi để tôi có thể fix chính xác vấn đề.

---

## Hoặc Test Runtime Logs

1. Vào Vercel dashboard → Project → **Logs** (tab ở trên cùng)
2. Click **"Runtime Logs"** (hoặc mở tab Runtime Logs)
3. Test endpoint: `https://nhom7-paceup.vercel.app/api/v1/health`
4. Xem logs mới xuất hiện trong Runtime Logs
5. Copy error message (sẽ có format `CRITICAL ERROR DURING STARTUP` nếu có lỗi)

---

## Lưu Ý

- Nếu không thấy error `CRITICAL ERROR DURING STARTUP`, có nghĩa là app đã khởi tạo thành công! 🎉
- Nếu thấy error, đó chính là nguyên nhân gốc rễ - copy toàn bộ error để tôi fix

