'use client';

import { useState } from 'react';
import IntakeConcierge from './IntakeConcierge';
import IntakeForm from './IntakeForm';

export default function IntakeLanding() {
  const [mode, setMode] = useState(null); // null = landing, 'concierge', 'form'

  if (mode === 'concierge') return <IntakeConcierge />;
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
        <button className="intake-landing-card intake-landing-card-recommended" onClick={() => setMode('concierge')}>
          <span className="intake-landing-badge">Recommended</span>
          <span className="intake-landing-card-title">&ldquo;The cool way&rdquo;</span>
          <span className="intake-landing-card-desc">
            Talk or type to an AI assistant that fills in the form live. Like having a conversation instead of filling out boxes.
          </span>
          <span className="intake-landing-card-arrow">Get started &rarr;</span>
        </button>
        <button className="intake-landing-card" onClick={() => setMode('form')}>
          <span className="intake-landing-card-title">&ldquo;The old-fashioned way&rdquo;</span>
          <span className="intake-landing-card-desc">
            Step through each section one at a time. Review and edit the pre-filled answers directly.
          </span>
          <span className="intake-landing-card-arrow">Open form &rarr;</span>
        </button>
      </div>
    </div>
  );
}
