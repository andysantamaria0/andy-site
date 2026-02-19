'use client';

import { useState } from 'react';

export default function HeaderAvatar({ src }) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) return null;

  return (
    <img
      src={src}
      alt=""
      className="v-header-avatar"
      onError={() => setBroken(true)}
    />
  );
}
