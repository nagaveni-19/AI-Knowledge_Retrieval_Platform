import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  Eye, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  X,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { DocumentMetadata, Chunk } from '../types';

interface DocumentManagementProps {
  onDocumentChange?: () => void;
}

export const DocumentManagement: React.FC<DocumentManagementProps> = ({ onDocumentChange }) => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDomain, setFilterDomain] = useState('All');

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDomain, setUploadDomain] = useState('Healthcare');
  const [customDomain, setCustomDomain] = useState('');
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(100);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Chunk Inspector Modal
  const [selectedDocForChunks, setSelectedDocForChunks] = useState<DocumentMetadata | null>(null);
  const [docChunks, setDocChunks] = useState<Chunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/documents');
      if (resp.ok) {
        const data = await resp.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('domain', uploadDomain === 'Custom' ? customDomain : uploadDomain);
    formData.append('chunk_size', chunkSize.toString());
    formData.append('chunk_overlap', chunkOverlap.toString());

    try {
      const resp = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.detail || 'Upload failed');
      }

      setUploadStatus({
        type: 'success',
        message: `Successfully indexed '${uploadFile.name}' into vector store.`
      });
      setUploadFile(null);
      fetchDocuments();
      if (onDocumentChange) onDocumentChange();
    } catch (err: any) {
      setUploadStatus({
        type: 'error',
        message: err.message || 'Ingestion failed'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete '${filename}' and re-index the vector store?`)) {
      return;
    }

    try {
      const resp = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (resp.ok) {
        fetchDocuments();
        if (onDocumentChange) onDocumentChange();
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleViewChunks = async (doc: DocumentMetadata) => {
    setSelectedDocForChunks(doc);
    setIsLoadingChunks(true);
    try {
      const resp = await fetch(`/api/documents/${doc.id}/chunks`);
      if (resp.ok) {
        const chunks = await resp.json();
        setDocChunks(chunks);
      }
    } catch (err) {
      console.error('Failed to load chunks:', err);
    } finally {
      setIsLoadingChunks(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = filterDomain === 'All' || doc.domain === filterDomain;
    return matchesSearch && matchesDomain;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Upload & Ingestion Section */}
      <div className="glass-card">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <UploadCloud size={18} color="#60a5fa" /> Ingest Knowledge Base Document (PDF, DOCX, TXT, CSV)
        </h3>

        <form onSubmit={handleUpload}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 10,
                padding: '30px 20px',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12
              }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf,.docx,.txt,.csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setUploadFile(e.target.files[0]);
                  }
                }}
              />
              <FolderOpen size={36} color="#60a5fa" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                  {uploadFile ? uploadFile.name : 'Click or drag document to upload'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                  Supports PDF, DOCX, TXT, CSV (Max 25MB)
                </div>
              </div>
            </div>

            {/* Ingestion Parameters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  KNOWLEDGE DOMAIN
                </label>
                <select
                  value={uploadDomain}
                  onChange={(e) => setUploadDomain(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 13,
                    outline: 'none'
                  }}
                >
                  <option value="Healthcare">Healthcare & Telemedicine</option>
                  <option value="Finance">Financial & AML Compliance</option>
                  <option value="CloudDevOps">Cloud Infrastructure & DevOps</option>
                  <option value="Custom">Custom Domain...</option>
                </select>
                {uploadDomain === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom domain name"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 13,
                      outline: 'none',
                      marginTop: 8
                    }}
                  />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    CHUNK SIZE: {chunkSize} chars
                  </label>
                  <input
                    type="range"
                    min={200}
                    max={1500}
                    step={50}
                    value={chunkSize}
                    onChange={(e) => setChunkSize(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    OVERLAP: {chunkOverlap} chars
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={300}
                    step={20}
                    value={chunkOverlap}
                    onChange={(e) => setChunkOverlap(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={!uploadFile || isUploading}
                style={{ marginTop: 6 }}
              >
                {isUploading ? 'Extracting, Chunking & Indexing...' : 'Ingest & Index Document'}
              </button>

              {uploadStatus && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: uploadStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: uploadStatus.type === 'success' ? '#34d399' : '#f87171',
                  border: `1px solid ${uploadStatus.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                }}>
                  {uploadStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{uploadStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Indexed Documents Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="#34d399" /> Indexed Knowledge Base Documents ({filteredDocs.length})
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  borderRadius: 6,
                  padding: '6px 12px 6px 30px',
                  fontSize: 12.5,
                  outline: 'none'
                }}
              />
            </div>

            {/* Filter Domain */}
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12.5,
                outline: 'none'
              }}
            >
              <option value="All">All Domains</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="CloudDevOps">CloudDevOps</option>
            </select>

            <button className="btn btn-secondary" onClick={fetchDocuments} style={{ padding: '6px 10px' }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Format</th>
                <th>Domain</th>
                <th>File Size</th>
                <th>Chunks</th>
                <th>Indexed Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{doc.filename}</td>
                  <td>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa'
                    }}>
                      {doc.file_type}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-muted)' }}>{doc.domain}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {(doc.file_size_bytes / 1024).toFixed(1)} KB
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {doc.chunk_count}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    {new Date(doc.upload_timestamp).toLocaleDateString()}
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399'
                    }}>
                      ● {doc.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        title="Inspect Chunks"
                        onClick={() => handleViewChunks(doc)}
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11, color: '#f87171' }}
                        title="Delete Document"
                        onClick={() => handleDelete(doc.id, doc.filename)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chunk Inspector Modal */}
      {selectedDocForChunks && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 24
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 800, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  Chunk Inspector: {selectedDocForChunks.filename}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  Total {docChunks.length} chunks generated with boundary-aware overlap
                </span>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedDocForChunks(null)} style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isLoadingChunks ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-dim)' }}>Loading chunks...</div>
              ) : (
                docChunks.map((chunk) => (
                  <div key={chunk.id} style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: 14
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        Chunk #{chunk.chunk_index + 1} • {chunk.id}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        Section: <strong>{chunk.page_or_section}</strong> • Words: {chunk.token_count}
                      </span>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {chunk.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
