import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  Sliders, 
  Cpu, 
  Save, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  Server,
  Info
} from 'lucide-react';
import { SystemHealth } from '../types';

interface SettingsViewProps {
  health: SystemHealth | null;
  onRefreshHealth: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ health, onRefreshHealth }) => {
  const [llmProvider, setLlmProvider] = useState(health?.llm_provider || 'local');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [topK, setTopK] = useState(health?.default_top_k || 4);
  const [threshold, setThreshold] = useState(health?.similarity_threshold || 0.08);
  const [chunkSize, setChunkSize] = useState(health?.chunk_size || 500);
  const [chunkOverlap, setChunkOverlap] = useState(health?.chunk_overlap || 100);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (health) {
      setLlmProvider(health.llm_provider);
      setTopK(health.default_top_k);
      setThreshold(health.similarity_threshold);
      setChunkSize(health.chunk_size);
      setChunkOverlap(health.chunk_overlap);
    }
  }, [health]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const payload: any = {
        llm_provider: llmProvider,
        default_top_k: topK,
        similarity_threshold: threshold,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap
      };

      if (apiKey.trim()) {
        payload.openai_api_key = apiKey.trim();
      }

      const resp = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        setSaveMessage('System configuration successfully updated and synced with backend.');
        onRefreshHealth();
      }
    } catch (err: any) {
      setSaveMessage(`Error saving settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, margin: '0 auto' }}>
      <div className="glass-card">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={18} color="#60a5fa" /> System & Model Configuration
        </h3>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* LLM Provider Selection */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              LLM & SYNTHESIS PROVIDER
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div
                onClick={() => setLlmProvider('local')}
                style={{
                  border: `1px solid ${llmProvider === 'local' ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                  background: llmProvider === 'local' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                  borderRadius: 8,
                  padding: 14,
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 13.5, marginBottom: 4 }}>
                  Local Grounded Engine
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                  Deterministic, 0 latency, 100% offline, guaranteed zero hallucination.
                </div>
              </div>

              <div
                onClick={() => setLlmProvider('openai')}
                style={{
                  border: `1px solid ${llmProvider === 'openai' ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                  background: llmProvider === 'openai' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                  borderRadius: 8,
                  padding: 14,
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 13.5, marginBottom: 4 }}>
                  OpenAI API (GPT-4o)
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                  Requires OPENAI_API_KEY. Cloud synthesis with strict grounding system prompts.
                </div>
              </div>

              <div
                onClick={() => setLlmProvider('ollama')}
                style={{
                  border: `1px solid ${llmProvider === 'ollama' ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                  background: llmProvider === 'ollama' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                  borderRadius: 8,
                  padding: 14,
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 13.5, marginBottom: 4 }}>
                  Ollama Local LLM
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                  Connects to localhost:11434 (e.g., Llama 3.2, Mistral).
                </div>
              </div>
            </div>
          </div>

          {/* OpenAI API Key Field */}
          {llmProvider === 'openai' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                OPENAI API KEY
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-proj-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    borderRadius: 6,
                    padding: '10px 40px 10px 12px',
                    fontSize: 13,
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 10,
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer'
                  }}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Retrieval Parameters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                DEFAULT RETRIEVAL TOP-K: {topK}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Number of chunks supplied to Response Generation Agent
              </span>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                SIMILARITY THRESHOLD: {threshold.toFixed(2)}
              </label>
              <input
                type="range"
                min={0.01}
                max={0.50}
                step={0.01}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Low-confidence pruning cutoff for weak or irrelevant chunks
              </span>
            </div>
          </div>

          {/* Chunking Defaults */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                DEFAULT CHUNK SIZE: {chunkSize} chars
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
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                CHUNK OVERLAP: {chunkOverlap} chars
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Apply & Save Settings'}</span>
            </button>

            {saveMessage && (
              <span style={{ fontSize: 12.5, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> {saveMessage}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Diagnostics Card */}
      <div className="glass-card">
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Info size={16} color="#60a5fa" /> System Diagnostics & Storage Health
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 12.5 }}>
          <div style={{ padding: 10, background: 'rgba(15, 23, 42, 0.6)', borderRadius: 6 }}>
            <span style={{ color: 'var(--text-dim)' }}>Vector Dimension:</span>{' '}
            <strong style={{ color: '#fff' }}>{health?.vector_dimension || 2048} features</strong>
          </div>
          <div style={{ padding: 10, background: 'rgba(15, 23, 42, 0.6)', borderRadius: 6 }}>
            <span style={{ color: 'var(--text-dim)' }}>Total Chunks Indexed:</span>{' '}
            <strong style={{ color: '#fff' }}>{health?.total_chunks_indexed || 0} chunks</strong>
          </div>
          <div style={{ padding: 10, background: 'rgba(15, 23, 42, 0.6)', borderRadius: 6 }}>
            <span style={{ color: 'var(--text-dim)' }}>Vector Index Persistence:</span>{' '}
            <strong style={{ color: '#34d399' }}>backend/data/storage/vector_index.pkl</strong>
          </div>
          <div style={{ padding: 10, background: 'rgba(15, 23, 42, 0.6)', borderRadius: 6 }}>
            <span style={{ color: 'var(--text-dim)' }}>Metadata Database:</span>{' '}
            <strong style={{ color: '#34d399' }}>backend/data/storage/knowledge_base.db</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
