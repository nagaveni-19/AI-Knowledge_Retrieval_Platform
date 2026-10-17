import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  RotateCcw, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Info, 
  Sparkles, 
  AlertCircle,
  FileText,
  Filter
} from 'lucide-react';
import { 
  ChatMessage, 
  QueryResponse, 
  RetrievalResult, 
  QueryType, 
  ConfidenceLevel 
} from '../types';

interface ChatViewProps {
  sessionId: string;
  initialQuery?: string;
  initialDomain?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ 
  sessionId, 
  initialQuery = '', 
  initialDomain = 'All' 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [selectedDomain, setSelectedDomain] = useState(initialDomain);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSources, setActiveSources] = useState<RetrievalResult[]>([]);
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);

  // Web Speech API - Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Web Speech API - Text to Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle initialQuery if passed from dashboard
  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setInputQuery(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Speech Recognition is not natively supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Text to Speech playback
  const handleSpeak = (text: string, messageId: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser.');
      return;
    }

    if (isSpeaking && speakingMessageId === messageId) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for cleaner speech
    const cleanText = text.replace(/[*#_`[\]]/g, ' ').replace(/\s+/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
    setSpeakingMessageId(messageId);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingMessageId(null);
    }
  };

  const handleSend = async (queryText?: string, clarificationChoice?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() && !clarificationChoice) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: clarificationChoice ? `Selected Clarification: "${clarificationChoice}"` : textToSend,
      timestamp: new Date().toLocaleTimeString(),
      isVoice: isListening
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!clarificationChoice) {
      setInputQuery('');
    }
    setIsLoading(true);

    try {
      const payload = {
        query: textToSend,
        session_id: sessionId,
        domain_filter: selectedDomain !== 'All' ? selectedDomain : null,
        clarification_answer: clarificationChoice || null
      };

      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }

      const data: QueryResponse = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        query_type: data.query_type,
        confidence_score: data.confidence_score,
        confidence_level: data.confidence_level,
        sources: data.sources,
        agent_traces: data.agent_traces,
        requires_clarification: data.requires_clarification,
        clarification_data: data.clarification_data,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (data.sources && data.sources.length > 0) {
        setActiveSources(data.sources);
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Error:** Unable to resolve query. ${err.message || 'Please check if the backend is running.'}`,
        timestamp: new Date().toLocaleTimeString(),
        confidence_level: 'No Results',
        confidence_score: 0.0
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, chunkId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChunkId(chunkId);
    setTimeout(() => setCopiedChunkId(null), 2000);
  };

  return (
    <div className="chat-layout">
      {/* Main Chat Thread */}
      <div className="chat-thread-container">
        {/* Chat Control Header */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>DOMAIN ISOLATION:</span>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12.5,
                outline: 'none'
              }}
            >
              <option value="All">All Domains (Cross-Search)</option>
              <option value="Healthcare">Healthcare & Telehealth</option>
              <option value="Finance">Financial & AML Compliance</option>
              <option value="CloudDevOps">Cloud & SRE DevOps</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!speechSupported && (
              <span style={{ fontSize: 11, color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={12} /> Web Speech API unsupported in this browser
              </span>
            )}
            {isSpeaking && (
              <button 
                className="btn btn-secondary" 
                onClick={stopSpeaking}
                style={{ padding: '4px 8px', fontSize: 11, color: '#f87171' }}
              >
                <VolumeX size={12} /> Stop Audio
              </button>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center',
              margin: 'auto',
              maxWidth: 500,
              padding: 32,
              color: 'var(--text-muted)'
            }}>
              <div style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <Sparkles size={28} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                AI Query Resolution System Ready
              </h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 20 }}>
                Ask factual definitions, procedural instructions, cross-document comparisons, or test clarification behavior.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 12, justifyContent: 'flex-start' }}
                  onClick={() => handleSend("What are the vital sign criteria for emergency telemedicine escalation?")}
                >
                  🚑 Factual: "Vital sign criteria for emergency telemedicine escalation"
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 12, justifyContent: 'flex-start' }}
                  onClick={() => handleSend("How should an SRE team execute a Kubernetes pod crash recovery sequence?")}
                >
                  ⚙️ Procedural: "Step-by-step Kubernetes pod crash recovery sequence"
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 12, justifyContent: 'flex-start' }}
                  onClick={() => handleSend("Compare Tier 1 low risk loans versus Tier 3 high risk loans.")}
                >
                  📊 Comparative: "Compare Tier 1 low risk vs Tier 3 commercial loans"
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 12, justifyContent: 'flex-start' }}
                  onClick={() => handleSend("tell me more")}
                >
                  ❓ Ambiguous Test: "tell me more" (Triggers Clarification Agent)
                </button>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className={`message-bubble ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}>
                {/* Assistant Message Header: Badge & Confidence */}
                {msg.role === 'assistant' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                    paddingBottom: 8,
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {msg.query_type && (
                        <span className={`badge badge-${msg.query_type}`}>
                          {msg.query_type}
                        </span>
                      )}
                      {msg.confidence_level && (
                        <span className={`badge ${
                          msg.confidence_level === 'High' ? 'badge-high' :
                          msg.confidence_level === 'Medium' ? 'badge-med' : 'badge-low'
                        }`}>
                          Confidence: {msg.confidence_level} ({Math.round((msg.confidence_score || 0) * 100)}%)
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Text-to-Speech Playback Button */}
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        title="Read aloud"
                        onClick={() => handleSpeak(msg.content, msg.id)}
                      >
                        {isSpeaking && speakingMessageId === msg.id ? (
                          isPaused ? <Play size={12} /> : <Pause size={12} />
                        ) : (
                          <Volume2 size={12} />
                        )}
                        <span>{isSpeaking && speakingMessageId === msg.id ? (isPaused ? 'Resume' : 'Pause') : 'Listen'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Body Content */}
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {msg.content}
                </div>

                {/* Clarification Interactive Prompt */}
                {msg.requires_clarification && msg.clarification_data && (
                  <div style={{
                    marginTop: 14,
                    padding: 14,
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 8
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HelpCircle size={14} /> CLARIFICATION REQUIRED: Please select your specific interest:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {msg.clarification_data.options.map((option, idx) => (
                        <button
                          key={idx}
                          className="btn btn-secondary"
                          style={{
                            justifyContent: 'flex-start',
                            fontSize: 12.5,
                            textAlign: 'left',
                            background: 'rgba(30, 41, 59, 0.8)',
                            borderColor: 'rgba(245, 158, 11, 0.2)'
                          }}
                          onClick={() => handleSend(msg.clarification_data!.original_query, option)}
                        >
                          👉 {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Multi-Agent Trace Accordion */}
                {msg.agent_traces && msg.agent_traces.length > 0 && (
                  <div className="agent-trace-accordion">
                    <div 
                      className="agent-trace-header"
                      onClick={() => setExpandedTraceId(expandedTraceId === msg.id ? null : msg.id)}
                    >
                      <span>🔍 Multi-Agent Reasoning Trace ({msg.agent_traces.length} steps)</span>
                      {expandedTraceId === msg.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>

                    {expandedTraceId === msg.id && (
                      <div>
                        {msg.agent_traces.map((step, idx) => (
                          <div key={idx} className="agent-step-item">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ color: 'var(--accent-cyan)' }}>{step.agent_name}</strong>
                              <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                {step.execution_time_ms} ms
                              </span>
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>
                              Action: {step.action}
                            </div>
                            <pre style={{
                              fontSize: 10.5,
                              background: 'rgba(0, 0, 0, 0.3)',
                              padding: 6,
                              borderRadius: 4,
                              overflowX: 'auto',
                              color: '#94a3b8',
                              marginTop: 4
                            }}>
                              {JSON.stringify(step.details, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 10,
                color: 'var(--text-dim)',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginTop: 4,
                marginBottom: 8,
                padding: '0 4px'
              }}>
                {msg.timestamp}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="message-bubble message-assistant" style={{ maxWidth: 320 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', animation: 'pulse-ring 1s infinite' }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Multi-agent pipeline synthesizing evidence...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="chat-input-wrapper">
          {/* Voice Input Microphone Button */}
          <button
            className={`btn ${isListening ? 'btn-mic-active' : 'btn-secondary'}`}
            onClick={toggleVoiceInput}
            title={isListening ? 'Stop voice recording' : 'Speak your query (Web Speech API)'}
            style={{ padding: '12px' }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            type="text"
            className="chat-input"
            placeholder={isListening ? 'Listening... Speak now...' : 'Ask any factual, procedural, or comparative query...'}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isLoading}
          />

          <button
            className="btn btn-primary"
            onClick={() => handleSend()}
            disabled={isLoading || !inputQuery.trim()}
            style={{ padding: '12px 18px' }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Response Transparency Panel (Retrieved Sources) */}
      <div className="transparency-panel">
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="#60a5fa" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              Retrieval Transparency Panel
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>
            {activeSources.length} Supporting Chunks
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activeSources.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', margin: 'auto', padding: 20 }}>
              <Info size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                No Active Citations
              </div>
              <p style={{ fontSize: 12, marginTop: 4 }}>
                Ask a question to inspect retrieved source chunks, similarity scores, and attribution metadata.
              </p>
            </div>
          ) : (
            activeSources.map((source, idx) => (
              <div 
                key={source.chunk_id}
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa' }}>
                    #{source.rank} • {source.document_name}
                  </span>
                  <span style={{
                    fontSize: 10.5,
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: source.similarity_score > 0.4 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: source.similarity_score > 0.4 ? '#34d399' : '#fbbf24',
                    fontWeight: 600
                  }}>
                    Sim: {source.similarity_score}
                  </span>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', gap: 12 }}>
                  <span>Section: <strong>{source.page_or_section}</strong></span>
                  <span>Domain: <strong>{source.domain}</strong></span>
                </div>

                <p style={{
                  fontSize: 12,
                  color: 'var(--text-main)',
                  lineHeight: 1.5,
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid rgba(148, 163, 184, 0.08)'
                }}>
                  "{source.text}"
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: 11, padding: '4px 8px' }}
                    onClick={() => copyToClipboard(`[${source.document_name} • ${source.page_or_section}]`, source.chunk_id)}
                  >
                    {copiedChunkId === source.chunk_id ? (
                      <>
                        <Check size={12} color="#34d399" />
                        <span style={{ color: '#34d399' }}>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Citation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
