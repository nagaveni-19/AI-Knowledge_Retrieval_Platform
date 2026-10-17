import React from 'react';
import { 
  PlusCircle, 
  RefreshCw, 
  HelpCircle, 
  Volume2, 
  Layers
} from 'lucide-react';
import { SystemHealth } from '../types';

interface HeaderProps {
  health: SystemHealth | null;
  onNewSession: () => void;
  onRefreshHealth: () => void;
  sessionId: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  health, 
  onNewSession, 
  onRefreshHealth,
  sessionId 
}) => {
  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
          AI-Based Knowledge Retrieval Platform with Query Resolution
        </h1>
        <span style={{
          fontSize: 11,
          padding: '2px 8px',
          background: 'rgba(59, 130, 246, 0.15)',
          color: '#60a5fa',
          borderRadius: 4,
          border: '1px solid rgba(59, 130, 246, 0.3)',
          fontWeight: 600
        }}>
          Milestones 1–4 Verified
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Active Session Pill */}
        <div style={{
          fontSize: 12,
          padding: '6px 12px',
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 6,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{ color: 'var(--text-dim)' }}>Session:</span>
          <code style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{sessionId.slice(0, 8)}</code>
        </div>

        {/* New Session Button */}
        <button 
          className="btn btn-secondary" 
          onClick={onNewSession}
          title="Start fresh conversation context"
          style={{ padding: '6px 12px', fontSize: 12.5 }}
        >
          <PlusCircle size={14} />
          <span>New Session</span>
        </button>

        {/* Refresh Health */}
        <button 
          className="btn btn-secondary" 
          onClick={onRefreshHealth}
          title="Refresh system health & statistics"
          style={{ padding: '6px 10px' }}
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </header>
  );
};
