'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { SECTIONS, INITIAL_FORM_DATA } from './sections';
import useSpeechRecognition from './useSpeechRecognition';
import useConciergeAudio from './useConciergeAudio';

const ALL_FIELDS = SECTIONS.flatMap(s => s.questions);

export default function IntakeConcierge({ mode = 'freeform' }) {
  const isGuided = mode === 'guided';
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [messages, setMessages] = useState(
    isGuided
      ? []
      : [
          {
            role: 'assistant',
            content: "Hey Lauren! I've already pulled in everything from our calls — you can see the form on the right. A few fields are still blank: revenue model, real money handling, and timeline. Want to start there, or is there anything you'd like to tweak first?",
          },
        ]
  );
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [flashFields, setFlashFields] = useState(new Set());
  const [editingField, setEditingField] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const sendRef = useRef(null);
  const submitRef = useRef(null);

  const { playAudio, stop: stopAudio, isSpeaking, muted, toggleMute } = useConciergeAudio();

  const currentField = isGuided ? ALL_FIELDS[currentFieldIndex] : null;
  const guidedComplete = isGuided && currentFieldIndex >= ALL_FIELDS.length;

  // Auto-scroll chat (scoped to messages container only)
  const messagesRef = useRef(null);
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textareas when form data changes
  useEffect(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.concierge-textarea').forEach(el => {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
      });
    });
  }, [formData]);


  const { isListening, isSupported, toggle: toggleMic } = useSpeechRecognition({
    onResult: (transcript) => {
      setInput('');
      sendRef.current?.(transcript);
    },
    onInterim: (transcript) => {
      setInput(transcript);
    },
  });

  const handleMicClick = useCallback(() => {
    stopAudio();
    toggleMic();
  }, [stopAudio, toggleMic]);

  const sendMessage = useCallback(async (text) => {
    const msg = text || input.trim();
    if (!msg || isStreaming) return;

    stopAudio();
    setInput('');
    setIsStreaming(true);
    setChatOpen(true);

    const isSystemSignal = msg === '[ASK_NEXT]';
    const userMessage = { role: 'user', content: msg };
    const assistantMessage = { role: 'assistant', content: '' };

    // Hide system signals from chat display
    setMessages(prev => isSystemSignal
      ? [...prev, assistantMessage]
      : [...prev, userMessage, assistantMessage]
    );

    // Build history (exclude the initial greeting and new messages)
    const history = messages
      .slice(isGuided ? 0 : 1) // skip initial greeting in freeform
      .map(m => ({ role: m.role, content: m.content }));

    try {
      abortRef.current = new AbortController();

      const body = {
        message: msg,
        history,
        formState: formData,
      };

      if (isGuided) {
        body.mode = 'guided';
        body.currentFieldId = currentField?.id;
        body.fieldIndex = currentFieldIndex;
      }

      const res = await fetch('/api/stand/intake/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed);

            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              fullText += parsed.delta.text;
              const displayText = fullText
                .replace(/<FIELD_UPDATES>[\s\S]*?<\/FIELD_UPDATES>/g, '')
                .replace(/<NEXT_FIELD\/>/g, '')
                .replace(/<SUBMIT\/>/g, '')
                .trim();
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: displayText };
                return updated;
              });
            }
          } catch {
            // skip unparseable lines
          }
        }
      }

      // Extract field updates
      const updateMatch = fullText.match(/<FIELD_UPDATES>([\s\S]*?)<\/FIELD_UPDATES>/);
      if (updateMatch) {
        try {
          const updates = JSON.parse(updateMatch[1]);
          const fieldsToFlash = new Set();

          setFormData(prev => {
            const next = { ...prev };
            for (const [key, value] of Object.entries(updates)) {
              if (key === editingField) continue;
              if (key in next) {
                next[key] = value;
                fieldsToFlash.add(key);
              }
            }
            return next;
          });

          if (fieldsToFlash.size > 0) {
            setFlashFields(fieldsToFlash);
            setTimeout(() => setFlashFields(new Set()), 1500);
          }
        } catch {
          // invalid JSON in field updates
        }
      }

      // Check for NEXT_FIELD signal in guided mode
      // Only advance if this was an actual user answer, not an [ASK_NEXT] system signal
      const hasNextField = fullText.includes('<NEXT_FIELD/>');
      if (isGuided && hasNextField && !isSystemSignal) {
        setCurrentFieldIndex(prev => prev + 1);
      }

      // Check for SUBMIT signal
      const shouldSubmit = fullText.includes('<SUBMIT/>');

      // Clean display text
      const cleanText = fullText
        .replace(/<FIELD_UPDATES>[\s\S]*?<\/FIELD_UPDATES>/g, '')
        .replace(/<NEXT_FIELD\/>/g, '')
        .replace(/<SUBMIT\/>/g, '')
        .trim();

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: cleanText };
        return updated;
      });

      // Play audio of the response
      if (cleanText) {
        playAudio(cleanText);
      }

      // Auto-submit after a short delay so Lauren hears the confirmation
      if (shouldSubmit) {
        setTimeout(() => submitRef.current?.(), 2000);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Try again?' };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, messages, formData, editingField, isGuided, currentField, playAudio, stopAudio]);

  // Keep ref in sync so speech callback always has latest sendMessage
  sendRef.current = sendMessage;

  // Guided mode: auto-kick-off on mount
  // No guard ref — cleanup + remount (React Strict Mode) creates a fresh timer each time
  useEffect(() => {
    if (!isGuided) return;
    const timer = setTimeout(() => {
      sendRef.current?.("Hi! I'm ready to go through the questionnaire.");
    }, 500);
    return () => clearTimeout(timer);
  }, [isGuided]);

  // Guided mode: when field index advances and we're not complete, auto-prompt next question
  const prevFieldIndexRef = useRef(currentFieldIndex);
  useEffect(() => {
    if (!isGuided) return;
    if (currentFieldIndex === prevFieldIndexRef.current) return;
    prevFieldIndexRef.current = currentFieldIndex;

    if (currentFieldIndex >= ALL_FIELDS.length) {
      // All done — send completion message
      const timer = setTimeout(() => {
        sendRef.current?.("That was the last one!");
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Auto-ask next question (hidden system signal)
    const timer = setTimeout(() => {
      sendRef.current?.("[ASK_NEXT]");
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentFieldIndex, isGuided]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const updateField = useCallback((id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  }, []);

  const autoResize = useCallback((e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(false);
    try {
      const organized = {};
      SECTIONS.forEach(section => {
        organized[section.id] = {};
        section.questions.forEach(q => {
          organized[section.id][q.id] = formData[q.id] || '';
        });
      });

      const res = await fetch('/api/stand/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(organized),
      });

      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }, [formData]);

  submitRef.current = handleSubmit;

  const renderField = (q) => {
    const isFlashing = flashFields.has(q.id);
    const isActive = isGuided && currentField?.id === q.id;
    const isDimmed = isGuided && !guidedComplete && currentField?.id !== q.id;

    let fieldClass = 'concierge-field';
    if (isFlashing) fieldClass += ' concierge-field-flash';
    if (isActive) fieldClass += ' concierge-field-active';
    if (isDimmed) fieldClass += ' concierge-field-dimmed';

    if (q.type === 'textarea') {
      return (
        <div key={q.id} id={`c-field-${q.id}`} className={fieldClass}>
          <label className="intake-label" htmlFor={`c-${q.id}`}>{q.label}</label>
          {q.hint && <span className="intake-hint">{q.hint}</span>}
          <textarea
            id={`c-${q.id}`}
            className="concierge-textarea"
            value={formData[q.id] || ''}
            onChange={(e) => updateField(q.id, e.target.value)}
            onInput={autoResize}
            onFocus={() => setEditingField(q.id)}
            onBlur={() => setEditingField(null)}
            placeholder={q.placeholder}
            rows={1}
          />
        </div>
      );
    }

    if (q.type === 'text') {
      return (
        <div key={q.id} id={`c-field-${q.id}`} className={fieldClass}>
          <label className="intake-label" htmlFor={`c-${q.id}`}>{q.label}</label>
          {q.hint && <span className="intake-hint">{q.hint}</span>}
          <input
            id={`c-${q.id}`}
            type="text"
            className="intake-text"
            value={formData[q.id] || ''}
            onChange={(e) => updateField(q.id, e.target.value)}
            onFocus={() => setEditingField(q.id)}
            onBlur={() => setEditingField(null)}
            placeholder={q.placeholder}
          />
        </div>
      );
    }

    if (q.type === 'radio') {
      return (
        <div key={q.id} id={`c-field-${q.id}`} className={fieldClass}>
          <div className="intake-label">{q.label}</div>
          {q.hint && <span className="intake-hint">{q.hint}</span>}
          <div className="intake-options">
            {q.options.map(opt => (
              <label key={opt} className="intake-pill">
                <input
                  type="radio"
                  name={`c-${q.id}`}
                  value={opt}
                  checked={formData[q.id] === opt}
                  onChange={() => updateField(q.id, opt)}
                />
                <span className="intake-pill-label">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  if (submitted) {
    return (
      <div className="intake">
        <div className="intake-container">
          <div className="intake-brand">Andy Santamaria</div>
          <div className="intake-thanks">
            <svg viewBox="0 0 120 48" width="24" height="10" className="intake-thanks-mark" aria-hidden="true">
              <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
            </svg>
            <h1 className="intake-thanks-title">Thank you, Lauren</h1>
            <p className="intake-thanks-text">
              I&apos;ve got everything I need. Give me a few days and I&apos;ll have a proposal I think you&apos;ll love.
            </p>
            <div className="intake-thanks-sig">&mdash;Andy</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="concierge">
      {/* Left: Chat */}
      <div className={`concierge-chat${chatOpen ? ' concierge-chat-open' : ''}`}>
        <div className="concierge-chat-header">
          <div className="concierge-chat-title">
            Stand Intake
            {isGuided && !guidedComplete && (
              <span className="concierge-progress">
                Question {Math.min(currentFieldIndex + 1, ALL_FIELDS.length)} of {ALL_FIELDS.length}
              </span>
            )}
          </div>
          <div className="concierge-chat-header-actions">
            <button
              className={`concierge-mute${muted ? ' concierge-mute-active' : ''}`}
              onClick={toggleMute}
              aria-label={muted ? 'Unmute voice' : 'Mute voice'}
            >
              {muted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
              <span className="concierge-mute-tooltip">{muted ? 'Unmute concierge' : "Mute concierge, I\u2019ll read on my own"}</span>
            </button>
            <button className="concierge-chat-close" onClick={() => setChatOpen(false)} aria-label="Close chat">
              &times;
            </button>
          </div>
        </div>
        <div className="concierge-messages" ref={messagesRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`concierge-msg concierge-msg-${msg.role}`}>
              <div className={`concierge-bubble concierge-bubble-${msg.role}${isSpeaking && msg.role === 'assistant' && i === messages.length - 1 ? ' concierge-speaking' : ''}`}>
                {msg.content || (isStreaming && i === messages.length - 1 ? '' : '')}
                {isStreaming && i === messages.length - 1 && (
                  <span className="concierge-cursor" />
                )}
              </div>
            </div>
          ))}
          {isGuided && !isStreaming && !guidedComplete && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
            <div className="concierge-actions">
              <button
                className="concierge-action concierge-action-keep"
                onClick={() => sendMessage('Keep it')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Keep it
              </button>
              {isSupported && (
                <button
                  className="concierge-action concierge-action-record"
                  onClick={handleMicClick}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  I&apos;ll tell you
                </button>
              )}
            </div>
          )}
        </div>
        <div className="concierge-input-row">
          <input
            ref={inputRef}
            type="text"
            className="concierge-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : 'Type or tap the mic...'}
            disabled={isStreaming}
          />
          {isSupported && (
            <button
              className={`concierge-mic${isListening ? ' concierge-mic-active' : ''}`}
              onClick={handleMicClick}
              disabled={isStreaming}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}
          <button
            className="concierge-send"
            onClick={() => sendMessage()}
            disabled={isStreaming || !input.trim()}
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right: Form */}
      <div className="concierge-form">
        <div className="concierge-form-inner">
          <div className="intake-brand">Andy Santamaria</div>
          <div className="concierge-form-heading">
            <h1 className="concierge-form-title">Stand Intake</h1>
            <p className="concierge-form-subtitle">
              {isGuided
                ? 'Follow along as we walk through each question. Fields update as you answer.'
                : 'Review, refine, and fill the gaps. Chat with the AI to update fields, or edit directly.'}
            </p>
          </div>

          {SECTIONS.map(section => (
            <div key={section.id} className="concierge-section">
              <div className="intake-section-num">{section.number}</div>
              <h2 className="intake-section-title">{section.title}</h2>
              <div className="intake-section-rule" />
              {section.questions.map(renderField)}
            </div>
          ))}

          <div className="concierge-form-actions">
            <button
              className={`intake-submit${submitting ? ' intake-submit-sending' : ''}`}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Sending' : 'Send to Andy'}
            </button>
            {error && <p className="intake-error">Something went wrong. Please try again.</p>}
          </div>
        </div>
      </div>

      {/* Mobile: floating chat toggle */}
      {!chatOpen && (
        <button className="concierge-fab" onClick={() => setChatOpen(true)} aria-label="Open chat">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
    </div>
  );
}
