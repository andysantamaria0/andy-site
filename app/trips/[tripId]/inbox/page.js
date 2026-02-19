import { redirect } from 'next/navigation';

export default async function InboxPage({ params }) {
  const { tripId } = await params;
  redirect(`/trips/${tripId}/concierge`);
}
