'use client';

import { useState, useEffect, useRef } from 'react';
import { useOnboarding } from './OnboardingProvider';
import OnboardingAudio from './OnboardingAudio';

export default function OnboardingPanel() {
  const ctx = useOnboarding();
  if (!ctx?.active) return null;

  return <OnboardingPanelInner />;
}

function OnboardingPanelInner() {
  const {
    currentStep,
    stepIndex,
    totalSteps,
    resolvedMessage,
    muted,
    nextStep,
    skipTour,
    toggleMute,
    tripName,
    tripId,
  } = useOnboarding();

  const [displayedText, setDisplayedText] = useState('');
  const [typing, setTyping] = useState(true);
  const intervalRef = useRef(null);

  // Typewriter effect
  useEffect(() => {
    setDisplayedText('');
    setTyping(true);
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      if (i >= resolvedMessage.length) {
        setDisplayedText(resolvedMessage);
        setTyping(false);
        clearInterval(intervalRef.current);
      } else {
        setDisplayedText(resolvedMessage.slice(0, i));
      }
    }, 25);
    return () => clearInterval(intervalRef.current);
  }, [resolvedMessage]);

  const isLastStep = stepIndex === totalSteps - 1;

  // Build audio URL — all steps use dynamic TTS with server-side caching
  const audioParams = new URLSearchParams({ stepId: currentStep?.id || '' });
  if (currentStep?.id === 'welcome') {
    audioParams.set('tripName', tripName || '');
  }
  const audioUrl = currentStep ? `/api/onboarding/step-audio?${audioParams}` : null;

  return (
    <div className="v-onboarding-panel">
      <div className="v-onboarding-header">
        <div className="v-onboarding-avatar">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="14" fill="var(--v-royal)" />
            <text x="14" y="18" textAnchor="middle" fill="var(--v-pearl)" fontSize="14" fontFamily="Fraunces, serif" fontWeight="700">V</text>
          </svg>
        </div>
        <span className="v-onboarding-name">Vialoure Concierge</span>
        <button className="v-onboarding-mute" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.36 2.18" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
      </div>

      <div className="v-onboarding-body">
        <div className="v-onboarding-bubble">
          {displayedText}
          {typing && <span className="v-onboarding-cursor">|</span>}
        </div>
      </div>

      <div className="v-onboarding-footer">
        <div className="v-onboarding-progress">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`v-onboarding-dot${i === stepIndex ? ' active' : ''}${i < stepIndex ? ' done' : ''}`}
            />
          ))}
        </div>
        <div className="v-onboarding-actions">
          {!isLastStep && (
            <button className="v-btn v-btn-ghost" onClick={skipTour} style={{ fontSize: '0.75rem' }}>
              Skip Tour
            </button>
          )}
          <button className="v-btn v-btn-primary" onClick={nextStep} style={{ fontSize: '0.8125rem' }}>
            {isLastStep ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>

      <OnboardingAudio audioUrl={audioUrl} muted={muted} stepId={currentStep?.id} />
    </div>
  );
}
