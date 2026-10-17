import React from 'react';
import { 
  FileText, 
  Database, 
  Cpu, 
  BrainCircuit, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  Stethoscope,
  Landmark,
  Server
} from 'lucide-react';
import { SystemHealth } from '../types';

interface DashboardViewProps {
  health: SystemHealth | null;
  onNavigateToChatWithQuery: (query: string, domain?: string) => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  health, 
  onNavigateToChatWithQuery,
  setActiveTab
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero Welcome Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        padding: '28px 32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: 20, color: '#93c5fd', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              <BrainCircuit size={14} /> Production-Grade Local RAG & Multi-Agent Architecture
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Autonomous Multi-Agent Knowledge Retrieval Platform
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14.5, maxWidth: 760, lineHeight: 1.6 }}>
              A complete, modular query resolution platform implementing specialized agents for Query Understanding, Semantic Retrieval, Grounded Response Synthesis, Conversational Clarification, and Context Memory.
            </p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => setActiveTab('chat')}
            style={{ padding: '12px 24px', fontSize: 14 }}
          >
            Launch AI Chat <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>INDEXED DOCUMENTS</span>
            <FileText size={18} color="#60a5fa" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>
            {health?.documents_count ?? 12}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            PDF, DOCX, TXT, CSV parsed
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>VECTOR CHUNKS</span>
            <Database size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>
            {health?.total_chunks_indexed ?? 42}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Unit-normalized vector space
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>ACTIVE AGENTS</span>
            <Cpu size={18} color="#c084fc" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>
            5
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Understanding, Retrieval, Synthesis, Clarification, Memory
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>DOMAINS COVERED</span>
            <Layers size={18} color="#fbbf24" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>
            3
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Healthcare, Finance, DevOps
          </div>
        </div>
      </div>

      {/* System Architecture Diagram Card */}
      <div className="glass-card">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} color="#60a5fa" /> End-to-End Multi-Agent Architecture & Information Flow
        </h3>
        <div style={{
          padding: 20,
          background: 'rgba(15, 23, 42, 0.9)',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {/* Ingestion Stream */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
              Phase 1: Knowledge Ingestion & Vector Indexing Pipeline
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-factual">Multi-Format Upload (PDF/DOCX/TXT/CSV)</span>
              <ArrowRight size={14} color="var(--text-dim)" />
              <span className="badge badge-factual">Text Extraction & Unicode Cleaning</span>
              <ArrowRight size={14} color="var(--text-dim)" />
              <span className="badge badge-factual">Boundary-Aware Sentence Chunking</span>
              <ArrowRight size={14} color="var(--text-dim)" />
              <span className="badge badge-factual">Dense Vector Embedding</span>
              <ArrowRight size={14} color="var(--text-dim)" />
              <span className="badge badge-factual">Persistent SQLite & Cosine Index</span>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border-subtle)' }} />

          {/* Multi-Agent Orchestration Stream */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
              Phase 2: Multi-Agent Query Resolution Pipeline
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-comparative">1. Conversation Memory Agent</span>
              <ArrowRight size={14} color="var(--text-dim)" />
              <span className="badge badge-comparative">2. Query Understanding Agent</span>
              <ArrowRight size={14} color="var(--text-dim)" />
              <span className="badge badge-ambiguous">3. Clarification Check</span>
              <ArrowRight size={14} color="var(--text-dim)" />
              <span className="badge badge-procedural">4. Semantic Retrieval Agent</span>
              <ArrowRight size={14} color="var(--text-dim)" />
              <span className="badge badge-procedural">5. Grounded Response Generation Agent</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Domain Showcase with 1-Click Starter Queries */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
          Explore Indexed Knowledge Base Domains
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {/* Domain 1: Healthcare */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Healthcare & Telehealth</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>4 verified documents indexed</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                Clinical triage escalation criteria, SpO2 thresholds, emergency vital signs, and HIPAA regulatory frameworks.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, justifyContent: 'flex-start', textAlign: 'left', padding: '8px 10px' }}
                onClick={() => onNavigateToChatWithQuery("What are the vital sign criteria for emergency telemedicine escalation?", "Healthcare")}
              >
                👉 "What are the vital sign criteria for emergency escalation?"
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, justifyContent: 'flex-start', textAlign: 'left', padding: '8px 10px' }}
                onClick={() => onNavigateToChatWithQuery("How should a clinician conduct a remote patient triage session step by step?", "Healthcare")}
              >
                👉 "How to conduct a remote patient triage step by step?"
              </button>
            </div>
          </div>

          {/* Domain 2: Financial Compliance */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  <Landmark size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Banking & AML Compliance</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>4 verified documents indexed</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                Bank Secrecy Act CTR rules ($10,000 threshold), Enhanced Due Diligence (EDD), and commercial loan matrices.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, justifyContent: 'flex-start', textAlign: 'left', padding: '8px 10px' }}
                onClick={() => onNavigateToChatWithQuery("What is the mandatory threshold for filing a Currency Transaction Report?", "Finance")}
              >
                👉 "What is the mandatory CTR filing threshold?"
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, justifyContent: 'flex-start', textAlign: 'left', padding: '8px 10px' }}
                onClick={() => onNavigateToChatWithQuery("Compare Tier 1 low risk loans versus Tier 3 high risk loans.", "Finance")}
              >
                👉 "Compare Tier 1 low risk versus Tier 3 commercial loans"
              </button>
            </div>
          </div>

          {/* Domain 3: Cloud DevOps */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 8, borderRadius: 8, background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                  <Server size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>DevOps & SRE Reliability</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>4 verified documents indexed</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                Tier-1 SLO availability targets (99.99%), Kubernetes pod CrashLoopBackOff runbooks, and disaster failovers.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, justifyContent: 'flex-start', textAlign: 'left', padding: '8px 10px' }}
                onClick={() => onNavigateToChatWithQuery("How should an SRE team execute a Kubernetes pod crash recovery sequence?", "CloudDevOps")}
              >
                👉 "How to execute a Kubernetes pod crash recovery sequence?"
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, justifyContent: 'flex-start', textAlign: 'left', padding: '8px 10px' }}
                onClick={() => onNavigateToChatWithQuery("Compare Severity 1 critical incidents versus Severity 3 minor degradations in response times.", "CloudDevOps")}
              >
                👉 "Compare Severity 1 critical incidents versus Severity 3"
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
