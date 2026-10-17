import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  Search, 
  HelpCircle, 
  FileWarning, 
  CheckCircle,
  RefreshCw,
  Filter
} from 'lucide-react';
import { AnalyticsSummary } from '../types';

export const AnalyticsView: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [domainFilter, setDomainFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [confFilter, setConfFilter] = useState('All');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (domainFilter !== 'All') params.append('domain', domainFilter);
      if (typeFilter !== 'All') params.append('query_type', typeFilter.toLowerCase());
      if (confFilter !== 'All') params.append('confidence', confFilter);

      const resp = await fetch(`/api/analytics?${params.toString()}`);
      if (resp.ok) {
        const data = await resp.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [domainFilter, typeFilter, confFilter]);

  const total = analytics?.total_queries || 1;
  const factualPct = Math.round(((analytics?.factual_count || 0) / total) * 100);
  const proceduralPct = Math.round(((analytics?.procedural_count || 0) / total) * 100);
  const compPct = Math.round(((analytics?.comparative_count || 0) / total) * 100);
  const ambigPct = Math.round(((analytics?.ambiguous_count || 0) / total) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Top Controls & Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="#60a5fa" /> Query Analytics & Knowledge Gap Detection
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Monitor system usage, query classification paths, confidence trends, and coverage gaps
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Domain Filter */}
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
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

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
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
              <option value="All">All Query Types</option>
              <option value="factual">Factual</option>
              <option value="procedural">Procedural</option>
              <option value="comparative">Comparative</option>
              <option value="ambiguous">Ambiguous</option>
            </select>

            {/* Confidence Filter */}
            <select
              value={confFilter}
              onChange={(e) => setConfFilter(e.target.value)}
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
              <option value="All">All Confidence</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="No Results">No Results</option>
            </select>

            <button className="btn btn-secondary" onClick={fetchAnalytics} style={{ padding: '6px 10px' }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div className="glass-card">
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>TOTAL QUERIES LOGGED</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginTop: 4 }}>
            {analytics?.total_queries ?? 0}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Historical turn executions</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>AVERAGE CONFIDENCE</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#34d399', marginTop: 4 }}>
            {analytics ? Math.round(analytics.avg_confidence * 100) : 0}%
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Calibrated retrieval metric</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>CLARIFICATION RATE</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
            {analytics?.ambiguous_count ?? 0}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ambiguous queries routed</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>UNANSWERED GAPS</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f87171', marginTop: 4 }}>
            {analytics?.unanswered_count ?? 0}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Missing supporting knowledge</span>
        </div>
      </div>

      {/* Query Types & Recurring Themes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Classification Distribution */}
        <div className="glass-card">
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
            Query Intent Distribution
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: '#60a5fa', fontWeight: 600 }}>Factual Queries</span>
                <span>{analytics?.factual_count || 0} ({factualPct}%)</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${factualPct}%`, height: '100%', background: '#3b82f6', borderRadius: 4 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: '#34d399', fontWeight: 600 }}>Procedural Queries</span>
                <span>{analytics?.procedural_count || 0} ({proceduralPct}%)</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${proceduralPct}%`, height: '100%', background: '#10b981', borderRadius: 4 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: '#c084fc', fontWeight: 600 }}>Comparative Queries</span>
                <span>{analytics?.comparative_count || 0} ({compPct}%)</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${compPct}%`, height: '100%', background: '#a855f7', borderRadius: 4 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>Ambiguous / Clarified</span>
                <span>{analytics?.ambiguous_count || 0} ({ambigPct}%)</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${ambigPct}%`, height: '100%', background: '#f59e0b', borderRadius: 4 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recurring Themes */}
        <div className="glass-card">
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
            Recurring Query Themes & Concepts
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {analytics?.recurring_themes && analytics.recurring_themes.length > 0 ? (
              analytics.recurring_themes.map((theme, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span style={{ color: '#fff', fontWeight: 600 }}>#{theme.keyword}</span>
                  <span style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa'
                  }}>
                    {theme.count}
                  </span>
                </div>
              ))
            ) : (
              <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>No recurring themes identified yet.</span>
            )}
          </div>
        </div>
      </div>

      {/* Knowledge Gap Detection Table */}
      <div className="glass-card">
        <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileWarning size={16} color="#f87171" /> Automated Knowledge Gap Alerts & Missing Documentation
        </h4>

        {analytics?.detected_gaps && analytics.detected_gaps.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Unanswered / Low-Confidence Query</th>
                <th>Domain</th>
                <th>Frequency</th>
                <th>Avg Confidence</th>
                <th>Actionable Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {analytics.detected_gaps.map((gap) => (
                <tr key={gap.gap_id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>"{gap.query}"</td>
                  <td>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{gap.domain || 'Unspecified'}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#f87171' }}>{gap.frequency}x</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {(gap.avg_confidence * 100).toFixed(0)}%
                  </td>
                  <td style={{ color: 'var(--accent-amber)', fontSize: 12 }}>
                    {gap.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
            <CheckCircle size={24} color="#34d399" style={{ margin: '0 auto 8px auto' }} />
            Zero unaddressed knowledge gaps detected! All user queries found verified supporting evidence in the knowledge base.
          </div>
        )}
      </div>
    </div>
  );
};
