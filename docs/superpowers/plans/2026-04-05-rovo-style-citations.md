# Rovo-Style Citations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Rovo-style citations to chat with inline markers, source cards, and PDF highlighting.

**Architecture:** Backend returns structured source data (docId, page, excerpt) instead of strings. Frontend renders CitationCard components with inline markers. PDF viewer opens at specific page with highlighted text using react-pdf.

**Tech Stack:** react-pdf for PDF viewing, Tailwind CSS, TypeScript

---

## File Structure

**Backend:**
- Modify: `backend/app/services/document_processor.py` - Track page numbers during extraction
- Modify: `backend/app/services/vector_store.py` - Return chunk with page info
- Modify: `backend/app/services/rag_engine.py` - Return structured source objects
- Modify: `backend/app/routers/chat.py` - Update ChatResponse with structured sources

**Frontend:**
- Modify: `frontend/src/lib/types.ts` - Add Citation type
- Create: `frontend/src/components/CitationCard.tsx` - Source card component
- Create: `frontend/src/components/PDFViewer.tsx` - PDF viewer with highlight
- Modify: `frontend/src/app/chat/page.tsx` - Render citations inline
- Install: `react-pdf` package

---

## Tasks

### Task 1: Update Document Processor to Track Page Numbers

**Files:**
- Modify: `backend/app/services/document_processor.py`

- [ ] **Step 1: Update document_processor.py**

Add page tracking to the `extract_text` method. For PDF, extract page numbers with text chunks.

Replace the existing `extract_text` method with one that returns page-aware chunks:

```python
def extract_text(self, file_path: str, file_type: str) -> List[dict]:
    """
    Extract text from file, returning list of {page, text} dicts.
    """
    if file_type == "pdf":
        return self._extract_pdf_with_pages(file_path)
    elif file_type == "docx":
        return [{"page": 1, "text": self._extract_docx(file_path)}]
    elif file_type == "pptx":
        return self._extract_pptx_with_pages(file_path)
    elif file_type == "xlsx":
        return [{"page": 1, "text": self._extract_xlsx(file_path)}]
    return [{"page": 1, "text": ""}]

def _extract_pdf_with_pages(self, file_path: str) -> List[dict]:
    """Extract text with page numbers from PDF."""
    from pypdf import PdfReader
    reader = PdfReader(file_path)
    results = []
    for page_num, page in enumerate(reader.pages, start=1):
        text = page.extract_text()
        if text.strip():
            results.append({"page": page_num, "text": text})
    return results

def _extract_pptx_with_pages(self, file_path: str) -> List[dict]:
    """Extract text from PPTX slides (each slide = 1 page)."""
    from pptx import Presentation
    prs = Presentation(file_path)
    results = []
    for slide_num, slide in enumerate(prs.slides, start=1):
        text_parts = []
        for shape in slide.shapes:
            if hasattr(shape, "text"):
                text_parts.append(shape.text)
        text = "\n".join(text_parts)
        if text.strip():
            results.append({"page": slide_num, "text": text})
    return results
```

Also update `chunk_text` to accept page-aware input:

```python
def chunk_text_with_pages(self, pages: List[dict], chunk_size: int = 500) -> List[dict]:
    """
    Chunk text while preserving page info.
    Returns list of {page, chunk_index, text} dicts.
    """
    chunks = []
    for page_info in pages:
        page = page_info["page"]
        text = page_info["text"]
        words = text.split()
        for i in range(0, len(words), chunk_size):
            chunk_words = words[i:i + chunk_size]
            chunks.append({
                "page": page,
                "chunk_index": len(chunks),
                "text": " ".join(chunk_words)
            })
    return chunks
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/document_processor.py
git commit -m "feat: track page numbers during document extraction"
```

---

### Task 2: Update Vector Store to Return Page Info

**Files:**
- Modify: `backend/app/services/vector_store.py`

- [ ] **Step 1: Update vector_store.py**

Modify `add_chunks` to accept page info and store in payload:

```python
def add_chunks(self, chunks: List[dict], document_id: str, embeddings: List[List[float]]):
    """
    chunks: List of {page, chunk_index, text} dicts
    """
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
```

Update `search` to return page info:

