import { cookies } from 'next/headers';
import { COOKIE } from '../../../lib/flowers-watch/core.mjs';
import { accessFor } from '../../../lib/flowers-watch/server.mjs';
import WatchClient from './WatchClient';
import './watch.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Private screening — Andrew Santamaria', description: 'A private product walkthrough.', robots: { index: false, follow: false, nocache: true } };

export default async function WatchPage() {
  const access = await accessFor((await cookies()).get(COOKIE)?.value);
  return <WatchClient unlocked={!!access} chapters={access ? access.config.media.chapters : []} duration={access?.config.media.duration || 0} />;
}
