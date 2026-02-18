'use client';

import { useEffect, useRef } from 'react';

export default function OnboardingAudio({ audioUrl, muted, stepId }) {
  const audioRef = useRef(null);
  const prevStepRef = useRef(null);

  useEffect(() => {
    if (!audioUrl || muted || stepId === prevStepRef.current) return;
    prevStepRef.current = stepId;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.play().catch(() => {
      // Autoplay blocked — that's fine, user can unmute
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl, muted, stepId]);

  // Handle mute toggle mid-playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  // Preload next step's audio (static only)
  useEffect(() => {
    if (!audioUrl || audioUrl.startsWith('/api/')) return;
    // Simple preload via link
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = audioUrl;
    link.as = 'audio';
    document.head.appendChild(link);
    return () => link.remove();
  }, [audioUrl]);

  return null;
}
