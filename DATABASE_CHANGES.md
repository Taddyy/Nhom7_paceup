# Database Changes Required

Bạn cần tạo 2 bảng mới và cập nhật 1 bảng trong TiDB:

## 1. Tạo bảng `reports` (Báo cáo bài viết)

**Lưu ý:** Tạo bảng theo 2 bước để tránh lỗi foreign key constraint.

### Bước 1: Tạo bảng không có foreign key

```sql
CREATE TABLE reports (
    id VARCHAR(255) NOT NULL,
    post_id VARCHAR(255) NOT NULL,
    reporter_id VARCHAR(255) NOT NULL,
    reasons JSON NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_post_id (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
```

### Bước 2: Thêm foreign key constraints

```sql
ALTER TABLE reports 
ADD CONSTRAINT fk_reports_post_id 
FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE;

ALTER TABLE reports 
ADD CONSTRAINT fk_reports_reporter_id 
FOREIGN KEY (reporter_id) REFERENCES users(id);
```

## 2. Cập nhật bảng `event_registrations`

Thêm các cột mới:

```sql
ALTER TABLE event_registrations
ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL,
ADD COLUMN rejection_reasons JSON,
ADD COLUMN rejection_description TEXT,
ADD COLUMN updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP;
```

## Lưu ý

- Bảng `reports` sẽ lưu các báo cáo của người dùng về bài viết
- Bảng `event_registrations` giờ sẽ có status để theo dõi đăng ký cần duyệt:
  - `pending`: Chờ duyệt
  - `approved`: Đã duyệt
  - `rejected`: Đã từ chối (kèm lý do)

Sau khi chạy các lệnh SQL trên, backend sẽ hoạt động đúng với các tính năng mới.

