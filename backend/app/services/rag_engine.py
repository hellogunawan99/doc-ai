import anthropic
from typing import List

class RAGEngine:
    def __init__(self):
        self._client = None
        self._model = "MiniMax-M2.7-highspeed"
    
    @property
    def client(self):
        if self._client is None:
            from app.config import settings
            self._client = anthropic.Anthropic(
                api_key=settings.MINIMAX_API_KEY,
                base_url=settings.MINIMAX_BASE_URL
            )
        return self._client
    
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
            response = self.client.messages.create(
                model=self._model,
                max_tokens=1000,
                system="You are a helpful assistant that answers questions based ONLY on the provided context.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            answer = ""
            for block in response.content:
                if block.type == "text":
                    answer = block.text
                    break
            
            if not answer:
                answer = "I processed your request but didn't get a text response."
            
            confidence = 0.85
            sources = [f"Document chunk {i+1}" for i in range(len(context_chunks))]
            
            return answer, sources, confidence
            
        except Exception as e:
            print(f"Generation error: {e}")
            return (
                f"I encountered an error: {str(e)[:100]}",
                [],
                0.0
            )

rag_engine = RAGEngine()
