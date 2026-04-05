from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Header
from fastapi.responses import JSONResponse
from typing import Optional
import os
import shutil
import sys
from datetime import datetime
sys.path.append('..')
from prisma import Prisma

router = APIRouter(prefix="/api/documents", tags=["documents"])
prisma = Prisma()

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    from app.services.auth_service import decode_token
    
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return {"email": email}

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
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
        employee = await prisma.employee.find_unique(
            where={"email": current_user["email"]}
        )
        if not employee:
            raise HTTPException(status_code=404, detail="User not found")
        
        if employee.role != "ADMIN":
            raise HTTPException(status_code=403, detail="Only admins can upload documents")
        
        upload_dir = "backend/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        unique_filename = f"{datetime.now().timestamp()}_{file.filename}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_type_map = {"pdf": "PDF", "docx": "DOCX", "pptx": "PPTX", "xlsx": "XLSX"}
        
        document = await prisma.document.create({
            "companyId": employee.companyId,
            "filename": file.filename,
            "fileType": file_type_map[file_ext],
            "filePath": file_path,
            "uploadedById": employee.id,
            "status": "PROCESSING"
        })
        
        from app.services.document_processor import document_processor
        from app.services.embeddings import embeddings_service
        from app.services.vector_store import vector_store
        
        chunks = []
        try:
            text = document_processor.extract_text(file_path, file_ext)
            chunks = document_processor.chunk_text(text)
            
            if chunks:
                embeddings = await embeddings_service.get_embeddings(chunks)
                vector_store.add_chunks(chunks, document.id, embeddings)
                
                await prisma.document.update(
                    where={"id": document.id},
                    data={
                        "chunkCount": len(chunks), 
                        "status": "READY",
                        "textContent": text,
                        "indexedAt": datetime.now()
                    }
                )
            else:
                await prisma.document.update(
                    where={"id": document.id},
                    data={"status": "ERROR", "textContent": ""}
                )
        except Exception as e:
            print(f"Document processing error: {e}")
            await prisma.document.update(
                where={"id": document.id},
                data={"status": "ERROR", "textContent": ""}
            )
        
        return {
            "id": document.id,
            "filename": document.filename,
            "fileType": document.fileType,
            "status": document.status,
            "chunkCount": len(chunks) if chunks else 0,
            "message": "Document uploaded and processed successfully"
        }
    finally:
        await prisma.disconnect()

@router.get("/")
async def list_documents(current_user: dict = Depends(get_current_user)):
    await prisma.connect()
    try:
        employee = await prisma.employee.find_unique(
            where={"email": current_user["email"]}
        )
        if not employee:
            raise HTTPException(status_code=404, detail="User not found")
        
        documents = await prisma.document.find_many(
            where={"companyId": employee.companyId},
            order={"createdAt": "desc"}
        )
        
        return documents
    finally:
        await prisma.disconnect()

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    await prisma.connect()
    try:
        employee = await prisma.employee.find_unique(
            where={"email": current_user["email"]}
        )
        if not employee:
            raise HTTPException(status_code=404, detail="User not found")
        
        if employee.role != "ADMIN":
            raise HTTPException(status_code=403, detail="Only admins can delete documents")
        
        document = await prisma.document.find_unique(
            where={"id": document_id}
        )
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        if document.companyId != employee.companyId:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        from app.services.vector_store import vector_store
        try:
            vector_store.delete_document_chunks(document_id)
        except:
            pass
        
        if os.path.exists(document.filePath):
            os.remove(document.filePath)
        
        await prisma.document.delete(where={"id": document_id})
        
        return {"message": "Document deleted successfully"}
    finally:
        await prisma.disconnect()
