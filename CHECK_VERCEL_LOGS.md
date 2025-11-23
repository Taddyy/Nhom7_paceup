# Cách Kiểm Tra Vercel Logs Để Debug Backend Error

## Bước 1: Vào Vercel Dashboard
1. Truy cập: https://vercel.com/dashboard
2. Chọn project: **nhom7-paceup**

## Bước 2: Xem Deployment Logs
1. Click vào deployment mới nhất (commit `bc8da65` hoặc mới hơn)
2. Click tab **"Logs"** ở trên cùng
3. Tìm các dòng có màu đỏ (errors)

## Bước 3: Tìm Error Message
Tìm các dòng có:
- ❌ Import Error Details
- Error importing api/index.py
- ModuleNotFoundError
- ImportError
- Traceback

## Bước 4: Copy Toàn Bộ Error
Copy toàn bộ error message bao gồm:
- Error type
- Error message
- Backend path
- Python path
- Full traceback

## Gửi Error Message Cho Tôi
Sau khi có error message, gửi cho tôi để tôi có thể fix chính xác vấn đề.

---

## Hoặc Test Runtime Logs
1. Vào Vercel dashboard → Project → **Logs** (tab ở trên)
2. Click **"Runtime Logs"**
3. Test endpoint: `https://nhom7-paceup.vercel.app/api/v1/health`
4. Xem logs mới xuất hiện
5. Copy error message

