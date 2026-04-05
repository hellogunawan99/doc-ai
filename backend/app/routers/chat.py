from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import sys
sys.path.append('..')
from prisma import Prisma

router = APIRouter(prefix="/api/chat", tags=["chat"])
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

class ChatMessage(BaseModel):
    content: str
    conversationId: Optional[str] = None

class ChatResponse(BaseModel):
    content: str
    sources: List[str]
    confidence: float
    conversationId: Optional[str] = None

@router.post("/", response_model=ChatResponse)
async def chat(message: ChatMessage, current_user: dict = Depends(get_current_user)):
    await prisma.connect()
    try:
        employee = await prisma.employee.find_unique(
            where={"email": current_user["email"]}
        )
        if not employee:
            return ChatResponse(
                content="User not found",
                sources=[],
                confidence=0.0
            )
        
        conversation_id = message.conversationId
        
        if not conversation_id:
            conversation = await prisma.conversation.create({
                "employeeId": employee.id
            })
            conversation_id = conversation.id
        
        context_chunks = ["This is a test context about health. Health refers to the state of being free from illness or injury."]
        
        try:
            from app.services.embeddings import embeddings_service
            from app.services.vector_store import vector_store
            
            query_embedding = await embeddings_service.get_embedding(message.content)
            search_results = vector_store.search(query_embedding, top_k=5)
            context_chunks = [r["content"] for r in search_results if r.get("content")]
        except Exception as e:
            print(f"Search error: {e}")
        
        if not context_chunks:
            context_chunks = ["No relevant documents found. Please upload some documents first."]
        
        from app.services.rag_engine import rag_engine
        answer, sources, confidence = await rag_engine.generate_answer(
            question=message.content,
            context_chunks=context_chunks,
            persona=employee.personaTone
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
async def get_history(conversation_id: str, current_user: dict = Depends(get_current_user)):
    await prisma.connect()
    try:
        messages = await prisma.message.find_many(
            where={"conversationId": conversation_id},
            order={"createdAt": "asc"}
        )
        return messages
    finally:
        await prisma.disconnect()

@router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    await prisma.connect()
    try:
        employee = await prisma.employee.find_unique(
            where={"email": current_user["email"]}
        )
        if not employee:
            return []
        
        conversations = await prisma.conversation.find_many(
            where={"employeeId": employee.id},
            order={"updatedAt": "desc"},
            include={"messages": {"take": 1, order: {"createdAt": "desc"}}}
        )
        return conversations
    finally:
        await prisma.disconnect()

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    await prisma.connect()
    try:
        employee = await prisma.employee.find_unique(
            where={"email": current_user["email"]}
        )
        if not employee:
            raise HTTPException(status_code=404, detail="User not found")
        
        conversation = await prisma.conversation.find_unique(
            where={"id": conversation_id}
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conversation.employeeId != employee.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        await prisma.message.delete_many(
            where={"conversationId": conversation_id}
        )
        
        await prisma.conversation.delete(
            where={"id": conversation_id}
        )
        
        return {"message": "Conversation deleted"}
    finally:
        await prisma.disconnect()
