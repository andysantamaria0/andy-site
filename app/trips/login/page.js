import AuthButton from '../../../components/trips/AuthButton';

export const metadata = {
  title: 'Vialoure — Sign In',
};

export default function LoginPage() {
  return (
    <div className="v-login">
      <div className="v-login-brand">
        <div className="v-login-logo">Vialoure</div>
        <div className="v-login-tagline">For Friends</div>
      </div>
      <div className="v-login-card">
        <p>Sign in to plan trips with your crew — shared calendars, expenses, and logistics in one place.</p>
        <AuthButton />
      </div>
    </div>
  );
}
