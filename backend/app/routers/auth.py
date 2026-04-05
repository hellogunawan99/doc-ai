from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from app.models.schemas import (
    EmployeeCreate, EmployeeLogin, EmployeeResponse, Token
)
from app.services.auth_service import (
    verify_password, get_password_hash, create_access_token, decode_token
)
from app.config import settings
import sys
sys.path.append('..')
from prisma import Prisma

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/signin")
prisma_client = Prisma()

@router.post("/signup", response_model=EmployeeResponse)
async def signup(employee: EmployeeCreate):
    await prisma_client.connect()
    try:
        existing = await prisma_client.employee.find_unique(where={"email": employee.email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        company = await prisma_client.company.create({
            "name": employee.companyName
        })
        
        new_employee = await prisma_client.employee.create({
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
        await prisma_client.disconnect()

@router.post("/signin", response_model=Token)
async def signin(employee: EmployeeLogin):
    await prisma_client.connect()
    try:
        db_employee = await prisma_client.employee.find_unique(
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
        await prisma_client.disconnect()

@router.get("/me", response_model=EmployeeResponse)
async def get_current_user(token: str = Depends(oauth2_scheme)):
    email = decode_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    await prisma_client.connect()
    try:
        employee = await prisma_client.employee.find_unique(where={"email": email})
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
        await prisma_client.disconnect()
