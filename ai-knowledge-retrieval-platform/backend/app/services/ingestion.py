import os
import re
import csv
import io
import uuid
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Tuple
from datetime import datetime
from pypdf import PdfReader
import docx

from app.config import settings
from app.models.schemas import DocumentMetadata, Chunk

class IngestionService:
    def __init__(self):
        self.supported_extensions = {".pdf", ".docx", ".txt", ".csv"}

    def compute_file_hash(self, file_bytes: bytes) -> str:
        return hashlib.sha256(file_bytes).hexdigest()

    def clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        if not text:
            return ""
        # Normalize line endings
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        # Replace non-breaking spaces and unusual whitespace
        text = text.replace("\u00a0", " ").replace("\u200b", "")
        # Remove consecutive whitespace while keeping paragraph structure
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    def extract_from_pdf(self, file_bytes: bytes) -> List[Tuple[str, str]]:
        """Extract text from PDF pages. Returns [(page_label, text)]."""
        results = []
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                cleaned = self.clean_text(page_text)
                if cleaned:
                    results.append((f"Page {i + 1}", cleaned))
        except Exception as e:
            raise ValueError(f"Failed to parse PDF document: {str(e)}")
        return results

    def extract_from_docx(self, file_bytes: bytes) -> List[Tuple[str, str]]:
        """Extract text from DOCX document sections/paragraphs. Returns [(section_label, text)]."""
        results = []
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            current_section = "General"
            current_paragraphs = []

            for p in doc.paragraphs:
                text = p.text.strip()
                if not text:
                    continue
                # If paragraph style is a heading, treat as new section
                if p.style.name.startswith("Heading"):
                    if current_paragraphs:
                        section_text = self.clean_text("\n".join(current_paragraphs))
                        if section_text:
                            results.append((current_section, section_text))
                        current_paragraphs = []
                    current_section = f"Section: {text}"
                else:
                    current_paragraphs.append(text)

            if current_paragraphs:
                section_text = self.clean_text("\n".join(current_paragraphs))
                if section_text:
                    results.append((current_section, section_text))
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX document: {str(e)}")
        return results

    def extract_from_txt(self, file_bytes: bytes) -> List[Tuple[str, str]]:
        """Extract text from plain text file."""
        try:
            # Attempt UTF-8, then fallback to latin-1
            try:
                content = file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                content = file_bytes.decode("latin-1")
            
            cleaned = self.clean_text(content)
            if not cleaned:
                return []
            return [("Full Document", cleaned)]
        except Exception as e:
            raise ValueError(f"Failed to read TXT file: {str(e)}")

    def extract_from_csv(self, file_bytes: bytes) -> List[Tuple[str, str]]:
        """Extract text from CSV rows with column names."""
        results = []
        try:
            try:
                decoded = file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                decoded = file_bytes.decode("latin-1")
            
            reader = csv.reader(io.StringIO(decoded))
            rows = list(reader)
            if not rows:
                return []
            
            headers = [h.strip() for h in rows[0]]
            # Group every 3-5 rows or individual row as semantic units
            for idx, row in enumerate(rows[1:], start=1):
                if not any(row):
                    continue
                row_parts = []
                for h, val in zip(headers, row):
                    if val.strip():
                        row_parts.append(f"{h}: {val.strip()}")
                row_text = "; ".join(row_parts)
                if row_text:
                    results.append((f"Row {idx}", row_text))
        except Exception as e:
            raise ValueError(f"Failed to parse CSV file: {str(e)}")
        return results

    def chunk_text(
        self,
        sections: List[Tuple[str, str]],
        document_id: str,
        filename: str,
        domain: str,
        chunk_size: int = None,
        chunk_overlap: int = None
    ) -> List[Chunk]:
        """Divide extracted sections into overlapping, boundary-aware chunks."""
        size = chunk_size or settings.CHUNK_SIZE
        overlap = chunk_overlap or settings.CHUNK_OVERLAP
        step = max(50, size - overlap)

        chunks: List[Chunk] = []
        global_chunk_idx = 0

        for page_or_sec, text in sections:
            if not text:
                continue

            # Split into sentences or logical units
            sentences = re.split(r'(?<=[.!?])\s+|\n\n', text)
            current_buffer = ""
            current_token_count = 0

            for sent in sentences:
                sent = sent.strip()
                if not sent:
                    continue
                
                # Check if adding sentence exceeds chunk_size
                if len(current_buffer) + len(sent) > size and len(current_buffer) > 0:
                    chunk_id = f"{document_id}_c{global_chunk_idx}"
                    chunks.append(Chunk(
                        id=chunk_id,
                        document_id=document_id,
                        filename=filename,
                        domain=domain,
                        chunk_index=global_chunk_idx,
                        page_or_section=page_or_sec,
                        text=current_buffer.strip(),
                        token_count=len(current_buffer.split())
                    ))
                    global_chunk_idx += 1

                    # Overlap handling: retain the end portion of current_buffer
                    overlap_text = current_buffer[-overlap:] if len(current_buffer) > overlap else current_buffer
                    # Seek boundary
                    boundary = overlap_text.find(" ")
                    if boundary != -1:
                        overlap_text = overlap_text[boundary:].strip()
                    current_buffer = overlap_text + " " + sent if overlap_text else sent
                else:
                    if current_buffer:
                        current_buffer += " " + sent
                    else:
                        current_buffer = sent

            # Flush remaining buffer
            if current_buffer.strip():
                chunk_id = f"{document_id}_c{global_chunk_idx}"
                chunks.append(Chunk(
                    id=chunk_id,
                    document_id=document_id,
                    filename=filename,
                    domain=domain,
                    chunk_index=global_chunk_idx,
                    page_or_section=page_or_sec,
                    text=current_buffer.strip(),
                    token_count=len(current_buffer.split())
                ))
                global_chunk_idx += 1

        return chunks

    def process_file(
        self,
        filename: str,
        file_bytes: bytes,
        domain: str = "General",
        chunk_size: int = None,
        chunk_overlap: int = None
    ) -> Tuple[DocumentMetadata, List[Chunk]]:
        """Complete ingestion pipeline for a single file."""
        ext = Path(filename).suffix.lower()
        if ext not in self.supported_extensions:
            raise ValueError(f"Unsupported file format '{ext}'. Supported: {', '.join(self.supported_extensions)}")

        if len(file_bytes) == 0:
            raise ValueError(f"Uploaded file '{filename}' is empty (0 bytes).")

        # Extract text based on file extension
        if ext == ".pdf":
            sections = self.extract_from_pdf(file_bytes)
        elif ext == ".docx":
            sections = self.extract_from_docx(file_bytes)
        elif ext == ".txt":
            sections = self.extract_from_txt(file_bytes)
        elif ext == ".csv":
            sections = self.extract_from_csv(file_bytes)
        else:
            raise ValueError(f"Unhandled file extension {ext}")

        if not sections or sum(len(txt) for _, txt in sections) == 0:
            raise ValueError(f"No readable text could be extracted from '{filename}'.")

        doc_id = str(uuid.uuid4())[:8]
        chunks = self.chunk_text(
            sections=sections,
            document_id=doc_id,
            filename=filename,
            domain=domain,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

        metadata = DocumentMetadata(
            id=doc_id,
            filename=filename,
            file_type=ext.replace(".", "").upper(),
            file_size_bytes=len(file_bytes),
            upload_timestamp=datetime.utcnow().isoformat() + "Z",
            chunk_count=len(chunks),
            domain=domain,
            status="indexed"
        )

        return metadata, chunks

ingestion_service = IngestionService()
