import pdfplumber
import logging
from typing import List

logger = logging.getLogger(__name__)

class PDFLoader:
    @staticmethod
    def extract_text(file_path: str) -> str:
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    content = page.extract_text()
                    if content:
                        text += content + "\n"
            logger.info(f"Extracted text from {file_path}")
        except Exception as e:
            logger.error(f"Error extracting PDF text from {file_path}: {e}")
        return text

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
        if not text:
            return []
        
        chunks = []
        for i in range(0, len(text), chunk_size - overlap):
            chunks.append(text[i:i + chunk_size])
        return chunks

pdf_loader = PDFLoader()
