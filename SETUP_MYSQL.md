# Hướng dẫn chi tiết chạy project PaceUp với MySQL

## Bước 1: Cài đặt MySQL

### 1.1. Tải MySQL
1. Truy cập: https://dev.mysql.com/downloads/installer/
2. Chọn "MySQL Installer for Windows"
3. Tải file lớn nhất (MySQL Installer - Web) hoặc file offline

### 1.2. Cài đặt MySQL
1. Chạy file installer vừa tải
2. Chọn "Developer Default" hoặc "Server only"
3. Click "Execute" để cài đặt các components
4. Configuration:
   - **Type**: Development Computer
   - **Port**: 3306 (mặc định)
   - **Authentication**: Use Strong Password Encryption
   - **Root Password**: Nhập mật khẩu mạnh (Ghi nhớ mật khẩu này!)
   - **Windows Service**: MySQL80 (hoặc MySQL57/MySQL56 tùy version)
   - **Start at System Startup**: Có thể chọn Yes
5. Click "Execute" để hoàn tất cài đặt

### 1.3. Kiểm tra MySQL đã chạy
1. Mở **Services** (Windows + R → gõ `services.msc`)
2. Tìm "MySQL80" (hoặc MySQL57/MySQL56)
3. Status phải là **"Running"**
4. Nếu chưa chạy: Right-click → **Start**

### 1.4. Kiểm tra MySQL bằng Command Line
Mở Command Prompt hoặc PowerShell và chạy:
```powershell
mysql --version
```

Nếu không tìm thấy lệnh, bạn cần thêm MySQL vào PATH:
- Tìm thư mục MySQL (thường là `C:\Program Files\MySQL\MySQL Server 8.0\bin`)
- Thêm vào System PATH

## Bước 2: Tạo Database

### 2.1. Mở MySQL Command Line Client
1. Tìm "MySQL Command Line Client" trong Start Menu
2. Mở và nhập password root bạn đã đặt

