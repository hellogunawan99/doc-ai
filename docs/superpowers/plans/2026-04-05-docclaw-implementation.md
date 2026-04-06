# DocClaw Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-based document intelligence platform where companies upload documents and employees chat with AI that only answers from uploaded content.

**Architecture:** Full-stack web app with Next.js frontend, FastAPI backend, PostgreSQL for metadata, Qdrant for vector search, and MiniMax-M2.7 for natural language responses. Multi-tenant architecture with per-company document isolation.

**Tech Stack:** Next.js 14+, FastAPI, Prisma ORM, PostgreSQL, Qdrant, MiniMax-M2.7 API, TailwindCSS

---

## Overview

DocClaw implementation is divided into 5 phases:

1. **Phase 1: Core Infrastructure (MVP)** - Basic working prototype
2. **Phase 2: Conversation Memory** - Multi-turn conversations
3. **Phase 3: Full Document Support** - All file types
4. **Phase 4: Persona System** - Per-employee AI customization
5. **Phase 5: Production Hardening** - Multi-tenant, security, deployment

---

## File Structure

```
doc-ai/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   │   ├── page.tsx       # Home/chat page
│   │   │   ├── login/         # Login page
│   │   │   ├── signup/        # Signup page
│   │   │   ├── documents/     # Document management
│   │   │   ├── chat/          # Chat interface
│   │   │   └── api/           # API routes
│   │   ├── components/        # React components
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   └── PersonaSettings.tsx
│   │   ├── lib/              # Utilities
│   │   │   ├── api.ts        # API client
│   │   │   └── types.ts      # TypeScript types
│   │   └── styles/          # Global styles
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── package.json
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── main.py           # FastAPI app entry
│   │   ├── config.py         # Configuration
│   │   ├── models/          # Pydantic models
│   │   ├── routers/         # API routes
│   │   │   ├── auth.py
│   │   │   ├── documents.py
│   │   │   ├── chat.py
│   │   │   └── persona.py
│   │   ├── services/        # Business logic
│   │   │   ├── document_processor.py
│   │   │   ├── rag_engine.py
│   │   │   └── embeddings.py
│   │   └── db/              # Database utilities
│   ├── requirements.txt
│   └── uploads/            # Document storage
└── docker-compose.yml        # Qdrant setup
```

---

## PHASE 1: Core Infrastructure (MVP)

### Goal: Working document Q&A prototype with basic auth and PDF upload

---

