import Link from 'next/link';
import { formatDateRange } from '../../lib/utils/dates';

export default function TripCard({ trip, memberCount }) {
  const hasCover = !!trip.cover_image_url;

  return (
    <Link
      href={`/trips/${trip.id}`}
      className={`v-trip-card${hasCover ? ' v-trip-card--cover' : ''}`}
      style={hasCover ? {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%), url(${trip.cover_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
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
