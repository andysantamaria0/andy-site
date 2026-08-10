import './unlock.css';
import UnlockForm from './UnlockForm';
import { safeStandTarget } from '../../../lib/standAuth';

export const metadata = {
  title: 'Stand — Password Required',
  description: 'This work is shared privately.',
  robots: { index: false, follow: false },
};

export default async function UnlockPage({ searchParams }) {
  const params = await searchParams;

  return <UnlockForm next={safeStandTarget(params?.next)} />;
}