```python
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
                "score": result.score
            }
            for result in results.points
        ]
    except Exception as e:
        print(f"Warning: Search error: {e}")
        return []
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/vector_store.py
git commit -m "feat: store and return page numbers in vector store"
```

---

### Task 3: Update RAG Engine to Return Structured Sources

**Files:**
- Modify: `backend/app/services/rag_engine.py`

- [ ] **Step 1: Update rag_engine.py**

Modify `generate_answer` to return structured source objects:

```python
async def generate_answer(
    self,
    question: str,
    context_chunks: List[dict],  # Changed from List[str], now expects dicts with page info
    persona: str = "casual"
) -> tuple[str, List[dict], float]:  # Returns List[dict] for sources
    
    # ... existing code ...
    
    # After getting answer, create structured sources
    sources = []
    for i, chunk in enumerate(context_chunks):
        sources.append({
            "chunk_id": chunk.get("id", f"chunk-{i}"),
            "document_id": chunk.get("document_id", ""),
            "page": chunk.get("page", 1),
            "excerpt": chunk.get("content", "")[:200]  # First 200 chars
        })
    
    return answer, sources, confidence
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/rag_engine.py
git commit -m "feat: return structured source objects from RAG engine"
```

---

### Task 4: Update Chat Router & Document Processor Call

**Files:**
- Modify: `backend/app/routers/chat.py`
- Modify: `backend/app/routers/documents.py`

- [ ] **Step 1: Update documents.py - pass page-aware chunks**

In the upload endpoint, update how chunks are passed:

```python
# In upload_document function, replace the chunking logic:
text_pages = document_processor.extract_text(file_path, file_ext)
chunks_with_pages = document_processor.chunk_text_with_pages(text_pages)
chunks = [{"page": c["page"], "chunk_index": c["chunk_index"], "text": c["text"]} for c in chunks_with_pages]
text = "\n\n".join([c["text"] for c in chunks])

# Then pass to vector store
vector_store.add_chunks(chunks, document.id, embeddings)
```

- [ ] **Step 2: Update chat.py - use structured sources**

Update ChatResponse model:

```python
class SourceInfo(BaseModel):
    chunk_id: str
    document_id: str
    page: int
    excerpt: str

class ChatResponse(BaseModel):
    content: str
    sources: List[SourceInfo]
    confidence: float
    conversationId: Optional[str] = None
```

Update chat endpoint to handle structured chunks:

```python
# Search returns structured results
query_embedding = await embeddings_service.get_embedding(message.content)
search_results = vector_store.search(query_embedding, top_k=5)

# Convert to expected format
context_chunks = [
    {
        "id": r["id"],
        "document_id": r["document_id"],
        "page": r.get("page", 1),
        "content": r.get("content", "")
    }
    for r in search_results
]

answer, sources, confidence = await rag_engine.generate_answer(
    question=message.content,
    context_chunks=context_chunks,
    persona=employee.personaTone
)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/routers/chat.py backend/app/routers/documents.py
git commit -m "feat: update chat API to return structured sources with page numbers"
```

---

### Task 5: Install react-pdf and Update Types

**Files:**
- Modify: `frontend/src/lib/types.ts`

- [ ] **Step 1: Install react-pdf**

```bash
cd frontend
npm install react-pdf
```

- [ ] **Step 2: Update types.ts**

Add Citation type:

```typescript
export interface Citation {
  chunk_id: string;
  document_id: string;
  page: number;
  excerpt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Citation[];
  confidence?: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/types.ts
git commit -m "feat: add Citation type to frontend"
```

---

### Task 6: Create CitationCard Component

**Files:**
- Create: `frontend/src/components/CitationCard.tsx`

- [ ] **Step 1: Create CitationCard.tsx**

```tsx
'use client';

import { FileText, File, Presentation, Sheet, ExternalLink } from 'lucide-react';
import { Citation } from '@/lib/types';

interface CitationCardProps {
  citation: Citation;
  index: number;
  documentName?: string;
  fileType?: string;
  onView: (citation: Citation) => void;
}

const fileIcons = {
  PDF: FileText,
  DOCX: File,
  PPTX: Presentation,
  XLSX: Sheet,
};

export function CitationCard({ citation, index, documentName, fileType = 'PDF', onView }: CitationCardProps) {
  const Icon = fileIcons[fileType as keyof typeof fileIcons] || FileText;
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              [{index + 1}]
            </span>
            <span className="text-sm font-medium text-gray-900 truncate">
              {documentName || 'Document'}
            </span>
            {citation.page > 0 && (
              <span className="text-xs text-gray-500">
                Page {citation.page}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-3 italic">
            "{citation.excerpt}"
          </p>
        </div>
        <button
          onClick={() => onView(citation)}
          className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View in document"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/CitationCard.tsx
git commit -m "feat: create CitationCard component"
```

