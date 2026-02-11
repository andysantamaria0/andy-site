'use client';

import { formatTime } from '../../lib/utils/dates';
import MemberAvatar from './MemberAvatar';

const TYPE_EMOJI = {
  flight: '✈️',
  train: '🚆',
  bus: '🚌',
  car: '🚗',
  accommodation: '🏠',
  other: '📦',
};

export default function LogisticsCard({ entry, member }) {
  const emoji = TYPE_EMOJI[entry.type] || TYPE_EMOJI.other;
  const details = entry.details || {};
  const profile = member?.profiles;

  function getTimeDisplay() {
    if (!entry.start_time) return null;
    try {
      const d = new Date(entry.start_time);
      const h = d.getHours();
      const m = d.getMinutes();
      const suffix = h >= 12 ? 'PM' : 'AM';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
    } catch {
      return null;
    }
  }

  const time = getTimeDisplay();

  return (
    <div className="v-logistics-card">
      <div className="v-logistics-card-emoji">{emoji}</div>
      <div className="v-logistics-card-body">
        <div className="v-logistics-card-title">{entry.title}</div>
        <div className="v-logistics-card-meta">
          {time && <span>{time}</span>}
          {details.flight_number && <span style={{ fontFamily: "'Special Elite', cursive", letterSpacing: '0.05em' }}>Flight {details.flight_number}</span>}
          {details.carrier && <span>{details.carrier}</span>}
          {details.driver && <span>Driver: {details.driver}</span>}
          {details.vehicle && <span>{details.vehicle}</span>}
          {member?.luggage_count > 0 && <span>{member.luggage_count} bag{member.luggage_count !== 1 ? 's' : ''}</span>}
        </div>
      </div>
      {profile && (
        <div className="v-logistics-card-member">
          <MemberAvatar
            member={{
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              email: profile.email,
              color: member.color,
            }}
            size={24}
          />
        </div>
      )}
    </div>
  );
}
