'use client';

import { useState, useEffect } from 'react';
import MemberAvatar from './MemberAvatar';

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = d - now;
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 0) {
    const ago = Math.abs(diffMin);
    if (ago < 60) return `started ${ago} min ago`;
    return `started ${Math.floor(ago / 60)}h ago`;
  }
  if (diffMin < 60) return `in ${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
}

function MemberAvatars({ members }) {
  if (!members || members.length === 0) return null;
  const show = members.slice(0, 3);
  const extra = members.length - 3;

  return (
    <div className="v-happening-avatars">
      {show.map((m, i) => (
        <MemberAvatar
          key={i}
          member={{ display_name: m.name, avatar_url: m.avatarUrl, color: m.color }}
          size={22}
        />
      ))}
      {extra > 0 && <span className="v-happening-avatar-more">+{extra}</span>}
    </div>
  );
}

function FlightProgressBar({ flightStatus }) {
  if (!flightStatus) return null;
  const { departureCity, arrivalCity, progress, delay, status } = flightStatus;
  const isDelayed = delay > 0;

  return (
    <div className="v-happening-flight">
      <div className="v-happening-flight-cities">
        <span>{departureCity}</span>
        <span>{arrivalCity}</span>
      </div>
      <div className="v-happening-flight-track">
        <div
          className={`v-happening-flight-fill${isDelayed ? ' v-happening-flight-delayed' : ''}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        <div
          className="v-happening-flight-plane"
          style={{ left: `${Math.min(progress, 100)}%` }}
        >
          ✈
        </div>
      </div>
      <div className="v-happening-flight-meta">
        <span>{progress}%</span>
        {status === 'en_route' && flightStatus.estimatedArrival && (
          <span>ETA {formatTime(flightStatus.estimatedArrival)}</span>
        )}
        {isDelayed && <span className="v-happening-flight-delay">+{delay}min</span>}
      </div>
    </div>
  );
}

/**
 * Hook: polls /api/flights/[flightNumber] every 60s for en_route flights.
 * Returns live flightStatus that overrides the server-rendered one.
 */
function useFlightPolling(flightStatus) {
  const [live, setLive] = useState(null);
  const flightNumber = flightStatus?.flightNumber;
  const initialStatus = flightStatus?.status;

  useEffect(() => {
    if (!flightNumber) return;
    // Only poll for en_route or scheduled flights
    if (initialStatus !== 'en_route' && initialStatus !== 'scheduled') return;

    let stopped = false;

    async function poll() {
      const date = new Date().toISOString().split('T')[0];
      try {
        const res = await fetch(`/api/flights/${encodeURIComponent(flightNumber)}?date=${date}`);
        if (!res.ok) return;
        const data = await res.json();
        if (stopped) return;
        setLive({
          flightNumber: data.flightNumber,
          departureCity: data.departureAirport || flightStatus.departureCity,
          arrivalCity: data.arrivalAirport || flightStatus.arrivalCity,
          status: data.status || 'unknown',
          progress: data.progressPercent || 0,
          estimatedArrival: data.estimatedArrival || data.scheduledArrival,
          delay: data.delayMinutes || 0,
          gate: data.gateDeparture || flightStatus.gate,
          terminal: data.terminalDeparture || flightStatus.terminal,
        });
        // Stop polling once landed or arrived
        if (data.status === 'landed' || data.status === 'arrived') {
          stopped = true;
        }
      } catch {
        // Silently fail — will retry next interval
      }
    }

    poll(); // Initial fetch
    const id = setInterval(poll, 60000);
    return () => { stopped = true; clearInterval(id); };
  }, [flightNumber, initialStatus]);

  return live;
}

export default function HappeningNowItem({ item, index = 0 }) {
  // Re-render every 60s to update relative time labels
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const style = { animationDelay: `${index * 0.05}s` };

  // Poll for live flight data when en_route
  const liveFlightStatus = useFlightPolling(item.type === 'flight' ? item.flightStatus : null);
  const activeFlightStatus = liveFlightStatus || item.flightStatus;

  if (item.type === 'flight') {
    return (
      <div className="v-happening-item v-happening-item-enter" style={style}>
        <div className="v-happening-item-row">
          <span className="v-happening-item-emoji">{item.emoji}</span>
          <div className="v-happening-item-body">
            <div className="v-happening-item-title">{item.title}</div>
            <FlightProgressBar flightStatus={activeFlightStatus} />
          </div>
          <MemberAvatars members={item.members} />
        </div>
      </div>
    );
  }

  if (item.type === 'arrival' || item.type === 'departure') {
    return (
      <div className="v-happening-item v-happening-item-enter" style={style}>
        <div className="v-happening-item-row">
          <span className="v-happening-item-emoji">{item.emoji}</span>
          <div className="v-happening-item-body">
            <div className="v-happening-item-title">{item.title}</div>
          </div>
          <MemberAvatars members={item.members} />
        </div>
      </div>
    );
  }

  // Default: event or logistics
  const timeLabel = item.status === 'in_progress'
    ? formatTime(item.startTime)
    : formatRelativeTime(item.startTime);

  return (
    <div className="v-happening-item v-happening-item-enter" style={style}>
      <div className="v-happening-item-row">
        <span className="v-happening-item-emoji">{item.emoji}</span>
        <div className="v-happening-item-body">
          <div className="v-happening-item-title">{item.title}</div>
          <div className="v-happening-item-sub">
            {timeLabel && <span>{timeLabel}</span>}
            {timeLabel && item.subtitle && <span> · </span>}
            {item.subtitle && <span>{item.subtitle}</span>}
          </div>
        </div>
        <MemberAvatars members={item.members} />
      </div>
    </div>
  );
}