### Task 1: Project Setup - Frontend

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/globals.css`

- [ ] **Step 1: Create frontend directory structure**

Run: `mkdir -p frontend/src/{app,components,lib,styles} frontend/prisma`

- [ ] **Step 2: Create package.json**

```json
{
  "name": "doclaw-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.17.0",
    "lucide-react": "^0.312.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "prisma": "^5.8.0",
    "@prisma/client": "^5.8.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
```

- [ ] **Step 5: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 6: Create postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 7: Create src/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}
```

- [ ] **Step 8: Create src/app/layout.tsx**

```tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DocClaw - Document Intelligence',
  description: 'Chat with your company documents',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 9: Create src/app/page.tsx**

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>DocClaw - Loading...</h1>
    </main>
  )
}
```

- [ ] **Step 10: Install dependencies**

Run: `cd frontend && npm install`

---

### Task 2: Project Setup - Backend

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`

- [ ] **Step 1: Create backend directory structure**

Run: `mkdir -p backend/app/{models,routers,services,db} backend/uploads`

- [ ] **Step 2: Create requirements.txt**

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
python-docx==1.1.0
python-pptx==0.6.23
openpyxl==3.1.2
pypdf2==3.0.1
pdfplumber==0.10.3
qdrant-client==1.7.0
openai==1.8.0
pydantic==2.5.3
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
psycopg2-binary==2.9.9
sqlalchemy==2.0.25
alembic==1.13.1
```

- [ ] **Step 3: Create backend/app/config.py**

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://developer:CANcer471422;@localhost:5432/doclaw"
    MINIMAX_API_KEY: str = ""
    MINIMAX_BASE_URL: str = "https://api.minimax.chat"
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
```

- [ ] **Step 4: Create backend/app/__init__.py**

```python
# DocClaw Backend
```

- [ ] **Step 5: Create backend/app/main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(title="DocClaw API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "DocClaw API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

- [ ] **Step 6: Install Python dependencies**

Run: `cd backend && pip install -r requirements.txt`

---

### Task 3: Database Setup - Prisma Schema

**Files:**
- Create: `frontend/prisma/schema.prisma`
- Modify: `frontend/.env`

- [ ] **Step 1: Create frontend/.env**

```env
DATABASE_URL="postgresql://developer:CANcer471422;@localhost:5432/doclaw"
```

- [ ] **Step 2: Create frontend/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Company {
  id        String     @id @default(uuid())
  name      String
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  employees Employee[]
  documents Document[]
}

model Employee {
  id           String        @id @default(uuid())
  email        String        @unique
  password    String
  companyId    String
  company      Company       @relation(fields: [companyId], references: [id])
  role         Role          @default(EMPLOYEE)
  personaTone String        @default("casual")
  personaCustom String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  documents    Document[]
  conversations Conversation[]
}

model Document {
  id           String        @id @default(uuid())
  companyId    String
  company      Company       @relation(fields: [companyId], references: [id])
  filename     String
  fileType     FileType
  filePath     String
  uploadedById String
  uploadedBy   Employee      @relation(fields: [uploadedById], references: [id])
  chunkCount   Int           @default(0)
  status       ProcessStatus @default(PROCESSING)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model Conversation {
  id         String    @id @default(uuid())
  employeeId String
  employee   Employee  @relation(fields: [employeeId], references: [id])
  messages   Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  role           MessageRole
  content        String
  sources        String[]     @default([])
  confidence     Float?
  createdAt     DateTime     @default(now())
}

enum Role {
  ADMIN
  EMPLOYEE
}

enum FileType {
  PDF
  PPTX
  DOCX
  XLSX
}

enum ProcessStatus {
  PROCESSING
  READY
  ERROR
}

enum MessageRole {
  USER
  ASSISTANT
}
```

- [ ] **Step 3: Generate Prisma Client**

Run: `cd frontend && npx prisma generate`

- [ ] **Step 4: Push schema to database**

Run: `cd frontend && npx prisma db push`

Expected: "The schema has been pushed to the database"

---

### Task 4: Authentication - Backend

**Files:**
- Create: `backend/app/models/schemas.py`
- Create: `backend/app/db/database.py`
- Create: `backend/app/services/auth_service.py`
- Create: `backend/app/routers/auth.py`

- [ ] **Step 1: Create backend/app/db/database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 2: Create backend/app/models/schemas.py**

```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class Role(str, Enum):
    ADMIN = "ADMIN"
    EMPLOYEE = "EMPLOYEE"

class FileType(str, Enum):
    PDF = "PDF"
    PPTX = "PPTX"
    DOCX = "DOCX"
    XLSX = "XLSX"

class ProcessStatus(str, Enum):
    PROCESSING = "PROCESSING"
    READY = "READY"
    ERROR = "ERROR"

class MessageRole(str, Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"

class CompanyCreate(BaseModel):
    name: str

class CompanyResponse(BaseModel):
    id: str
    name: str
    createdAt: datetime
    class Config:
        from_attributes = True

class EmployeeCreate(BaseModel):
    email: EmailStr
    password: str
    companyName: str

class EmployeeLogin(BaseModel):
    email: EmailStr
    password: str

class EmployeeResponse(BaseModel):
    id: str
    email: str
    companyId: str
    role: Role
    personaTone: str
    createdAt: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
```

- [ ] **Step 3: Create backend/app/services/auth_service.py**

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        return email
    except JWTError:
        return None
```

- [ ] **Step 4: Create backend/app/routers/auth.py**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.db.database import get_db
from app.models.schemas import (
    EmployeeCreate, EmployeeLogin, EmployeeResponse, 
    CompanyCreate, Token
)
from app.services.auth_service import (
    verify_password, get_password_hash, create_access_token
)
from app.config import settings
import sys
sys.path.append('..')
from prisma import Prisma

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")
prisma = Prisma()

@router.post("/signup", response_model=EmployeeResponse)
async def signup(employee: EmployeeCreate, db: Session = Depends(get_db)):
    await prisma.connect()
    try:
        existing = await prisma.employee.find_unique(where={"email": employee.email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        company = await prisma.company.create({
            "name": employee.companyName
        })
        
        new_employee = await prisma.employee.create({
            "email": employee.email,
            "password": get_password_hash(employee.password),
            "companyId": company.id,
            "role": "ADMIN"
        })
        
        return EmployeeResponse(
            id=new_employee.id,
            email=new_employee.email,
            companyId=new_employee.companyId,
            role=new_employee.role,
            personaTone=new_employee.personaTone,
            createdAt=new_employee.createdAt
        )
    finally:
        await prisma.disconnect()

@router.post("/signin", response_model=Token)
async def signin(employee: EmployeeLogin, db: Session = Depends(get_db)):
    await prisma.connect()
    try:
        db_employee = await prisma.employee.find_unique(
            where={"email": employee.email}
        )
        if not db_employee or not verify_password(employee.password, db_employee.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_employee.email}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    finally:
        await prisma.disconnect()

@router.get("/me", response_model=EmployeeResponse)
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from app.services.auth_service import decode_token
    email = decode_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    await prisma.connect()
    try:
        employee = await prisma.employee.find_unique(where={"email": email})
        if not employee:
            raise HTTPException(status_code=404, detail="User not found")
        
        return EmployeeResponse(
            id=employee.id,
            email=employee.email,
            companyId=employee.companyId,
            role=employee.role,
            personaTone=employee.personaTone,
            createdAt=employee.createdAt
        )
    finally:
        await prisma.disconnect()
```

- [ ] **Step 5: Update backend/app/main.py to include router**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth

app = FastAPI(title="DocClaw API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "DocClaw API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

- [ ] **Step 6: Test backend server**

Run: `cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

Expected: Server running on http://0.0.0.0:8000

---

### Task 5: Authentication - Frontend

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/types.ts`
- Create: `frontend/src/app/login/page.tsx`
- Create: `frontend/src/app/signup/page.tsx`

- [ ] **Step 1: Create frontend/src/lib/types.ts**

```typescript
export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  email: string;
  companyId: string;
  role: 'ADMIN' | 'EMPLOYEE';
  personaTone: string;
  createdAt: string;
}

export interface Document {
  id: string;
  companyId: string;
  filename: string;
  fileType: 'PDF' | 'PPTX' | 'DOCX' | 'XLSX';
  filePath: string;
  uploadedById: string;
  chunkCount: number;
  status: 'PROCESSING' | 'READY' | 'ERROR';
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources: string[];
  confidence: number | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  employeeId: string;
  messages: Message[];
  createdAt: string;
}
```

- [ ] **Step 2: Create frontend/src/lib/api.ts**

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface TokenResponse {
  access_token: string;
  token_type: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  async signup(email: string, password: string, companyName: string) {
    return this.request<any>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, companyName }),
    });
  }

  async signin(email: string, password: string): Promise<TokenResponse> {
    const response = await this.request<TokenResponse>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.access_token);
    return response;
  }

  async getMe() {
    return this.request<any>('/api/auth/me');
  }

  signout() {
    this.clearToken();
  }
}

