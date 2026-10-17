import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Sparkles, 
  Layers, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { BenchmarkReport } from '../types';

export const EvaluationView: React.FC = () => {
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runBenchmark = async () => {
    setIsRunning(true);
    try {
      const resp = await fetch('/api/evaluation/run', { method: 'POST' });
      if (resp.ok) {
        const data = await resp.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to run benchmark:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runBenchmark();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header & Run Benchmark Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlaskConical size={18} color="#c084fc" /> RAG Retrieval Accuracy & Groundedness Benchmark Suite
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Automated scientific evaluation across 3 distinct knowledge domains: Healthcare, Finance, and DevOps (Milestones 1.4 & 4.2)
            </span>
          </div>

          <button
            className="btn btn-primary"
            onClick={runBenchmark}
            disabled={isRunning}
            style={{ padding: '10px 20px' }}
          >
            {isRunning ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Running Test Suite...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Run Live Evaluation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Accuracy KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        <div className="glass-card">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>TOP-1 RETRIEVAL HIT</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#34d399', marginTop: 4 }}>
            {report ? `${(report.top_1_accuracy * 100).toFixed(1)}%` : '--'}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>First chunk relevance</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>TOP-3 RETRIEVAL HIT</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#60a5fa', marginTop: 4 }}>
            {report ? `${(report.top_3_accuracy * 100).toFixed(1)}%` : '--'}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Top-3 recall score</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>TOP-5 RETRIEVAL HIT</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#a855f7', marginTop: 4 }}>
            {report ? `${(report.top_5_accuracy * 100).toFixed(1)}%` : '--'}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Full window recall</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>MEAN RECIPROCAL RANK</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
            {report ? report.mean_reciprocal_rank.toFixed(3) : '--'}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>MRR ranking quality</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>TEST QUERIES</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginTop: 4 }}>
            {report?.total_queries ?? 12}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Across 3 domains</span>
        </div>
      </div>

      {/* Domain Breakdown */}
      {report && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Object.entries(report.domain_accuracy).map(([domain, acc]) => (
            <div key={domain} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>DOMAIN: {domain.toUpperCase()}</span>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 2 }}>
                  {(acc * 100).toFixed(1)}% Accuracy
                </div>
              </div>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: acc >= 0.75 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: acc >= 0.75 ? '#34d399' : '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12
              }}>
                {(acc * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Results Table */}
      <div className="glass-card">
        <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
          Comprehensive Evaluation Test Runs ({report?.detailed_results?.length || 0} Queries)
        </h4>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Query ID</th>
                <th>Benchmark Test Query</th>
                <th>Domain</th>
                <th>Type</th>
                <th>Top-1 Hit</th>
                <th>Top-3 Hit</th>
                <th>MRR</th>
                <th>Sim Score</th>
                <th>Groundedness</th>
                <th>Gap Detected</th>
              </tr>
            </thead>
            <tbody>
              {report?.detailed_results.map((item) => (
                <tr key={item.query_id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-cyan)' }}>
                    {item.query_id}
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff', maxWidth: 340 }}>
                    "{item.query}"
                  </td>
                  <td>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.domain}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${item.query_type}`}>
                      {item.query_type}
                    </span>
                  </td>
                  <td>
                    {item.top_1_hit ? (
                      <CheckCircle2 size={16} color="#34d399" />
                    ) : (
                      <XCircle size={16} color="#f87171" />
                    )}
                  </td>
                  <td>
                    {item.top_3_hit ? (
                      <CheckCircle2 size={16} color="#34d399" />
                    ) : (
                      <XCircle size={16} color="#f87171" />
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {item.mrr.toFixed(2)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {item.top_relevance_score.toFixed(3)}
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: item.groundedness_score >= 0.7 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: item.groundedness_score >= 0.7 ? '#34d399' : '#fbbf24'
                    }}>
                      {(item.groundedness_score * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td>
                    {item.is_gap_detected ? (
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10.5,
                        fontWeight: 700,
                        background: 'rgba(244, 63, 94, 0.15)',
                        color: '#f87171'
                      }}>
                        YES (Intentional)
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
