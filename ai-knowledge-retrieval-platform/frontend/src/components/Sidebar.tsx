import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Files, 
  BarChart3, 
  FlaskConical, 
  Settings, 
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { SystemHealth } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: SystemHealth | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, health }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'chat', label: 'AI Query Resolution', icon: MessageSquare },
    { id: 'documents', label: 'Knowledge Base', icon: Files },
    { id: 'analytics', label: 'Query Analytics & Gaps', icon: BarChart3 },
    { id: 'evaluation', label: 'Retrieval Benchmark', icon: FlaskConical },
    { id: 'settings', label: 'System Configuration', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)'
        }}>
          <Cpu size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.01em', color: '#fff' }}>
            AetherRAG
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 500 }}>
            Multi-Agent Platform
          </div>
        </div>
      </div>

      <ul className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <li
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>

      {/* System Status Pill */}
      <div style={{
        padding: '16px',
        margin: '12px',
        background: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 8,
        border: '1px solid var(--border-subtle)',
        fontSize: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>SYSTEM STATUS</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: '#34d399',
            fontWeight: 600
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            Active
          </span>
        </div>
        <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Engine: <strong style={{ color: '#fff' }}>{health?.llm_provider?.toUpperCase() || 'LOCAL'}</strong>
        </div>
        <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Docs: <strong style={{ color: '#fff' }}>{health?.documents_count ?? 0}</strong> • Chunks: <strong style={{ color: '#fff' }}>{health?.total_chunks_indexed ?? 0}</strong>
        </div>
      </div>
    </aside>
  );
};