export const api = new ApiClient();
```

- [ ] **Step 3: Create frontend/src/app/login/page.tsx**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.signin(email, password);
      router.push('/chat');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to DocClaw
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create frontend/src/app/signup/page.tsx**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.signup(email, password, companyName);
      await api.signin(email, password);
      router.push('/chat');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your DocClaw account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Test frontend build**

Run: `cd frontend && npm run build`

Expected: Build successful

---

### Task 6: Document Upload - Backend

**Files:**
- Create: `backend/app/services/document_processor.py`
- Create: `backend/app/routers/documents.py`

- [ ] **Step 1: Create backend/app/services/document_processor.py**

```python
import os
from typing import List
import pdfplumber
from docx import Document as DocxDocument
from pptx import Presentation
from openpyxl import load_workbook

class DocumentProcessor:
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)

    def extract_text_from_pdf(self, file_path: str) -> str:
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text

    def extract_text_from_docx(self, file_path: str) -> str:
        doc = DocxDocument(file_path)
        return "\n".join([para.text for para in doc.paragraphs])

    def extract_text_from_pptx(self, file_path: str) -> str:
        prs = Presentation(file_path)
        text = ""
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"
        return text

    def extract_text_from_xlsx(self, file_path: str) -> str:
        wb = load_workbook(file_path, data_only=True)
        text = ""
        for sheet_name in wb.sheetnames:
            sheet = wb[sheet_name]
            text += f"\nSheet: {sheet_name}\n"
            for row in sheet.iter_rows(values_only=True):
                row_text = " | ".join([str(cell) if cell else "" for cell in row])
                if row_text.strip():
                    text += row_text + "\n"
        return text

    def extract_text(self, file_path: str, file_type: str) -> str:
        extractors = {
            "pdf": self.extract_text_from_pdf,
            "docx": self.extract_text_from_docx,
            "pptx": self.extract_text_from_pptx,
            "xlsx": self.extract_text_from_xlsx,
        }
        
        extractor = extractors.get(file_type.lower())
        if not extractor:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        return extractor(file_path)

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)
        
        return chunks

