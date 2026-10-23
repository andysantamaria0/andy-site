'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

function useViewingActivity(videoRef, unlocked) {
  useEffect(() => {
    const video = videoRef.current;
    if (!unlocked || !video) return;
    let disposed = false, session, seq = 0, activeSeconds = 0, hasPlayed = false;
    let previous = performance.now(), lastPosition = video.currentTime, queue = Promise.resolve();
    const pending = [];
    function sample() {
      const now = performance.now(), elapsed = Math.min(2, (now - previous) / 1000);
      if (!video.paused && !video.seeking && video.currentTime > lastPosition && document.visibilityState === 'visible') activeSeconds += elapsed;
      previous = now; lastPosition = video.currentTime;
    }
    function send(type, beacon = false) {
      if (disposed) return;
      sample();
      if (type === 'play') hasPlayed = true;
      const payload = { type, seq: ++seq, position: video.currentTime, playedRanges: Array.from({ length: video.played.length }, (_, i) => [video.played.start(i), video.played.end(i)]), activeSeconds, hasPlayed, muted: video.muted, playbackRate: video.playbackRate, visible: document.visibilityState === 'visible', error: video.error?.message };
      if (!session) { pending.push(payload); return; }
      transmit(payload, beacon);
    }
    function transmit(payload, beacon = false) {
      const body = JSON.stringify({ ...payload, token: session.token });
      if (beacon && navigator.sendBeacon('/api/flowers-watch/events', new Blob([body], { type: 'application/json' }))) return;
      queue = queue.catch(() => {}).then(async () => {
        const response = await fetch('/api/flowers-watch/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
        if (!response.ok && response.status >= 500) await fetch('/api/flowers-watch/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
      }).catch(() => {});
    }
    let visitorId;
    try { visitorId = localStorage.getItem('flowers-watch-visitor') || crypto.randomUUID(); localStorage.setItem('flowers-watch-visitor', visitorId); } catch { visitorId = crypto.randomUUID(); }
    fetch('/api/flowers-watch/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visitorId, referrer: document.referrer }) })
      .then(async response => { if (!response.ok) throw new Error('Session unavailable'); return response.json(); })
      .then(value => { if (disposed) return; session = value; pending.forEach(item => transmit(item)); pending.length = 0; send('ready'); })
      .catch(() => {});
    const handlers = { play: () => send('play'), pause: () => send('pause'), seeked: () => send('seek'), ended: () => send('ended'), error: () => send('error'), timeupdate: sample };
    Object.entries(handlers).forEach(([event, fn]) => video.addEventListener(event, fn));
    const heartbeat = setInterval(() => { if (!video.paused) send('progress'); }, 15000);
    const onVisibility = () => send('visibility', document.visibilityState === 'hidden');
    const onLeave = () => send('leave', true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onLeave);
    return () => {
      send('leave', true); disposed = true; clearInterval(heartbeat);
      Object.entries(handlers).forEach(([event, fn]) => video.removeEventListener(event, fn));
      document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('pagehide', onLeave);
    };
  }, [videoRef, unlocked]);
}

export default function WatchClient({ unlocked, chapters, duration }) {
  const router = useRouter(), videoRef = useRef(null);
  const [password, setPassword] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useViewingActivity(videoRef, unlocked);
  async function unlock(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/flowers-watch/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to unlock the video.');
      setPassword(''); router.refresh();
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }
  const roundedDuration = Math.round(duration);
  const time = `${Math.floor(roundedDuration / 60)}:${String(roundedDuration % 60).padStart(2, '0')}`;
  return <main className="fp-watch">
    <div className="fp-watch-inner">
      <a className="fp-back" href="/">Andrew Santamaria</a>
      {!unlocked ? <section className="fp-gate">
        <p className="fp-eyebrow">Private screening</p>
        <h1>A closer look.</h1>
        <p>Enter the password I shared with you to watch the walkthrough.</p>
        <form onSubmit={unlock}>
          <label htmlFor="screening-password">Password</label>
          <div className="fp-password-row"><input id="screening-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /><button disabled={busy}>{busy ? 'Opening…' : 'Watch the film'}</button></div>
          {error && <p className="fp-error" role="alert">{error}</p>}
        </form>
        <p className="fp-small">Private viewing · Visits and playback activity are recorded.</p>
      </section> : <>
        <header><p className="fp-eyebrow">Product &amp; model behavior · {time}</p><h1>Pip for Flowers Please</h1><p className="fp-intro">The customer experience, the florist handoff, and the behavior behind both.</p></header>
        <video ref={videoRef} className="fp-player" controls playsInline preload="metadata" crossOrigin="anonymous" controlsList="nodownload noremoteplayback" disablePictureInPicture disableRemotePlayback onContextMenu={event => event.preventDefault()} poster="/api/flowers-watch/media/poster" aria-label="Pip for Flowers Please product walkthrough">
          <source src="/api/flowers-watch/media/video" type="video/mp4" />
          <track src="/api/flowers-watch/media/captions" label="English" kind="captions" srcLang="en" default />
        </video>
        <nav className="fp-chapters" aria-label="Video chapters">{chapters.map(chapter => <button key={chapter.id} onClick={() => { const video = videoRef.current; video.currentTime = chapter.start; video.play().catch(() => {}); }}>{chapter.title}</button>)}</nav>
        <p className="fp-small">Customer footage uses an iPhone view. The featured demo call and order confirmation are real. Narration uses my ElevenLabs voice clone.</p>
        <p className="fp-small fp-private-note">Private viewing · Visits and playback activity are recorded.</p>
      </>}
    </div>
  </main>;
}
