'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function ConciergeChat({ tripId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load existing messages
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/concierge/chat?tripId=${tripId}`);
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      } catch {
        // silently fail
      }
      setLoading(false);
    }
    load();
  }, [tripId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    setInput('');
    setStreaming(true);

    // Optimistically add user message
    const userMsg = { id: `temp-${Date.now()}`, sender_type: 'user', body: text, created_at: new Date().toISOString() };
    const assistantMsg = { id: `temp-ai-${Date.now()}`, sender_type: 'concierge', body: '', created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      const res = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, message: text }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.text) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.sender_type === 'concierge') {
                  updated[updated.length - 1] = { ...last, body: last.body + payload.text };
                }
                return updated;
              });
            }
            if (payload.error) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.sender_type === 'concierge') {
                  updated[updated.length - 1] = { ...last, body: 'Something went wrong. Try again.' };
                }
                return updated;
              });
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.sender_type === 'concierge') {
          updated[updated.length - 1] = { ...last, body: 'Connection lost. Try again.' };
        }
        return updated;
      });
    }

    setStreaming(false);
    inputRef.current?.focus();
  }

  function formatTime(dateStr) {
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  if (loading) {
    return (
      <div className="v-chat">
        <div className="v-chat-loading">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="v-chat">
      <div className="v-chat-messages">
        {messages.length === 0 && (
          <div className="v-chat-empty">
            Ask anything about your trip — who's arriving when, what's planned, restaurant recommendations, or help organizing details.
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`v-chat-msg v-chat-msg-${msg.sender_type}`}>
            <div className="v-chat-bubble">
              {msg.body || (streaming && msg.sender_type === 'concierge' ? '' : '')}
              {streaming && msg.sender_type === 'concierge' && msg === messages[messages.length - 1] && (
                <span className="v-chat-cursor" />
              )}
            </div>
            <div className="v-chat-time">{formatTime(msg.created_at)}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="v-chat-input-bar" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          className="v-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the concierge..."
          disabled={streaming}
          autoComplete="off"
        />
        <button
          type="submit"
          className="v-chat-send"
          disabled={!input.trim() || streaming}
        >
          Send
        </button>
      </form>
    </div>
  );
}
