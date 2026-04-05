import os
from typing import List
import pdfplumber
from docx import Document as DocxDocument
from pptx import Presentation
from openpyxl import load_workbook

class DocumentProcessor:
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)

    def extract_text_from_pdf(self, file_path: str) -> str:
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"Error extracting PDF: {e}")
        return text

    def extract_text_from_docx(self, file_path: str) -> str:
        try:
            doc = DocxDocument(file_path)
            return "\n".join([para.text for para in doc.paragraphs])
        except Exception as e:
            print(f"Error extracting DOCX: {e}")
            return ""

    def extract_text_from_pptx(self, file_path: str) -> str:
        try:
            prs = Presentation(file_path)
            text = ""
            for slide in prs.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        text += shape.text + "\n"
            return text
        except Exception as e:
            print(f"Error extracting PPTX: {e}")
            return ""

    def extract_text_from_xlsx(self, file_path: str) -> str:
        try:
            wb = load_workbook(file_path, data_only=True)
            text = ""
            for sheet_name in wb.sheetnames:
                sheet = wb[sheet_name]
                text += f"\nSheet: {sheet_name}\n"
                for row in sheet.iter_rows(values_only=True):
                    row_text = " | ".join([str(cell) if cell else "" for cell in row])
                    if row_text.strip():
                        text += row_text + "\n"
            return text
        except Exception as e:
            print(f"Error extracting XLSX: {e}")
            return ""

    def extract_text(self, file_path: str, file_type: str) -> str:
        extractors = {
            "pdf": self.extract_text_from_pdf,
            "docx": self.extract_text_from_docx,
            "pptx": self.extract_text_from_pptx,
            "xlsx": self.extract_text_from_xlsx,
        }
        
        extractor = extractors.get(file_type.lower())
        if not extractor:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        return extractor(file_path)

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)
        
        return chunks

document_processor = DocumentProcessor()
