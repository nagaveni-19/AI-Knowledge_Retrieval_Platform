import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ChatView } from './components/ChatView';
import { DocumentManagement } from './components/DocumentManagement';
import { AnalyticsView } from './components/AnalyticsView';
import { EvaluationView } from './components/EvaluationView';
import { SettingsView } from './components/SettingsView';
import { SystemHealth } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessionId, setSessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 9));
  const [health, setHealth] = useState<SystemHealth | null>(null);

  // Triggered query from dashboard
  const [pendingQuery, setPendingQuery] = useState<{ query: string; domain?: string } | null>(null);

  const fetchHealth = async () => {
    try {
      const resp = await fetch('/api/health');
      if (resp.ok) {
        const data = await resp.json();
        setHealth(data);
      }
    } catch (err) {
      console.error('Failed to load system health:', err);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleNewSession = () => {
    const newId = 'sess_' + Math.random().toString(36).substring(2, 9);
    setSessionId(newId);
    setPendingQuery(null);
    setActiveTab('chat');
  };

  const handleNavigateToChatWithQuery = (query: string, domain?: string) => {
    setPendingQuery({ query, domain });
    setActiveTab('chat');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        health={health} 
      />

      {/* Main View Area */}
      <div className="main-area">
        <Header 
          health={health}
          onNewSession={handleNewSession}
          onRefreshHealth={fetchHealth}
          sessionId={sessionId}
        />

        <main className="content-viewport">
          {activeTab === 'dashboard' && (
            <DashboardView 
              health={health}
              onNavigateToChatWithQuery={handleNavigateToChatWithQuery}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView 
              key={sessionId + (pendingQuery?.query || '')}
              sessionId={sessionId}
              initialQuery={pendingQuery?.query || ''}
              initialDomain={pendingQuery?.domain || 'All'}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentManagement onDocumentChange={fetchHealth} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView />
          )}

          {activeTab === 'evaluation' && (
            <EvaluationView />
          )}

          {activeTab === 'settings' && (
            <SettingsView health={health} onRefreshHealth={fetchHealth} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