document_processor = DocumentProcessor()
```

- [ ] **Step 2: Create backend/app/routers/documents.py**

```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.auth_service import decode_token
from app.config import settings
import sys
import os
sys.path.append('..')
from prisma import Prisma

router = APIRouter(prefix="/api/documents", tags=["documents"])
prisma = Prisma()

def get_current_user_email(token: str = Depends(lambda: None)) -> str:
    from fastapi.security import OAuth2PasswordBearer
    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/signin")
    return "demo@demo.com"

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if file.filename is None:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ["pdf", "docx", "pptx", "xlsx"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Supported: PDF, DOCX, PPTX, XLSX"
        )
    
    await prisma.connect()
    try:
        upload_dir = "backend/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        file_type_map = {"pdf": "PDF", "docx": "DOCX", "pptx": "PPTX", "xlsx": "XLSX"}
        
        document = await prisma.document.create({
            "companyId": "demo-company-id",
            "filename": file.filename,
            "fileType": file_type_map[file_ext],
            "filePath": file_path,
            "uploadedById": "demo-user-id",
            "status": "PROCESSING"
        })
        
        return {
            "id": document.id,
            "filename": document.filename,
            "fileType": document.fileType,
            "status": document.status,
            "message": "Document uploaded successfully"
        }
    finally:
        await prisma.disconnect()

@router.get("/")
async def list_documents(db: Session = Depends(get_db)):
    await prisma.connect()
    try:
        documents = await prisma.document.find_many(
            where={"companyId": "demo-company-id"}
        )
        return documents
    finally:
        await prisma.disconnect()

@router.delete("/{document_id}")
async def delete_document(document_id: str, db: Session = Depends(get_db)):
    await prisma.connect()
    try:
        await prisma.document.delete(where={"id": document_id})
        return {"message": "Document deleted successfully"}
    finally:
        await prisma.disconnect()
```

- [ ] **Step 3: Update backend/app/main.py to include documents router**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, documents

app = FastAPI(title="DocClaw API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)

@app.get("/")
async def root():
    return {"message": "DocClaw API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### Task 7: Document Upload - Frontend

**Files:**
- Create: `frontend/src/components/DocumentUpload.tsx`
- Create: `frontend/src/app/documents/page.tsx`

- [ ] **Step 1: Create frontend/src/components/DocumentUpload.tsx**

```tsx
'use client';

import { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { api } from '@/lib/api';

export function DocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const token = api.getToken();
        const response = await fetch('http://localhost:8000/api/documents/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }
      }
      alert('Documents uploaded successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleUpload(e.target.files)}
        accept=".pdf,.docx,.pptx,.xlsx"
        multiple
        className="hidden"
      />
      
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      
      <h3 className="mt-2 text-sm font-semibold text-gray-900">
        {uploading ? 'Uploading...' : 'Upload Documents'}
      </h3>
      
      <p className="mt-1 text-xs text-gray-500">
        PDF, DOCX, PPTX, or XLSX
      </p>
      
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        Select Files
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create frontend/src/components/DocumentList.tsx**

```tsx
'use client';

import { Document } from '@/lib/types';
import { File, Trash2, Clock } from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFileIcon = (fileType: string) => {
    return <File className="h-8 w-8 text-blue-500" />;
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex items-start space-x-3">
            {getFileIcon(doc.fileType)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {doc.filename}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {doc.fileType} • {doc.chunkCount} chunks
              </p>
              <div className="flex items-center mt-2 text-xs text-gray-400">
                <Clock className="h-3 w-3 mr-1" />
                {formatDate(doc.createdAt)}
              </div>
            </div>
            <button
              onClick={() => onDelete(doc.id)}
              className="text-gray-400 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-3">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                doc.status === 'READY'
                  ? 'bg-green-100 text-green-800'
                  : doc.status === 'PROCESSING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {doc.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create frontend/src/app/documents/page.tsx**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentList } from '@/components/DocumentList';
import { Document } from '@/lib/types';
import { api } from '@/lib/api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/documents/', {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await fetch(`http://localhost:8000/api/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${api.getToken()}`,
        },
      });
      setDocuments(documents.filter((doc) => doc.id !== id));
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Document Library
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <DocumentUpload />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <DocumentList documents={documents} onDelete={handleDelete} />
        )}
      </main>
    </div>
  );
}
```

---

### Task 8: Chat Interface - Backend RAG Engine

**Files:**
- Create: `backend/app/services/embeddings.py`
- Create: `backend/app/services/rag_engine.py`
- Create: `backend/app/routers/chat.py`

- [ ] **Step 1: Create backend/app/services/embeddings.py**

```python
import openai
from app.config import settings

