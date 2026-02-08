import Link from 'next/link';
import { formatDateRange } from '../../lib/utils/dates';

export default function TripCard({ trip, memberCount }) {
  return (
    <Link href={`/trips/${trip.id}`} className="v-trip-card">
      <div className="v-trip-card-destination">{trip.destination}</div>
      <div className="v-trip-card-name">{trip.name}</div>
      {trip.start_date && trip.end_date && (
        <div className="v-trip-card-dates">
          {formatDateRange(trip.start_date, trip.end_date)}
        </div>
      )}
      <div className="v-trip-card-members">
        <span className="v-trip-card-count">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
      </div>
    </Link>
  );
}
