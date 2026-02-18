import AuthButton from '../../../components/trips/AuthButton';

export const metadata = {
  title: 'Vialoure — Sign In',
};

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;

  return (
    <div className="v-login">
      <div className="v-login-brand">
        <svg viewBox="0 0 120 48" className="v-login-mark" aria-hidden="true">
          <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
        </svg>
        <div className="v-login-logo">Vialoure</div>
        <div className="v-login-tagline">For Andy's Friends</div>
      </div>
      <div className="v-login-card">
        <p>Sign in to plan trips with your crew — shared calendars, expenses, and logistics in one place.</p>
        <AuthButton next={next} />
      </div>
    </div>
  );
}
