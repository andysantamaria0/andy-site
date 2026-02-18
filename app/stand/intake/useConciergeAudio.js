'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// Module-level AudioContext — once created during a user gesture,
// it stays unlocked for the lifetime of the page. Much more reliable
// than HTMLAudioElement for autoplay.
let audioCtx = null;

/**
 * Call during a user gesture (e.g. button click) to create and
 * unlock the AudioContext before the concierge component mounts.
 */
export function unlockAudio() {
  if (typeof window === 'undefined') return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Play a tiny silent buffer to fully unlock
  const buf = audioCtx.createBuffer(1, 1, 22050);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.connect(audioCtx.destination);
  src.start();
}

function getCtx() {
  if (!audioCtx && typeof window !== 'undefined') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export default function useConciergeAudio() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const queueRef = useRef([]);
  const playingRef = useRef(false);
  const unmountedRef = useRef(false);
  const sourceRef = useRef(null);

  useEffect(() => {
    unmountedRef.current = false; // reset on (re)mount — Strict Mode sets true then remounts
    return () => {
      unmountedRef.current = true;
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch {}
        sourceRef.current = null;
      }
      queueRef.current = [];
    };
  }, []);

  const processQueue = useCallback(async () => {
    if (playingRef.current || unmountedRef.current) return;
    if (queueRef.current.length === 0) {
      setIsSpeaking(false);
      return;
    }

    playingRef.current = true;
    setIsSpeaking(true);

    const text = queueRef.current.shift();

    try {
      const res = await fetch('/api/stand/intake/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok || unmountedRef.current) {
        playingRef.current = false;
        processQueue();
        return;
      }

      const arrayBuffer = await res.arrayBuffer();
      if (unmountedRef.current) return;

      const ctx = getCtx();
      if (ctx.state === 'suspended') await ctx.resume();

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      if (unmountedRef.current) return;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      sourceRef.current = source;

      await new Promise((resolve) => {
        source.onended = resolve;
        source.start();
      });

      sourceRef.current = null;
    } catch {
      // TTS failed — skip and continue
    }

    playingRef.current = false;
    if (!unmountedRef.current) processQueue();
  }, []);

  const playAudio = useCallback((text) => {
    if (!text || muted) return;
    queueRef.current.push(text);
    processQueue();
  }, [muted, processQueue]);

  const stop = useCallback(() => {
    queueRef.current = [];
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch {}
      sourceRef.current = null;
    }
    playingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      if (!prev) {
        queueRef.current = [];
        if (sourceRef.current) {
          try { sourceRef.current.stop(); } catch {}
          sourceRef.current = null;
        }
        playingRef.current = false;
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  return { playAudio, stop, isSpeaking, muted, toggleMute };
}
