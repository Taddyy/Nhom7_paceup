# Hướng Dẫn Kiểm Tra và Sửa Database Connection

## Vấn đề Hiện Tại

Backend đang không thể kết nối database vì:
- Database engine creation failed
- SessionLocal = None (không thể tạo database session)
- Health check trả về: `{"status":"unhealthy","database":"disconnected"}`

## Nguyên Nhân Có Thể

1. **DATABASE_URL chưa được set trong Vercel environment variables**
2. **DATABASE_URL format không đúng**
3. **DATABASE_URL đang point đến database cũ (test) thay vì database mới (paceup)**

## Cách Kiểm Tra và Sửa

### Bước 1: Kiểm Tra Vercel Environment Variables

1. Vào Vercel Dashboard: https://vercel.com/dashboard
2. Chọn project: **nhom7-paceup**
3. Vào **Settings** → **Environment Variables**
4. Kiểm tra xem có biến `DATABASE_URL` không:
   - Nếu không có → Thêm mới
   - Nếu có → Kiểm tra format

### Bước 2: Format DATABASE_URL Đúng

**Format cho TiDB Cloud:**
```
mysql+pymysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME?charset=utf8mb4
```

**Ví dụ:**
```
mysql+pymysql://2J436DV2xSdM6WM.root:8mKd2eeLLOPUfNB2@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/paceup?charset=utf8mb4
```

**Lưu ý quan trọng:**
- Database name phải là `paceup` (không phải `test`)
- Phải có `mysql+pymysql://` prefix
- Phải có `?charset=utf8mb4` ở cuối

### Bước 3: Lấy Connection String từ TiDB Cloud

1. Vào TiDB Cloud Dashboard: https://tidbcloud.com
2. Chọn cluster của bạn
3. Vào tab **Connect**
4. Chọn **Standard Connection** hoặc **Public Endpoint**
5. Copy connection string và thay database name thành `paceup`

### Bước 4: Cập Nhật DATABASE_URL trong Vercel

1. Vào Vercel Dashboard → Project → Settings → Environment Variables
2. Tìm hoặc tạo biến `DATABASE_URL`
3. Paste connection string mới (với database name `paceup`)
4. Đảm bảo:
   - **Environment**: Production, Preview, Development (chọn tất cả)
   - **Value**: Connection string đúng format

### Bước 5: Redeploy Application

Sau khi cập nhật environment variable:

1. Vào **Deployments** tab trong Vercel
2. Click vào deployment mới nhất
3. Click **Redeploy** (hoặc push một commit mới lên GitHub)
4. Đợi deployment xong (1-3 phút)

### Bước 6: Kiểm Tra Kết Nối

Sau khi deploy xong, kiểm tra:

```bash
# Kiểm tra health endpoint
curl https://nhom7-paceup.vercel.app/api/v1/health

# Kết quả mong đợi:
# {"status":"healthy","database":"connected"}
```

```bash
# Kiểm tra database name
curl https://nhom7-paceup.vercel.app/api/v1/check-db

# Kết quả mong đợi:
# {"status":"success","database_name_from_url":"paceup","database_name_from_db":"paceup","match":true}
```

## Sau Khi Database Connection OK

### 1. Tạo Database Tables

```bash
POST https://nhom7-paceup.vercel.app/api/v1/init-db
```

### 2. Tạo Admin User

```bash
POST https://nhom7-paceup.vercel.app/api/v1/seed-admin
```

Response mong đợi:
```json
{
  "status": "success",
  "message": "Admin user created successfully",
  "email": "admin@gmail.com",
  "password": "admin123",
  "role": "admin"
}
```

## Troubleshooting

### Lỗi: "Connections using insecure transport are prohibited"
- **Nguyên nhân**: TiDB Cloud yêu cầu SSL
- **Giải pháp**: Đảm bảo connection string có format đúng với `mysql+pymysql://`

### Lỗi: "Access denied"
- **Nguyên nhân**: Username/password sai
- **Giải pháp**: Kiểm tra lại credentials trong TiDB Cloud dashboard

### Lỗi: "Unknown database 'paceup'"
- **Nguyên nhân**: Database `paceup` chưa được tạo trong TiDB
- **Giải pháp**: 
  1. Vào TiDB Cloud dashboard
  2. Tạo database mới tên `paceup`
  3. Hoặc update DATABASE_URL để dùng database hiện có

### Lỗi: SessionLocal is None
- **Nguyên nhân**: Database engine creation failed
- **Giải pháp**: Kiểm tra DATABASE_URL format và credentials

## Checklist

- [ ] DATABASE_URL đã được set trong Vercel environment variables
- [ ] DATABASE_URL format đúng: `mysql+pymysql://user:pass@host:port/paceup?charset=utf8mb4`
- [ ] Database name là `paceup` (không phải `test`)
- [ ] Đã redeploy application sau khi update environment variable
- [ ] Health check trả về `"database": "connected"`
- [ ] Check-db endpoint cho thấy database name match
- [ ] Đã chạy `/api/v1/init-db` để tạo tables
- [ ] Đã chạy `/api/v1/seed-admin` để tạo admin user

