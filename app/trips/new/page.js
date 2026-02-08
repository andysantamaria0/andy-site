import CreateTripForm from './CreateTripForm';

export const metadata = {
  title: 'Vialoure — New Trip',
};

export default function NewTripPage() {
  return (
    <div className="v-page">
      <a href="/trips" className="v-back">&larr; Back to trips</a>
      <h1 className="v-page-title" style={{ marginBottom: 32 }}>Create a Trip</h1>
      <CreateTripForm />
    </div>
  );
}
