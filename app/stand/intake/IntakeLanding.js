'use client';

import { useState, useCallback } from 'react';
import IntakeConcierge from './IntakeConcierge';
import IntakeForm from './IntakeForm';
import { unlockAudio } from './useConciergeAudio';

export default function IntakeLanding() {
  const [mode, setMode] = useState(null); // null = landing, 'guided', 'freeform', 'form'

  const startConcierge = useCallback((m) => {
    unlockAudio(); // unlock during user gesture so TTS can play
    setMode(m);
  }, []);

  if (mode === 'guided') return <IntakeConcierge mode="guided" />;
  if (mode === 'freeform') return <IntakeConcierge mode="freeform" />;
  if (mode === 'form') return <IntakeForm />;

  return (
    <div className="intake-landing">
      <div className="intake-landing-brand">Andy Santamaria</div>
      <div className="intake-landing-heading">
        <div className="intake-landing-for">For Lauren</div>
        <h1 className="intake-landing-title">Stand Intake Questionnaire</h1>
        <p className="intake-landing-subtitle">
          I&apos;ve pre-filled most of this from our calls. You just need to review, refine, and fill in a few gaps. Pick how you&apos;d like to do it.
        </p>
      </div>
      <div className="intake-landing-cards">
        <button className="intake-landing-card intake-landing-card-recommended" onClick={() => startConcierge('guided')}>
          <span className="intake-landing-badge">Recommended</span>
          <span className="intake-landing-card-title">&ldquo;Walk me through it&rdquo;</span>
          <span className="intake-landing-card-desc">
            The concierge reads each question aloud and walks you through one at a time. Just talk.
          </span>
          <span className="intake-landing-card-arrow">Get started &rarr;</span>
        </button>
        <button className="intake-landing-card" onClick={() => startConcierge('freeform')}>
          <span className="intake-landing-card-title">&ldquo;Let me talk&rdquo;</span>
          <span className="intake-landing-card-desc">
            Chat or speak freely. The AI fills in fields as you go &mdash; like a conversation instead of a form.
          </span>
          <span className="intake-landing-card-arrow">Start chatting &rarr;</span>
        </button>
        <button className="intake-landing-card" onClick={() => setMode('form')}>
          <span className="intake-landing-card-title">&ldquo;Just the form&rdquo;</span>
          <span className="intake-landing-card-desc">
            Step through each section one at a time. Review and edit the pre-filled answers directly.
          </span>
          <span className="intake-landing-card-arrow">Open form &rarr;</span>
        </button>
      </div>
    </div>
  );
}
