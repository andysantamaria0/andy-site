'use client';

import { formatTime } from '../../lib/utils/dates';
import { getMemberDisplayInfo } from '../../lib/utils/members';
import MemberAvatar from './MemberAvatar';

const CATEGORY_EMOJI = {
  dinner_out: { emoji: '\uD83C\uDF7D\uFE0F', label: 'Dinner out' },
  dinner_home: { emoji: '\uD83C\uDF73', label: 'Dinner in' },
  activity: { emoji: '\uD83C\uDFAF', label: 'Activity' },
  outing: { emoji: '\uD83D\uDEB6', label: 'Outing' },
  party: { emoji: '\uD83C\uDF89', label: 'Party' },
  sightseeing: { emoji: '\uD83C\uDFDB\uFE0F', label: 'Sightseeing' },
  other: { emoji: '\uD83D\uDCCC', label: 'Event' },
};

export { CATEGORY_EMOJI };

export default function EventCard({ event, members, onClick }) {
  const cat = CATEGORY_EMOJI[event.category] || CATEGORY_EMOJI.other;
  const attendeeIds = (event.event_attendees || []).map((a) => a.member_id);
  const attendeeMembers = attendeeIds.length > 0
    ? members.filter((m) => attendeeIds.includes(m.id))
    : [];
  const isEveryone = attendeeIds.length === 0;

  return (
    <div className="v-event-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick?.()}>
      <div className="v-event-card-emoji">{cat.emoji}</div>
      <div className="v-event-card-body">
        <div className="v-event-card-title">{event.title}</div>
        <div className="v-event-card-meta">
          {event.start_time && (
            <span>{formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}</span>
          )}
          {event.location && <span>{event.location}</span>}
        </div>
      </div>
      {event.has_cost && event.cost_amount && (
        <div className="v-event-card-cost">
          <span>{event.cost_amount}{event.cost_currency ? ` ${event.cost_currency}` : ''}</span>
          {event.use_friends_card && <span className="v-event-card-fc">FC</span>}
        </div>
      )}
      <div className="v-event-card-attendees">
        {isEveryone ? (
          <span className="v-event-card-everyone">Everyone</span>
        ) : (
          attendeeMembers.slice(0, 4).map((m) => {
            const info = getMemberDisplayInfo(m);
            return (
              <MemberAvatar
                key={m.id}
                member={{
                  display_name: info.name,
                  avatar_url: info.avatarUrl,
                  email: info.email,
                  color: info.color,
                }}
                size={24}
              />
            );
          })
        )}
        {attendeeMembers.length > 4 && (
          <span className="v-event-card-more">+{attendeeMembers.length - 4}</span>
        )}
      </div>
    </div>
  );
}
