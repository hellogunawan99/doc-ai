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
