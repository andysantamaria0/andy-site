'use client';

import { useState, useCallback, useEffect } from 'react';
import { SECTIONS, INITIAL_FORM_DATA } from './sections';

const NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

export default function IntakeForm() {
  const [step, setStep] = useState(-1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const totalSteps = SECTIONS.length;
  const progress = step < 0 ? 0 : step >= totalSteps ? 100 : ((step + 1) / totalSteps) * 100;
  const showProgress = step >= 0;

  const updateField = useCallback((id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  }, []);

  const goTo = useCallback((nextStep) => {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Auto-resize textareas when returning to a step with existing content
  useEffect(() => {
    if (step < 0 || step >= totalSteps) return;
    requestAnimationFrame(() => {
      document.querySelectorAll('.intake-textarea').forEach(el => {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
      });
    });
  }, [step, totalSteps]);

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

      setStep(totalSteps);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }, [formData, totalSteps]);

  const autoResize = useCallback((e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }, []);

  const renderQuestion = (q) => {
    if (q.type === 'textarea') {
      return (
        <div key={q.id} className="intake-field">
          <label className="intake-label" htmlFor={q.id}>{q.label}</label>
          {q.hint && <span className="intake-hint">{q.hint}</span>}
          <textarea
            id={q.id}
            className="intake-textarea"
            value={formData[q.id] || ''}
            onChange={(e) => updateField(q.id, e.target.value)}
            onInput={autoResize}
            placeholder={q.placeholder}
            rows={1}
          />
        </div>
      );
    }

    if (q.type === 'text') {
      return (
        <div key={q.id} className="intake-field">
          <label className="intake-label" htmlFor={q.id}>{q.label}</label>
          {q.hint && <span className="intake-hint">{q.hint}</span>}
          <input
            id={q.id}
            type="text"
            className="intake-text"
            value={formData[q.id] || ''}
            onChange={(e) => updateField(q.id, e.target.value)}
            placeholder={q.placeholder}
          />
        </div>
      );
    }

    if (q.type === 'radio') {
      return (
        <div key={q.id} className="intake-field">
          <div className="intake-label">{q.label}</div>
          {q.hint && <span className="intake-hint">{q.hint}</span>}
          <div className="intake-options">
            {q.options.map(opt => (
              <label key={opt} className="intake-pill">
                <input
                  type="radio"
                  name={q.id}
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

  // Welcome screen
  if (step === -1) {
    return (
      <div className="intake">
        <div className="intake-container">
          <div className="intake-brand">Andy Santamaria</div>
          <div className="intake-welcome">
            <div className="intake-welcome-for">For Lauren</div>
            <p className="intake-welcome-text">
              Thank you for taking the time to go through this. I find that the best proposals come from understanding not just what you want to build, but why &mdash; and how you think about it.
            </p>
            <p className="intake-welcome-text">
              These questions are meant to be answered however feels natural. Long, short, stream of consciousness &mdash; all good. Everything is optional &mdash; skip anything you want.
            </p>
            <p className="intake-welcome-text">
              When you&apos;re done, I&apos;ll have everything I need to put together something thoughtful.
            </p>
            <button className="intake-begin" onClick={() => goTo(0)}>
              Begin <span className="intake-begin-arrow">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Thank you screen
  if (step >= totalSteps) {
    return (
      <div className="intake">
        <div className="intake-progress intake-progress-visible">
          <div className="intake-progress-fill" style={{ width: '100%' }} />
        </div>
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

  // Form steps
  const section = SECTIONS[step];
  const isLast = step === totalSteps - 1;

  return (
    <div className="intake">
      <div className={`intake-progress${showProgress ? ' intake-progress-visible' : ''}`}>
        <div className="intake-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="intake-container">
        <div className="intake-brand">Andy Santamaria</div>
        <div className="intake-step" key={step}>
          <div className="intake-section-num">{section.number}</div>
          <h2 className="intake-section-title">{section.title}</h2>
          <p className="intake-section-intro">{section.intro}</p>
          <div className="intake-section-rule" />

          {section.questions.map(renderQuestion)}

          <nav className="intake-nav">
            <button className="intake-back" onClick={() => goTo(step === 0 ? -1 : step - 1)}>
              <span className="intake-back-arrow">&larr;</span> Back
            </button>
            <span className="intake-counter">{NUMERALS[step]} of {NUMERALS[totalSteps - 1]}</span>
            {isLast ? (
              <button
                className={`intake-submit${submitting ? ' intake-submit-sending' : ''}`}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Sending' : 'Send to Andy'}
              </button>
            ) : (
              <button className="intake-next" onClick={() => goTo(step + 1)}>
                Continue <span className="intake-next-arrow">&rarr;</span>
              </button>
            )}
          </nav>
          {error && <p className="intake-error">Something went wrong. Please try again.</p>}
        </div>
      </div>
    </div>
  );
}