---

### Task 7: Create PDFViewer Component

**Files:**
- Create: `frontend/src/components/PDFViewer.tsx`

- [ ] **Step 1: Create PDFViewer.tsx**

```tsx
'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Citation } from '@/lib/types';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  citation: Citation;
  documentName: string;
  documentUrl: string;
  onClose: () => void;
}

export function PDFViewer({ citation, documentName, documentUrl, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(citation.page || 1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(citation.page || 1);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-medium text-gray-900">{documentName}</h3>
            <p className="text-sm text-gray-500">Page {pageNumber} of {numPages}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={documentUrl}
              download={documentName}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Download"
            >
              <Download className="h-5 w-5 text-gray-600" />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-100 flex justify-center">
          <Document
            file={documentUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
            />
          </Document>
        </div>
        
        <div className="flex items-center justify-center gap-4 p-4 border-t">
          <button
            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-600">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
            disabled={pageNumber >= numPages}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        
        {citation.excerpt && (
          <div className="p-4 bg-blue-50 border-t">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Highlighted text:</span> "{citation.excerpt}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/PDFViewer.tsx
git commit -m "feat: create PDFViewer component with react-pdf"
```

---

### Task 8: Update ChatPage to Display Citations

**Files:**
- Modify: `frontend/src/app/chat/page.tsx`

- [ ] **Step 1: Update chat/page.tsx**

Add imports and state:

```tsx
import { CitationCard } from '@/components/CitationCard';
import { PDFViewer } from '@/components/PDFViewer';
import { Citation } from '@/lib/types';

// Add state for PDF viewer
const [pdfViewerData, setPdfViewerData] = useState<{
  citation: Citation;
  documentName: string;
  documentUrl: string;
} | null>(null);

// Add function to handle view click
const handleViewCitation = async (citation: Citation) => {
  // Fetch document info from API
  try {
    const response = await fetch(`http://localhost:8000/api/documents/${citation.document_id}`, {
      headers: { 'Authorization': `Bearer ${api.getToken()}` },
    });
    if (response.ok) {
      const doc = await response.json();
      setPdfViewerData({
        citation,
        documentName: doc.filename,
        documentUrl: `http://localhost:8000${doc.filePath}`,
      });
    }
  } catch (error) {
    console.error('Failed to load document:', error);
  }
};

// Add PDF viewer modal at end of return
{pdfViewerData && (
  <PDFViewer
    citation={pdfViewerData.citation}
    documentName={pdfViewerData.documentName}
    documentUrl={pdfViewerData.documentUrl}
    onClose={() => setPdfViewerData(null)}
  />
)}
```

Update message display to show citations after assistant messages:

```tsx
{/* In the messages.map */}
{message.role === 'assistant' && message.sources && message.sources.length > 0 && (
  <div className="mt-4 space-y-2">
    <p className="text-xs text-gray-500 font-medium">Sources:</p>
    {message.sources.map((citation, idx) => (
      <CitationCard
        key={citation.chunk_id}
        citation={citation}
        index={idx}
        onView={handleViewCitation}
      />
    ))}
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/chat/page.tsx
git commit -m "feat: add citation display and PDF viewer to chat page"
```

---

## Acceptance Criteria Checklist

- [ ] Document extraction tracks page numbers
- [ ] Vector store returns page info with chunks
- [ ] API returns structured sources (chunk_id, document_id, page, excerpt)
- [ ] CitationCard shows document name, page, excerpt
- [ ] PDFViewer opens at correct page
- [ ] Non-PDF files show excerpt card with download
- [ ] All code committed to git

---

## Push to GitHub

After all tasks complete:

```bash
git push origin dev-sidebar
```

Then update PR or create new PR for this feature.
