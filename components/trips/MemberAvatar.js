'use client';

import { useState } from 'react';

export default function MemberAvatar({ member, size = 40 }) {
  const [imgError, setImgError] = useState(false);

  const initials = (member.display_name || member.email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (member.avatar_url && !imgError) {
    return (
      <img
        src={member.avatar_url}
        alt={member.display_name || 'Member'}
        className="v-member-avatar"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className="v-member-avatar-placeholder"
      style={{
        width: size,
        height: size,
        backgroundColor: member.color || '#4A35D7',
        fontSize: size * 0.4,
      }}
    >
      {initials}
    </div>
  );
}
