import Link from 'next/link';

export const metadata = {
  title: 'Vialoure — Invite Only',
};

export default function NotInvitedPage() {
  return (
    <div className="v-login">
      <div className="v-login-brand">
        <svg viewBox="0 0 120 48" className="v-login-mark" aria-hidden="true">
          <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
        </svg>
        <div className="v-login-logo">Vialoure</div>
        <div className="v-login-tagline">Invite Only</div>
      </div>
      <div className="v-login-card">
        <p>
          Vialoure is a private trip planner for Andy's friends.
          If you think you should have access, ask Andy for an invite.
        </p>
        <Link href="/trips/login" className="v-btn v-btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