### 2.2. Tạo database (trong MySQL Command Line)
```sql
CREATE DATABASE paceup CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.3. Kiểm tra database đã tạo
```sql
SHOW DATABASES;
```

Bạn sẽ thấy `paceup` trong danh sách.

### 2.4. Thoát MySQL Command Line
```sql
EXIT;
```

### 2.5. Hoặc sử dụng MySQL Workbench (GUI)
1. Tải MySQL Workbench từ: https://dev.mysql.com/downloads/workbench/
2. Cài đặt và mở MySQL Workbench
3. Kết nối với localhost (root user)
4. Tạo database mới:
   - Right-click → "Create Schema"
   - Name: `paceup`
   - Charset: `utf8mb4`
   - Collation: `utf8mb4_unicode_ci`
   - Click "Apply"

### 2.6. Lưu thông tin kết nối
- **Host**: `localhost`
- **Port**: `3306`
- **Database**: `paceup`
- **User**: `root`
- **Password**: (mật khẩu bạn đã đặt)

## Bước 3: Cài đặt Python và Node.js

### 3.1. Cài đặt Python 3.10+
1. Tải từ: https://www.python.org/downloads/
2. Chạy installer → **Chọn "Add Python to PATH"**
3. Cài đặt
4. Kiểm tra: Mở Command Prompt → `python --version` (phải >= 3.10)

### 3.2. Cài đặt Node.js 18+
1. Tải từ: https://nodejs.org/
2. Chọn LTS version (18.x hoặc 20.x)
3. Cài đặt
4. Kiểm tra: `node --version` và `npm --version`

## Bước 4: Setup Backend

### 4.1. Mở Terminal trong thư mục project
```powershell
cd "D:\Cuối kì Kỹ thuật phần mềm\paceup"
```

### 4.2. Tạo virtual environment
```powershell
cd backend
python -m venv venv
```

### 4.3. Kích hoạt virtual environment
```powershell
venv\Scripts\activate
```
(Khi thành công, bạn sẽ thấy `(venv)` ở đầu dòng lệnh)

### 4.4. Cài đặt dependencies
```powershell
pip install -r requirements.txt
```

**Lưu ý**: Nếu gặp lỗi khi cài `cryptography`, bạn có thể cần:
```powershell
pip install --upgrade pip
pip install wheel
pip install -r requirements.txt
```

### 4.5. Tạo file .env
Tạo file `.env` trong thư mục `backend` với nội dung:

```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/paceup?charset=utf8mb4
SECRET_KEY=your-secret-key-change-this-in-production-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000
```

**Lưu ý**: 
- Thay `YOUR_PASSWORD` bằng mật khẩu MySQL root của bạn
- Đảm bảo không có khoảng trắng trong DATABASE_URL

### 4.6. Tạo migration đầu tiên
```powershell
alembic revision --autogenerate -m "Initial migration"
```

### 4.7. Chạy migration
```powershell
alembic upgrade head
```

**Nếu có lỗi**, kiểm tra lại:
- MySQL đang chạy (Services)
- Thông tin trong `.env` đúng
- Database `paceup` đã được tạo
- User `root` có quyền tạo bảng

### 4.8. Chạy backend server
```powershell
python run.py
```

Khi thành công, bạn sẽ thấy:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Giữ terminal này mở!**

## Bước 5: Setup Frontend

### 5.1. Mở Terminal mới (giữ backend đang chạy)
```powershell
cd "D:\Cuối kì Kỹ thuật phần mềm\paceup"
```

### 5.2. Cài đặt dependencies
```powershell
npm install
```

### 5.3. Tạo file .env.local
Tạo file `.env.local` trong thư mục gốc với nội dung:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 5.4. Copy images vào public folder
```powershell
mkdir public\Image
xcopy Image public\Image /E /I
```

Hoặc copy thủ công:
- Copy toàn bộ thư mục `Image` vào thư mục `public`

### 5.5. Chạy frontend
```powershell
npm run dev
```

Khi thành công, bạn sẽ thấy:
```
- Local:        http://localhost:3000
```

## Bước 6: Kiểm tra

### 6.1. Kiểm tra Backend
1. Mở trình duyệt: http://localhost:8000/docs
2. Bạn sẽ thấy Swagger UI với các API endpoints

### 6.2. Kiểm tra Frontend
1. Mở trình duyệt: http://localhost:3000
2. Trang chủ sẽ hiển thị

### 6.3. Test đăng ký tài khoản
1. Vào http://localhost:3000/register
2. Điền form đăng ký (3 bước)
3. Sau khi đăng ký thành công, bạn sẽ được chuyển đến trang login

### 6.4. Test đăng nhập
1. Vào http://localhost:3000/login
2. Đăng nhập với email và password vừa tạo
3. Sau khi đăng nhập thành công, bạn sẽ được chuyển về trang chủ

## Troubleshooting

### Lỗi: "Can't connect to MySQL server"
- Kiểm tra MySQL đang chạy (Services → MySQL80)
- Kiểm tra port 3306 không bị chặn bởi firewall
- Thử kết nối bằng MySQL Command Line Client

### Lỗi: "Access denied for user 'root'@'localhost'"
- Kiểm tra password trong `.env` đúng
- Thử reset password MySQL root:
  ```sql
  ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
  FLUSH PRIVILEGES;
  ```

### Lỗi: "Unknown database 'paceup'"
- Đảm bảo đã tạo database `paceup`
- Kiểm tra tên database trong `.env` đúng

### Lỗi: "Module 'pymysql' not found"
- Đảm bảo đã activate virtual environment
- Chạy lại: `pip install -r requirements.txt`

### Lỗi: "cryptography installation failed"
```powershell
pip install --upgrade pip
pip install wheel
pip install cryptography
pip install -r requirements.txt
```

### Lỗi: "Port 8000 already in use"
- Đóng ứng dụng đang dùng port 8000
- Hoặc đổi port trong `backend/run.py`

### Lỗi: "Port 3000 already in use"
- Đóng ứng dụng đang dùng port 3000
- Hoặc chạy: `npm run dev -- -p 3001`

### Lỗi migration: "Table already exists"
- Xóa database và tạo lại:
  ```sql
  DROP DATABASE paceup;
  CREATE DATABASE paceup CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```
- Hoặc xóa các bảng cũ và chạy lại migration

## Cấu trúc thư mục sau khi setup

```
paceup/
├── backend/
│   ├── venv/              # Virtual environment
│   ├── .env               # Environment variables (BẠN TẠO)
│   ├── app/
│   └── ...
├── public/
│   └── Image/             # Images (BẠN COPY VÀO)
├── .env.local             # Frontend env (BẠN TẠO)
├── node_modules/          # Sau khi npm install
└── ...
```

## Lưu ý quan trọng

1. **Luôn chạy backend trước khi chạy frontend**
2. **Giữ cả 2 terminal mở khi phát triển**
3. **Backend chạy ở**: http://localhost:8000
4. **Frontend chạy ở**: http://localhost:3000
5. **API Documentation**: http://localhost:8000/docs
6. **MySQL charset**: Đảm bảo database dùng `utf8mb4` để hỗ trợ tiếng Việt

## Khác biệt giữa PostgreSQL và MySQL

- **Connection string**: `mysql+pymysql://` thay vì `postgresql://`
- **Port**: 3306 thay vì 5432
- **ARRAY type**: MySQL dùng JSON thay vì ARRAY
- **Timezone**: MySQL DateTime không hỗ trợ timezone như PostgreSQL
- **Charset**: Cần chỉ định `utf8mb4` cho MySQL

Nếu gặp lỗi, hãy gửi thông báo lỗi để được hỗ trợ!

