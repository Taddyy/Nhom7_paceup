# Hướng dẫn chạy Database Migration

## Tổng quan

Script này giúp bạn chạy Alembic database migrations một cách dễ dàng. Có 3 cách để chạy:

1. **Python script** (Cross-platform - Khuyến nghị)
2. **PowerShell script** (Windows)
3. **Bash script** (Linux/Mac)

## Cách sử dụng

### 1. Python Script (Khuyến nghị)

```bash
# Chạy tất cả migrations chưa được apply
cd backend
python run_migrations.py

# Xem revision hiện tại
python run_migrations.py --current

# Xem lịch sử migrations
python run_migrations.py --history

# Xem head revisions
python run_migrations.py --heads

# Rollback một revision
python run_migrations.py --downgrade
```

### 2. PowerShell Script (Windows)

```powershell
# Chạy tất cả migrations
cd backend
.\run_migrations.ps1

# Các options khác
.\run_migrations.ps1 -Current
.\run_migrations.ps1 -History
.\run_migrations.ps1 -Heads
.\run_migrations.ps1 -Downgrade
```

### 3. Bash Script (Linux/Mac)

```bash
# Cấp quyền thực thi (chỉ cần làm 1 lần)
chmod +x backend/run_migrations.sh

# Chạy migrations
cd backend
./run_migrations.sh

# Các options khác
./run_migrations.sh --current
./run_migrations.sh --history
./run_migrations.sh --heads
./run_migrations.sh --downgrade
```

## Cấu hình Database

Script sẽ tự động sử dụng `DATABASE_URL` từ:

1. **Environment variable** `DATABASE_URL`
2. **File `.env`** trong thư mục `backend/`
3. **Default value** trong `backend/app/core/config.py` (chỉ dùng cho local development)

### Format DATABASE_URL

```
mysql+pymysql://username:password@host:port/database_name?charset=utf8mb4
```

### Ví dụ

**Local Development:**
```bash
export DATABASE_URL="mysql+pymysql://root:password@localhost:3306/paceup?charset=utf8mb4"
python run_migrations.py
```

**Production (TiDB):**
```bash
# Set trong Vercel environment variables hoặc
export DATABASE_URL="mysql+pymysql://user:pass@tidb-host:4000/paceup?charset=utf8mb4"
python run_migrations.py
```

## Kiểm tra Migration

### Xem revision hiện tại
```bash
python run_migrations.py --current
```

### Xem tất cả migrations
```bash
python run_migrations.py --history
```

### Xem SQL sẽ được chạy (không thực thi)
```bash
cd backend
python -m alembic upgrade head --sql
```

## Rollback Migration

Nếu cần rollback:

```bash
# Rollback 1 revision
python run_migrations.py --downgrade

# Hoặc rollback về revision cụ thể
cd backend
python -m alembic downgrade <revision_id>
```

## Troubleshooting

### Lỗi: "alembic.ini not found"
- Đảm bảo bạn đang chạy script từ thư mục `backend/`
- Hoặc script sẽ tự động tìm thư mục backend

### Lỗi: "Alembic is not installed"
```bash
pip install alembic
```

### Lỗi: "Can't connect to database"
- Kiểm tra `DATABASE_URL` đúng chưa
- Kiểm tra database server đang chạy
- Kiểm tra firewall/network settings

### Lỗi: "Target database is not up to date"
- Chạy `python run_migrations.py` để apply tất cả migrations

## Migration hiện tại

Migration mới nhất: `0df00e14983a_add_post_type_to_blog_posts.py`

Migration này thêm column `post_type` vào bảng `blog_posts` để phân biệt giữa "blog" và "content" posts.

## Production Deployment

### Trên Vercel

1. **Set environment variable** `DATABASE_URL` trong Vercel dashboard
2. **Chạy migration** trước khi deploy:
   ```bash
   # Local với production DATABASE_URL
   export DATABASE_URL="your-production-url"
   python run_migrations.py
   ```

3. **Hoặc** thêm vào build command trong Vercel:
   ```json
   {
     "buildCommand": "cd backend && python run_migrations.py && cd .. && npm run build"
   }
   ```

### Trên Server riêng

1. SSH vào server
2. Set `DATABASE_URL` environment variable
3. Chạy: `python run_migrations.py`

