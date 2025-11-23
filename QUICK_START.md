# Hướng dẫn nhanh - Quick Start Guide

## Bước 1: Cài đặt MySQL

### Windows:
1. Tải MySQL Installer: https://dev.mysql.com/downloads/installer/
2. Chạy installer, chọn "Developer Default"
3. Nhập password cho root user (Ghi nhớ!)
4. Hoàn tất cài đặt

### Kiểm tra MySQL đã chạy:
- Mở Services (Windows + R → `services.msc`)
- Tìm "MySQL80" → Status phải là "Running"

## Bước 2: Tạo Database

Mở MySQL Command Line Client hoặc MySQL Workbench và chạy:

```sql
CREATE DATABASE paceup CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Bước 3: Setup Backend (Tự động)

### Windows:
```powershell
cd backend
.\setup.bat
```

### Linux/Mac:
```bash
cd backend
chmod +x setup.sh
./setup.sh
```

Sau đó:
1. Sửa file `.env` trong thư mục `backend`:
   - Thay `YOUR_PASSWORD` bằng password MySQL của bạn
   - Thay `your-secret-key-change-this-in-production-min-32-characters` bằng một chuỗi ngẫu nhiên

2. Chạy migrations:
```powershell
# Windows
venv\Scripts\activate
alembic upgrade head

# Linux/Mac
source venv/bin/activate
alembic upgrade head
```

3. Chạy backend:
```powershell
python run.py
```

Backend sẽ chạy tại: http://localhost:8000

## Bước 4: Setup Frontend (Tự động)

### Windows:
```powershell
# Quay về thư mục gốc
cd ..
.\setup-frontend.bat
```

### Linux/Mac:
```bash
# Quay về thư mục gốc
cd ..
chmod +x setup-frontend.sh
./setup-frontend.sh
```

Sau đó chạy frontend:
```powershell
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

## Kiểm tra

1. Backend API: http://localhost:8000/docs
2. Frontend: http://localhost:3000

## Lưu ý

- Luôn chạy backend trước khi chạy frontend
- Giữ cả 2 terminal mở khi phát triển
- Nếu có lỗi, xem file `SETUP_MYSQL.md` để biết chi tiết

