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

