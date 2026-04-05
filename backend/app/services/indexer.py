import asyncio
from datetime import datetime
from prisma import Prisma

async def reindex_documents():
    print("Checking for documents to re-index...")
    prisma = Prisma()
    await prisma.connect()
    
    try:
        documents = await prisma.document.find_many(
            where={
                "textContent": {"not": ""}
            }
        )
        
        if not documents:
            print("No documents to re-index")
            return
        
        print(f"Found {len(documents)} documents to check/re-index")
        
        from app.services.document_processor import document_processor
        from app.services.embeddings import embeddings_service
        from app.services.vector_store import vector_store
        
        indexed_count = 0
        error_count = 0
        
        for doc in documents:
            try:
                text = doc.textContent
                if not text:
                    print(f"Skipping {doc.filename}: no text content")
                    continue
                
                chunks = document_processor.chunk_text(text)
                
                if chunks:
                    vector_store.delete_document_chunks(doc.id)
                    embeddings = await embeddings_service.get_embeddings(chunks)
                    vector_store.add_chunks(chunks, doc.id, embeddings)
                    
                    await prisma.document.update(
                        where={"id": doc.id},
                        data={
                            "chunkCount": len(chunks),
                            "status": "READY",
                            "indexedAt": datetime.now()
                        }
                    )
                    print(f"Re-indexed: {doc.filename} ({len(chunks)} chunks)")
                    indexed_count += 1
                else:
                    await prisma.document.update(
                        where={"id": doc.id},
                        data={"status": "ERROR"}
                    )
                    error_count += 1
            except Exception as e:
                print(f"Error re-indexing {doc.filename}: {e}")
                error_count += 1
        
        print(f"Re-indexing complete! Success: {indexed_count}, Errors: {error_count}")
    finally:
        await prisma.disconnect()

def run_reindex():
    asyncio.run(reindex_documents())
