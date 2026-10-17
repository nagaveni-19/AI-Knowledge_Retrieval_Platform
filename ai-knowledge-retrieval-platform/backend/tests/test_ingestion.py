import pytest
import io
from app.services.ingestion import ingestion_service

def test_extract_from_txt():
    content = b"This is a test document.\nIt contains multiple lines for ingestion."
    sections = ingestion_service.extract_from_txt(content)
    assert len(sections) == 1
    assert "test document" in sections[0][1]

def test_extract_from_csv():
    csv_bytes = b"ID,Name,Role\n1,Alice,Engineer\n2,Bob,Doctor\n"
    sections = ingestion_service.extract_from_csv(csv_bytes)
    assert len(sections) == 2
    assert "Alice" in sections[0][1]
    assert "Doctor" in sections[1][1]

def test_chunking_with_overlap():
    sections = [("Section 1", "Sentence one is clear. Sentence two has details. Sentence three gives more context. Sentence four concludes.")]
    chunks = ingestion_service.chunk_text(
        sections=sections,
        document_id="doc1",
        filename="test.txt",
        domain="General",
        chunk_size=50,
        chunk_overlap=20
    )
    assert len(chunks) >= 2
    assert chunks[0].document_id == "doc1"
    assert chunks[0].filename == "test.txt"
    assert chunks[0].chunk_index == 0

def test_empty_file_handling():
    with pytest.raises(ValueError, match="empty"):
        ingestion_service.process_file("empty.txt", b"", "General")

def test_unsupported_format_handling():
    with pytest.raises(ValueError, match="Unsupported file format"):
        ingestion_service.process_file("malicious.exe", b"binarydata", "General")
