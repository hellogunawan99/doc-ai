# DocClaw - Document Intelligence Platform

A web-based document Q&A platform where companies upload documents and employees chat with AI that only answers from uploaded content.

## Features

- **Multi-tenant**: Companies with multiple employees
- **Document Upload**: PDF, DOCX, PPTX, XLSX support
- **AI-Powered Q&A**: Chat with your documents using MiniMax-M2.7
- **Vector Search**: Semantic search with Qwen3 embeddings + Qdrant
- **Chat History**: Persistent conversation storage
- **Auto Re-indexing**: Documents persist and re-index on startup

## Tech Stack

**Frontend**: Next.js 14, TypeScript, Tailwind CSS  
**Backend**: FastAPI, Python  
**Database**: PostgreSQL (Prisma ORM)  
**Vector Store**: Qdrant  
**AI Models**: MiniMax-M2.7-highspeed (chat), Qwen3-embedding-8b (embeddings)

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL running on port 5432
- Qdrant running on port 6333

### Setup

1. **Clone and install dependencies**

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

2. **Configure environment**

```bash
# Backend - copy and edit
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# Frontend
cp frontend/.env.example frontend/.env
```

3. **Set up database**

```bash
cd backend
export DATABASE_URL="postgresql://user:pass@localhost:5432/doclaw"
npx prisma db push
```

4. **Start services**

```bash
# Terminal 1 - Backend
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. **Open browser**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `MINIMAX_API_KEY` | MiniMax Token Plan API key | Yes |
| `MINIMAX_BASE_URL` | MiniMax API base URL | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes |
| `OPENROUTER_BASE_URL` | OpenRouter API base URL | Yes |
| `QDRANT_HOST` | Qdrant host | Yes |
| `QDRANT_PORT` | Qdrant port | Yes |
| `SECRET_KEY` | JWT secret key | Yes |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: http://localhost:8000) |

## Project Structure

```
doc-ai/
├── backend/
│   ├── app/
│   │   ├── routers/          # API endpoints
│   │   │   ├── auth.py       # Authentication
│   │   │   ├── chat.py       # Chat & AI
│   │   │   └── documents.py  # Document management
│   │   ├── services/         # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── document_processor.py
│   │   │   ├── embeddings.py
│   │   │   ├── indexer.py    # Auto re-indexing
│   │   │   ├── rag_engine.py
│   │   │   └── vector_store.py
│   │   ├── config.py
│   │   └── main.py
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   │   ├── chat/
│   │   │   ├── documents/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── components/
│   │   └── lib/
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register company & admin user |
| POST | `/api/auth/signin` | Login, returns JWT token |
| GET | `/api/auth/me` | Get current user info |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload document (admin only) |
| GET | `/api/documents/` | List company documents |
| DELETE | `/api/documents/{id}` | Delete document (admin only) |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/` | Send message, returns AI response |
| GET | `/api/chat/history/{id}` | Get conversation messages |
| GET | `/api/chat/conversations` | List user conversations |

## Database Schema

- **Company**: Multi-tenant organizations
- **Employee**: Users with roles (ADMIN/EMPLOYEE)
- **Document**: Uploaded files with metadata & text content
- **Conversation**: Chat sessions
- **Message**: Individual messages with sources

## How It Works

1. **Upload**: Admin uploads documents (PDF, DOCX, PPTX, XLSX)
2. **Extract**: Text is extracted and chunked
3. **Embed**: Chunks are embedded using Qwen3 via OpenRouter
4. **Store**: Embeddings stored in Qdrant, text in PostgreSQL
5. **Chat**: User asks question → search Qdrant → generate answer with MiniMax
6. **Persist**: On restart, documents auto re-index from PostgreSQL

## License

MIT
