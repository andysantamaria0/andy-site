import './invite.css';
import InviteLetter from '../../components/InviteLetter';

export const metadata = {
  title: 'Vialoure — You\u2019re Invited',
  description: 'Andy invited you to Vialoure, a private trip planner for friends.',
};

export default async function InvitePage({ searchParams }) {
  const params = await searchParams;
  const email = params?.email || '';

  return <InviteLetter defaultEmail={email} />;
}