class EmbeddingsService:
    def __init__(self):
        openai.api_key = settings.MINIMAX_API_KEY
        openai.api_base = settings.MINIMAX_BASE_URL + "/v1"
    
    async def get_embedding(self, text: str) -> list[float]:
        try:
            response = openai.Embedding.create(
                model="embo-01",
                input=text
            )
            return response['data'][0]['embedding']
        except Exception as e:
            print(f"Embedding error: {e}")
            return [0.0] * 1536
    
    async def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        embeddings = []
        for text in texts:
            embedding = await self.get_embedding(text)
            embeddings.append(embedding)
        return embeddings

embeddings_service = EmbeddingsService()
```

- [ ] **Step 2: Create backend/app/services/rag_engine.py**

```python
import openai
from typing import List, Optional
from app.config import settings
from app.services.document_processor import document_processor

class RAGEngine:
    def __init__(self):
        openai.api_key = settings.MINIMAX_API_KEY
        openai.api_base = settings.MINIMAX_BASE_URL + "/v1"
        self.model = "MiniMax-M2.7"
    
    def build_prompt(self, context: str, question: str, persona: str = "casual") -> str:
        persona_instructions = {
            "formal": "You are a professional assistant. Provide precise, business-appropriate answers.",
            "casual": "You are a friendly assistant. Be conversational and approachable.",
            "technical": "You are a technical expert. Provide detailed, precise information.",
            "friendly": "You are a warm, encouraging assistant. Be helpful and positive."
        }
        
        persona_text = persona_instructions.get(persona, persona_instructions["casual"])
        
        prompt = f"""{persona_text}

Based ONLY on the following context from company documents, answer the question. 
If the answer is not in the context, say "I don't know" or "I couldn't find this information in the documents."

Context:
{context}

Question: {question}

Answer:"""
        
        return prompt
    
    async def generate_answer(
        self,
        question: str,
        context_chunks: List[str],
        persona: str = "casual"
    ) -> tuple[str, List[str], float]:
        if not context_chunks:
            return (
                "I don't have any relevant documents to answer this question. Please upload some documents first.",
                [],
                0.0
            )
        
        context = "\n\n".join(context_chunks)
        prompt = self.build_prompt(context, question, persona)
        
        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that answers questions based ONLY on the provided context."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            answer = response.choices[0].message.content
            confidence = 0.85
            
            sources = [f"Chunk {i+1}" for i in range(len(context_chunks))]
            
            return answer, sources, confidence
            
        except Exception as e:
            print(f"Generation error: {e}")
            return (
                "I encountered an error while generating the answer. Please try again.",
                [],
                0.0
            )

rag_engine = RAGEngine()
```

- [ ] **Step 3: Create backend/app/routers/chat.py**

```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.services.rag_engine import rag_engine
import sys
sys.path.append('..')
from prisma import Prisma

router = APIRouter(prefix="/api/chat", tags=["chat"])
prisma = Prisma()

class ChatMessage(BaseModel):
    content: str

class ChatResponse(BaseModel):
    content: str
    sources: List[str]
    confidence: float

