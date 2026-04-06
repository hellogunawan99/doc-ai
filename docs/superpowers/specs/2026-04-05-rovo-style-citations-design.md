# Rovo-Style Citations - Design Spec

## Overview

Add Rovo-style citations to chat responses with inline markers and source cards that link to highlighted content in the original document.

## Goals

1. Show inline `[1]`, `[2]` markers in AI answers
2. Display source cards with document name, excerpt, page
3. Click "View" to open PDF at exact page with text highlighted
4. For non-PDF files, show excerpt card with download link

## Data Flow

### 1. Extract Phase (Upload)
When uploading a document:
- Extract text with page numbers
- Chunk text (e.g., per page or fixed size)
- Store each chunk with metadata: `{docId, chunkIndex, pageNumber, text}`

### 2. Search Phase
Vector search returns chunks with metadata:
```python
{
  "id": "chunk-id",
  "content": "chunk text",
  "document_id": "doc-uuid",
  "page": 3,
  "score": 0.85
}
```

### 3. Generate Phase
AI generates answer referencing chunks by index. Backend returns structured sources.

### 4. Display Phase
Frontend renders:
- Answer text with `[1]`, `[2]` inline markers
- Source cards below answer

### 5. Highlight Phase (PDF Only)
Clicking "View" opens PDF viewer at page with text highlighted.

## API Response Format

### Current (Bad)
```json
{
  "content": "Answer with [1] markers...",
  "sources": ["Document chunk 1", "Document chunk 2"],
  "confidence": 0.85
}
```

### New (Good)
```json
{
  "content": "Answer with [1] markers...",
  "sources": [
    {
      "id": "chunk-id",
      "documentId": "doc-uuid",
      "documentName": "Global_AI_Investment_Analysis.pdf",
      "page": 3,
      "excerpt": "AI VC Funding (2025): $258.7 billion",
      "fileType": "PDF"
    }
  ],
  "confidence": 0.85
}
```

## UI Components

### 1. CitationCard
Shows for each source:
- Document icon (PDF/DOCX/PPTX/XLSX)
- Document name (truncated)
- Page number (for PDF)
- Excerpt text (2-3 lines, highlighted)
- "View" button

### 2. PDFViewer (Modal)
- Uses react-pdf or pdf.js
- Opens at specific page
- Highlights the specific text
- Close button

### 3. SourceList
Container for CitationCards below answer.

## File Type Handling

### PDF
- "View" opens PDF viewer modal
- Highlights matching text on the page
- Uses react-pdf library

### DOCX, PPTX, XLSX
- "View" shows modal with excerpt
- "Download" button to get original file

## Database Schema Changes

Add `pageNumber` to document chunks stored in PostgreSQL (or store in vector payload).

Option A: Add column to Document model
Option B: Store in Qdrant payload (simpler)

**Decision**: Store page number in Qdrant payload for now. No schema change needed.

## Implementation Order

1. **Update vector_store.py** - Return document_id, page, and chunk text
2. **Update rag_engine.py** - Return structured source objects
3. **Update chat router** - Pass structured sources to response
4. **Update types.ts** - Add Citation type
5. **Create CitationCard.tsx component**
6. **Create PDFViewer.tsx component** (with react-pdf)
7. **Update chat/page.tsx** - Render citations with inline markers

## Tech Stack

- `react-pdf` - PDF rendering and highlighting
- Or `pdfjs-dist` - Lower level PDF manipulation
- Tailwind CSS for styling

## Acceptance Criteria

- [ ] Answer shows inline `[1]`, `[2]` markers
- [ ] Source cards display below answer
- [ ] Cards show document name, page, excerpt
- [ ] PDF "View" opens viewer at correct page
- [ ] PDF text is highlighted
- [ ] Non-PDF shows excerpt card with download
- [ ] Sources are clickable and functional
