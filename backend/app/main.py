from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, chat, documents
from app.services.indexer import run_reindex
import threading

app = FastAPI(title="DocClaw API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)

@app.on_event("startup")
async def startup_event():
    print("DocClaw API starting up...")
    thread = threading.Thread(target=run_reindex)
    thread.start()
    print("Re-indexer started in background")

@app.get("/")
async def root():
    return {"message": "DocClaw API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
