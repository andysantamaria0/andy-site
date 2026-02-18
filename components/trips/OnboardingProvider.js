'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { ONBOARDING_STEPS } from '../../lib/onboarding/steps';

const OnboardingContext = createContext(null);

export function useOnboarding() {
  return useContext(OnboardingContext);
}

export default function OnboardingProvider({ children, tripId, tripName, memberId, onboardingCompletedAt }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [completed, setCompleted] = useState(!!onboardingCompletedAt);

  const currentStep = ONBOARDING_STEPS[stepIndex] || null;

  // Load mute preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('v-onboarding-muted');
    if (stored === 'true') setMuted(true);
  }, []);

  // Auto-start tour for new members
  useEffect(() => {
    if (completed) return;
    const shouldStart = searchParams.get('onboard') === '1' || !onboardingCompletedAt;
    if (shouldStart && memberId) {
      setActive(true);
    }
  }, [completed, onboardingCompletedAt, searchParams, memberId]);

  const navigateToTab = useCallback((tab) => {
    if (!tab || tab === 'overview') {
      router.push(`/trips/${tripId}`);
    } else {
      router.push(`/trips/${tripId}/${tab}`);
    }
  }, [router, tripId]);

  const nextStep = useCallback(() => {
    const nextIdx = stepIndex + 1;
    if (nextIdx >= ONBOARDING_STEPS.length) {
      completeTour();
      return;
    }
    setStepIndex(nextIdx);
    const nextStepObj = ONBOARDING_STEPS[nextIdx];
    if (nextStepObj.tab !== null) {
      navigateToTab(nextStepObj.tab);
    }
  }, [stepIndex, navigateToTab]);

  const skipTour = useCallback(() => {
    completeTour();
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem('v-onboarding-muted', String(next));
      return next;
    });
  }, []);

  async function completeTour() {
    setActive(false);
    setCompleted(true);
    if (memberId) {
      await supabase
        .from('trip_members')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', memberId);
    }
  }

  const steps = ONBOARDING_STEPS;

  // Resolve message template
  const resolvedMessage = currentStep?.message.replace('{tripName}', tripName || 'your trip') || '';

  return (
    <OnboardingContext.Provider
      value={{
        active,
        currentStep,
        stepIndex,
        totalSteps: steps.length,
        resolvedMessage,
        muted,
        completed,
        tripName,
        tripId,
        nextStep,
        skipTour,
        toggleMute,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}