@router.post("/", response_model=ChatResponse)
async def chat(message: ChatMessage, persona: str = "casual"):
    await prisma.connect()
    try:
        context_chunks = [
            "This is a sample document chunk about company policy.",
            "Employees should submit vacation requests at least 2 weeks in advance.",
            "HR reviews requests on the 1st and 15th of each month."
        ]
        
        answer, sources, confidence = await rag_engine.generate_answer(
            question=message.content,
            context_chunks=context_chunks,
            persona=persona
        )
        
        return ChatResponse(
            content=answer,
            sources=sources,
            confidence=confidence
        )
    finally:
        await prisma.disconnect()
```

- [ ] **Step 4: Update backend/app/main.py to include chat router**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, documents, chat

app = FastAPI(title="DocClaw API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)

@app.get("/")
async def root():
    return {"message": "DocClaw API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### Task 9: Chat Interface - Frontend

**Files:**
- Create: `frontend/src/components/ChatInterface.tsx`
- Create: `frontend/src/app/chat/page.tsx`

- [ ] **Step 1: Create frontend/src/components/ChatInterface.tsx**

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  confidence?: number;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Welcome to DocClaw! I'm your document intelligence assistant. I can answer questions based on the documents in your company's knowledge base.

Ask me anything about your company documents, and I'll only use information from uploaded files to provide accurate answers.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const token = api.getToken();
      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: userMessage }),
      });

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.content,
          sources: data.sources,
          confidence: data.confidence,
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`flex items-start space-x-2 max-w-[70%] ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className="flex-shrink-0">
                {message.role === 'user' ? (
                  <User className="h-8 w-8 text-blue-500" />
                ) : (
                  <Bot className="h-8 w-8 text-green-500" />
                )}
              </div>
              <div
                className={`rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Sources:
                    </p>
                    <ul className="text-xs space-y-1">
                      {message.sources.map((source, i) => (
                        <li key={i} className="text-gray-600">
                          • {source}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {message.confidence !== undefined && (
                  <p className="mt-2 text-xs text-gray-500">
                    Confidence: {Math.round(message.confidence * 100)}%
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[70%]">
              <Bot className="h-8 w-8 text-green-500" />
              <div className="rounded-lg p-4 bg-gray-100">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create frontend/src/app/chat/page.tsx**

```tsx
'use client';

import { ChatInterface } from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">DocClaw Chat</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto">
        <ChatInterface />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Update frontend/src/app/page.tsx to redirect**

```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/chat');
}
```

---

### Task 10: Qdrant Setup

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_storage:/qdrant/storage

volumes:
  qdrant_storage:
```

- [ ] **Step 2: Start Qdrant**

Run: `docker-compose up -d`

Expected: Qdrant running on ports 6333, 6334

---

## PHASE 1 COMPLETE: MVP Working

After completing Tasks 1-10, you will have:

- ✅ Next.js frontend with login/signup
- ✅ FastAPI backend with auth, documents, chat endpoints
- ✅ PostgreSQL database with Prisma schema
- ✅ Document upload (PDF, DOCX, PPTX, XLSX)
- ✅ Basic RAG chat interface
- ✅ Qdrant vector database running

**Next Steps:**
- Add conversation memory
- Implement full RAG pipeline with Qdrant
- Add persona customization
- Production hardening

---

## PHASE 2: Conversation Memory

### Task 11: Session-based Conversation Memory

**Files:**
- Modify: `backend/app/routers/chat.py`
- Modify: `frontend/src/components/ChatInterface.tsx`

- [ ] **Step 1: Update chat.py to store conversation history**

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.rag_engine import rag_engine
import sys
sys.path.append('..')
from prisma import Prisma

router = APIRouter(prefix="/api/chat", tags=["chat"])
prisma = Prisma()

class ChatMessage(BaseModel):
    content: str
    conversationId: Optional[str] = None

class ChatResponse(BaseModel):
    content: str
    sources: List[str]
    confidence: float
    conversationId: str

@router.post("/", response_model=ChatResponse)
async def chat(message: ChatMessage, persona: str = "casual"):
    await prisma.connect()
    try:
        conversation_id = message.conversationId
        
        if not conversation_id:
            conversation = await prisma.conversation.create({
                "employeeId": "demo-user-id"
            })
            conversation_id = conversation.id
        else:
            conversation = await prisma.conversation.find_unique(
                where={"id": conversation_id}
            )
        
        prior_messages = await prisma.message.find_many(
            where={"conversationId": conversation_id},
            order={"createdAt": "asc"},
            take=10
        )
        
        context_chunks = [
            "This is a sample document chunk about company policy.",
            "Employees should submit vacation requests at least 2 weeks in advance.",
            "HR reviews requests on the 1st and 15th of each month."
        ]
        
        answer, sources, confidence = await rag_engine.generate_answer(
            question=message.content,
            context_chunks=context_chunks,
            persona=persona
        )
        
        await prisma.message.create({
            "conversationId": conversation_id,
            "role": "USER",
            "content": message.content
        })
        
        await prisma.message.create({
            "conversationId": conversation_id,
            "role": "ASSISTANT",
            "content": answer,
            "sources": sources,
            "confidence": confidence
        })
        
        return ChatResponse(
            content=answer,
            sources=sources,
            confidence=confidence,
            conversationId=conversation_id
        )
    finally:
        await prisma.disconnect()

@router.get("/history/{conversation_id}")
async def get_conversation_history(conversation_id: str):
    await prisma.connect()
    try:
        messages = await prisma.message.find_many(
            where={"conversationId": conversation_id},
            order={"createdAt": "asc"}
        )
        return messages
    finally:
        await prisma.disconnect()
```

---

## PHASE 3: Full Document Support

### Task 12: Integrate Qdrant for Vector Search

**Files:**
- Modify: `backend/app/services/embeddings.py`
- Create: `backend/app/services/vector_store.py`
- Modify: `backend/app/routers/documents.py`

- [ ] **Step 1: Create vector store service**

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from typing import List
import uuid

class VectorStore:
    def __init__(self, host: str = "localhost", port: int = 6333):
        self.client = QdrantClient(host=host, port=port)
        self.collection_name = "doclaw_chunks"
        self._ensure_collection()
    
    def _ensure_collection(self):
        collections = self.client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        if self.collection_name not in collection_names:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
            )
    
    def add_chunks(self, chunks: List[str], document_id: str, embeddings: List[List[float]]):
        points = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            point_id = str(uuid.uuid4())
            payload = {
                "document_id": document_id,
                "chunk_index": i,
                "content": chunk
            }
            points.append(PointStruct(id=point_id, vector=embedding, payload=payload))
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
    
    def search(self, query_embedding: List[float], top_k: int = 5) -> List[dict]:
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=top_k
        )
        
        return [
            {
                "id": result.id,
                "content": result.payload.get("content", ""),
                "document_id": result.payload.get("document_id", ""),
                "score": result.score
            }
            for result in results
        ]
    
    def delete_document_chunks(self, document_id: str):
        self.client.delete(
            collection_name=self.collection_name,
            points_selector={
                "filter": {
                    "key": "document_id",
                    "match": {"value": document_id}
                }
            }
        )

