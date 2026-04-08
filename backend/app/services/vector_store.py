from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, SearchParams
from typing import List
import uuid

class VectorStore:
    def __init__(self, host: str = "localhost", port: int = 6333):
        self.host = host
        self.port = port
        self.collection_name = "doclaw_chunks"
        self.vector_size = 4096
        try:
            self.client = QdrantClient(host=host, port=port)
            self._ensure_collection()
        except Exception as e:
            print(f"Warning: Qdrant not available: {e}")
            self.client = None
    
    def _ensure_collection(self):
        if not self.client:
            return
            
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if self.collection_name not in collection_names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=self.vector_size, distance=Distance.COSINE),
                )
            else:
                self.client.delete_collection(collection_name=self.collection_name)
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=self.vector_size, distance=Distance.COSINE),
                )
        except Exception as e:
            print(f"Warning: Could not ensure collection: {e}")
    
    def add_chunks(self, chunks: List[dict], document_id: str, embeddings: List[List[float]]):
        if not self.client:
            print("Qdrant not available, skipping vector storage")
            return
            
        try:
            points = []
            for chunk, embedding in zip(chunks, embeddings):
                point_id = str(uuid.uuid4())
                payload = {
                    "document_id": document_id,
                    "page": chunk.get("page", 1),
                    "chunk_index": chunk.get("chunk_index", 0),
                    "content": chunk.get("text", "")
                }
                points.append(PointStruct(id=point_id, vector=embedding, payload=payload))
            
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
        except Exception as e:
            print(f"Warning: Could not add chunks: {e}")
    
    def search(self, query_embedding: List[float], top_k: int = 5) -> List[dict]:
        if not self.client:
            return []
            
        try:
            results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_embedding,
                limit=top_k,
            )
            
            return [
                {
                    "id": result.id,
                    "content": result.payload.get("content", ""),
                    "document_id": result.payload.get("document_id", ""),
                    "page": result.payload.get("page", 1),
                    "chunk_index": result.payload.get("chunk_index", 0),
                    "score": result.score
                }
                for result in results.points
            ]
        except Exception as e:
            print(f"Warning: Search error: {e}")
            return []
    
    def delete_document_chunks(self, document_id: str):
        if not self.client:
            return
            
        try:
            results = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(
                    must=[
                        {
                            "key": "document_id",
                            "match": {"value": document_id}
                        }
                    ]
                )
            )
            
            if results and results[1]:
                point_ids = [point.id for point in results[1]]
                self.client.delete(
                    collection_name=self.collection_name,
                    points_selector=point_ids
                )
        except Exception as e:
            print(f"Warning: Could not delete chunks: {e}")

vector_store = VectorStore()
