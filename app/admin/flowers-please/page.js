import { redirect } from 'next/navigation';
import { isOwner, report } from '../../../lib/flowers-watch/server.mjs';
import './activity.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Flowers Please — viewing activity', robots: { index: false, follow: false, nocache: true } };
const when = value => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' }).format(new Date(value));
const seconds = value => `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`;

export default async function ViewingActivity() {
  if (!await isOwner()) redirect('/trips/login');
  const data = await report();
  const sessions = data.sessions.filter(s => !s.test), unlocks = data.unlocks.filter(s => !s.test);
  return <main className="fp-activity">
    <header><p className="fp-activity-eyebrow">Private screening</p><h1>Pip viewing activity</h1><p><a href="/flowers-please/watch">Open the screening</a> · <a href="/admin/flowers-please">Refresh report</a></p></header>
    <p>Activity is attributed to the password used. A shared password does not verify someone’s identity. Times below are New York time.</p>
    <section className="fp-activity-cards" aria-label="Recipients">{data.recipients.map(recipient => {
      const views = sessions.filter(s => s.recipientId === recipient.id);
      const entries = unlocks.filter(s => s.recipientId === recipient.id);
      return <article key={recipient.id}><h2>{recipient.label}</h2><p>{recipient.active ? 'Access enabled' : 'Access disabled'}</p><dl><div><dt>Password uses</dt><dd>{entries.length}</dd></div><div><dt>Viewing sessions</dt><dd>{views.length}</dd></div><div><dt>Started playback</dt><dd>{views.filter(v => v.started).length}</dd></div><div><dt>Watched at least 90%</dt><dd>{views.filter(v => v.completed).length}</dd></div><div><dt>Furthest viewed</dt><dd>{Math.max(0, ...views.map(v => v.percent))}%</dd></div></dl></article>;
    })}</section>
    <h2>Viewing sessions</h2>
    {sessions.length ? <div className="fp-activity-table"><table><thead><tr><th>Password label</th><th>Opened / last activity</th><th>Playback</th><th>Session</th></tr></thead><tbody>{sessions.map(s => <tr key={s.id}><td><strong>{s.label}</strong></td><td>{when(s.at)}<br /><small>Last: {when(s.lastSeen)}</small></td><td><strong>{s.percent}% viewed</strong><br />{s.started ? `${seconds(s.uniqueSeconds)} of unique footage` : 'Opened; no playback yet'}<br /><small>{seconds(s.activeSeconds)} playing in a visible tab · Last event: {s.lastEvent}</small></td><td>{s.device}<br /><small>{[s.country, s.region].filter(Boolean).join(' · ') || 'Location unavailable'}<br />{s.referrer ? `From ${s.referrer}` : 'Direct / no referrer'}<br />Session {s.id.slice(0, 8)}</small></td></tr>)}</tbody></table></div> : <p className="fp-activity-empty">No viewer sessions yet.</p>}
    <h2>Password uses</h2>
    {unlocks.length ? <div className="fp-activity-table"><table><thead><tr><th>Password label</th><th>Time</th><th>Device</th></tr></thead><tbody>{unlocks.map(u => <tr key={u.id}><td>{u.label}</td><td>{when(u.at)}</td><td>{u.device}</td></tr>)}</tbody></table></div> : <p className="fp-activity-empty">No viewer password uses yet.</p>}
    <p className="fp-activity-note">Shows the latest {data.limit} sessions and password uses. “Viewed” measures unique video portions that played, including playback in a background tab. Visible-tab time is tracked separately. These measures indicate playback, not attention. Test sessions are excluded; all events remain in private storage. Raw passwords and IP addresses are not stored in the activity records.</p>
  </main>;
}
