from openai import OpenAI
from typing import List
from app.config import settings

class EmbeddingsService:
    def __init__(self):
        self._client = None
    
    @property
    def client(self):
        if self._client is None:
            self._client = OpenAI(
                api_key=settings.OPENROUTER_API_KEY,
                base_url=settings.OPENROUTER_BASE_URL
            )
        return self._client
    
    async def get_embedding(self, text: str) -> List[float]:
        if not settings.OPENROUTER_API_KEY or settings.OPENROUTER_API_KEY == "your-openrouter-api-key-here":
            print("Warning: OPENROUTER_API_KEY not set, returning zero embedding")
            return [0.0] * 1536
        
        try:
            response = self.client.embeddings.create(
                model="qwen/qwen3-embedding-8b",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print("Embedding error: " + str(e))
            return [0.0] * 1536
    
    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for text in texts:
            embedding = await self.get_embedding(text)
            embeddings.append(embedding)
        return embeddings

embeddings_service = EmbeddingsService()
