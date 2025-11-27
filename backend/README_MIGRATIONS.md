# Quick Start: Chạy Migration

## Cách nhanh nhất

```bash
# Từ thư mục backend/
cd backend
python run_migrations.py
```

Hoặc từ project root:

```bash
npm run migrate
```

## Các lệnh hữu ích

```bash
# Xem revision hiện tại
python run_migrations.py --current

# Xem lịch sử migrations
python run_migrations.py --history

# Rollback 1 revision
python run_migrations.py --downgrade
```

## Xem hướng dẫn chi tiết

Xem file `MIGRATION_GUIDE.md` để biết thêm chi tiết.

