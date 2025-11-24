# TiDB Connection Guide

## TiDB và MySQL Compatibility

**TiDB là MySQL-compatible database**, nghĩa là:
- ✅ Có thể sử dụng MySQL client/driver để kết nối
- ✅ Sử dụng MySQL protocol
- ✅ Hỗ trợ hầu hết MySQL syntax và features

## Connection String Format

### TiDB Cloud Connection String
```
mysql+pymysql://USERNAME:PASSWORD@HOST:PORT/DATABASE?charset=utf8mb4
```

Ví dụ:
```
mysql+pymysql://2J436DV2xSdM6WM.root:8mKd2eeLLOPUfNB2@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/paceup
```

**Lưu ý:** Database name hiện tại là `paceup`. Database name được đọc từ `DATABASE_URL` environment variable và có thể được thay đổi trong Vercel project settings.

### Giải thích:
- `mysql+pymysql://` - Protocol và driver (pymysql)
- `USERNAME:PASSWORD` - TiDB Cloud credentials
- `HOST:PORT` - TiDB Cloud endpoint
- `DATABASE` - Database name (ví dụ: `paceup`)
- `charset=utf8mb4` - Character encoding

## SSL Configuration

TiDB Cloud **yêu cầu SSL connection**. Code đã tự động xử lý:

```python
# backend/app/core/database.py
if "tidbcloud.com" in settings.DATABASE_URL:
    connect_args = {
        "ssl": {
            "ssl_disabled": False,
            "check_hostname": False
        }
    }
```

## Environment Variables

Trong Vercel, cần set:
- `DATABASE_URL` - TiDB connection string
- `SECRET_KEY` - JWT secret key
- `ENVIRONMENT=production`

## Kiểm tra Connection

### 1. Test từ Python:
```python
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print(result.fetchone())
```

### 2. Test từ API:
```bash
curl https://nhom7-paceup.vercel.app/api/v1/health
```

Nếu trả về `{"status": "healthy", "database": "connected"}` → Database OK ✅

## Troubleshooting

### Lỗi: "Connections using insecure transport are prohibited"
- **Nguyên nhân**: TiDB Cloud yêu cầu SSL
- **Giải pháp**: Đảm bảo connection string có `mysql+pymysql://` và SSL được enable

### Lỗi: "Access denied"
- **Nguyên nhân**: Username/password sai
- **Giải pháp**: Kiểm tra lại credentials trong TiDB Cloud dashboard

### Lỗi: "Can't connect to MySQL server"
- **Nguyên nhân**: Host/port sai hoặc firewall block
- **Giải pháp**: 
  - Kiểm tra TiDB Cloud endpoint
  - Đảm bảo Vercel IPs được allow trong TiDB Cloud (nếu có firewall)

## TiDB Cloud Dashboard

1. Truy cập: https://tidbcloud.com
2. Vào cluster của bạn
3. Xem connection string trong "Connect" tab
4. Copy connection string và paste vào Vercel environment variables

## Lưu ý

- TiDB Cloud **free tier** có giới hạn:
  - Storage: 5GB
  - Connections: Limited
  - Performance: Shared resources

- Để team members có thể connect:
  - Tạo user mới trong TiDB Cloud dashboard
  - Hoặc share connection string (không khuyến nghị cho production)