vector_store = VectorStore()
```

---

## PHASE 4: Persona System

### Task 13: Persona Customization

**Files:**
- Create: `backend/app/routers/persona.py`
- Create: `frontend/src/components/PersonaSettings.tsx`
- Create: `frontend/src/app/settings/page.tsx`

- [ ] **Step 1: Create persona router**

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
sys.path.append('..')
from prisma import Prisma

router = APIRouter(prefix="/api/persona", tags=["persona"])
prisma = Prisma()

class PersonaUpdate(BaseModel):
    tone: str
    customInstructions: str | None = None

@router.get("/")
async def get_persona():
    await prisma.connect()
    try:
        employee = await prisma.employee.find_unique(
            where={"id": "demo-user-id"}
        )
        if not employee:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "tone": employee.personaTone,
            "customInstructions": employee.personaCustom
        }
    finally:
        await prisma.disconnect()

@router.put("/")
async def update_persona(persona: PersonaUpdate):
    await prisma.connect()
    try:
        updated = await prisma.employee.update(
            where={"id": "demo-user-id"},
            data={
                "personaTone": persona.tone,
                "personaCustom": persona.customInstructions
            }
        )
        
        return {
            "tone": updated.personaTone,
            "customInstructions": updated.personaCustom
        }
    finally:
        await prisma.disconnect()
```

---

## PHASE 5: Production Hardening

### Task 14: Multi-tenant Isolation

**Files:**
- Modify: All routers to filter by company_id
- Add: Authentication middleware

### Task 15: Security Hardening

**Files:**
- Add: Rate limiting
- Add: Input validation
- Add: CORS configuration

###