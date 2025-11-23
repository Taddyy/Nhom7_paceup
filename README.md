<<<<<<< HEAD
# PaceUp - Running Community Platform

A full-stack web application for running community management, built with Next.js (frontend) and FastAPI (backend).

## Project Structure

```
paceup/
├── app/                    # Next.js frontend application
├── components/            # React components
├── lib/                   # Frontend utilities and API clients
├── backend/               # FastAPI backend application
│   ├── app/              # Backend application code
│   │   ├── api/         # API routes
│   │   ├── core/        # Core utilities (config, security, database)
│   │   ├── models/      # Database models
│   │   └── schemas/     # Pydantic schemas
│   └── alembic/         # Database migrations
├── Image/                # Static images
└── Web screens/         # Design mockups
```

## Features

### Frontend
- Home page with hero section, features, and CTA
- Blog listing and detail pages
- Event listing and detail pages
- User authentication (login/register)
- Multi-step registration form
- Responsive design with Tailwind CSS

### Backend
- RESTful API with FastAPI
- JWT authentication
- User management
- Blog post CRUD operations
- Event management and registration
- MySQL database

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- MySQL 8.0+ (hoặc MySQL 5.7+)

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

3. Run development server:
```bash
npm run dev
```

Frontend will be available at http://localhost:3000

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```env
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/paceup?charset=utf8mb4
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000
```

5. Run database migrations:
```bash
alembic upgrade head
```

6. Run the server:
```bash
python run.py
```

Backend will be available at http://localhost:8000

## API Documentation

Once the backend is running:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development

### Frontend
- Framework: Next.js 14 with TypeScript
- Styling: Tailwind CSS
- State Management: React Hooks

### Backend
- Framework: FastAPI
- Database: MySQL with SQLAlchemy ORM (PyMySQL driver)
- Authentication: JWT tokens
- Migrations: Alembic

## License

MIT

=======
# Đồ án Nhập môn Công nghệ Phần mềm: Media Platform Giải Chạy

Đây là repository source code và tài liệu cho đồ án môn học Nhập môn Công nghệ Phần mềm, với đề tài phát triển một Web App truyền thông đa phương tiện dành cho các sự kiện giải chạy.

## 📝 Mô tả dự án

Dự án này xây dựng một hệ thống quản trị nội dung số (CMS) chuyên biệt, cho phép doanh nghiệp tổ chức giải chạy có thể quản lý và xuất bản nội dung media một cách hiệu quả. Hệ thống áp dụng quy trình phát triển phần mềm Agile-Scrum, được quản lý và theo dõi chi tiết trên Jira, đồng bộ với GitHub qua Smart Commits.

## ✨ Tính năng nổi bật

* **Quản lý Vòng đời Nội dung:** Quy trình tạo, gửi duyệt, và phê duyệt/từ chối nội dung một cách chặt chẽ.
* **Xuất bản Đa kênh:** Lên lịch và xuất bản nội dung tự động lên các kênh tích hợp như Website, Fanpage Facebook...
* **Công cụ hỗ trợ sáng tạo:** Tích hợp công cụ tạo poster/thumbnail đơn giản từ template có sẵn.
* **Tối ưu SEO & Analytics:** Tự động tạo sitemap, hỗ trợ thẻ OpenGraph/Schema và cung cấp dashboard theo dõi hiệu quả nội dung.
* **Trải nghiệm người dùng hiện đại:** Hỗ trợ Progressive Web App (PWA) cho phép truy cập offline và gửi thông báo đẩy (Push Notifications).
* **Hỗ trợ Livestream:** Tích hợp và phát các luồng video trực tiếp từ các nền tảng mạng xã hội.

## 🎨 Thiết kế hệ thống (Artefacts)

Các tài liệu thiết kế và phân tích hệ thống được lưu trữ trong thư mục `/diagrams`:

* **Sơ đồ Use Case:** Mô tả các chức năng chính và tương tác của người dùng.
    * [Xem tại đây](./diagrams/use-case-diagram.png)
* **Sơ đồ Tuần tự (Sequence Diagram):** Mô tả chi tiết 2 luồng quan trọng:
    * Luồng duyệt và xuất bản nội dung - [Xem tại đây](./diagrams/sequence-diagram-approval.png)
    * Luồng người dùng xem livestream - [Xem tại đây](./diagrams/sequence-diagram-livestream.png)
* **Sơ đồ Quan hệ Thực thể (ERD):** Thiết kế chi tiết cơ sở dữ liệu.
    * [Xem tại đây](./diagrams/erd.png)

*(Lưu ý: Bạn hãy đảm bảo tên file và đường dẫn đến các file ảnh sơ đồ của bạn là chính xác)*

## 🛠️ Công nghệ sử dụng

* **Frontend:** `[Điền công nghệ bạn dùng, ví dụ: React.js, Vue.js, Angular...]`
* **Backend:** `[Điền công nghệ bạn dùng, ví dụ: Node.js (Express), Python (Django), Java (Spring Boot)...]`
* **Database:** `[Điền công nghệ bạn dùng, ví dụ: PostgreSQL, MySQL, MongoDB...]`
* **Project Management:** Jira (Agile Scrum)
* **Version Control:** Git & GitHub

## 🚀 Hướng dẫn cài đặt & Chạy thử

Để chạy dự án này trên máy tính cá nhân, hãy làm theo các bước sau:

**Yêu cầu:**
* Cài đặt Git
* Cài đặt Node.js (phiên bản 16.x trở lên)

**Các bước cài đặt:**

1.  **Clone repository về máy:**
    ```bash
    git clone [https://github.com/](https://github.com/)[Tên-user-của-bạn]/[Tên-repo-của-bạn].git
    ```

2.  **Di chuyển vào thư mục dự án:**
    ```bash
    cd [Tên-repo-của-bạn]
    ```

3.  **Cài đặt các thư viện cần thiết (dependencies):**
    ```bash
    # Dành cho project backend
    cd backend
    npm install

    # Dành cho project frontend
    cd ../frontend
    npm install
    ```

4.  **Chạy dự án:**
    ```bash
    # Chạy backend (ví dụ)
    cd ../backend
    npm start

    # Chạy frontend (ví dụ)
    cd ../frontend
    npm start
    ```

5.  Mở trình duyệt và truy cập vào `http://localhost:3000` (hoặc port tương ứng).


## 👤 Tác giả

* **Họ và tên:** `[Tên của bạn]`
* **MSSV:** `[Mã số sinh viên của bạn]`
* **Lớp:** `[Lớp của bạn]`

---

Cảm ơn đã xem qua repository này!
>>>>>>> 5c4e43f3c92207ca49f6d63d6fbacd692ff17162
