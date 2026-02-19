'use client';

import { useState, useEffect } from 'react';

const EXPLORATIONS = [
  { id: 'patina', num: '1', label: 'Patina', subtitle: 'Cinematic Nostalgia', src: '/stand/design/02-patina.html' },
  { id: 'varsity', num: '2', label: 'Varsity', subtitle: 'Heritage Athletic', src: '/stand/design/01-varsity.html' },
  { id: 'carbon', num: '3', label: 'Carbon', subtitle: 'Minimalism', src: '/stand/design/03-carbon.html' },
  { id: 'arcade', num: '4', label: 'Arcade', subtitle: 'Gaming with Soul', src: '/stand/design/04-arcade.html' },
];

export default function DesignExplorations() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    function handleKey(e) {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4) setActive(num - 1);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#111', overflow: 'hidden' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', gap: 2, padding: '12px 20px',
        background: '#1a1a1a', borderBottom: '1px solid #333', flexShrink: 0,
      }}>
        <span style={{
          fontWeight: 700, fontSize: 13, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: '#666', marginRight: 24, whiteSpace: 'nowrap',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          Stand Explorations
        </span>

        {EXPLORATIONS.map((exp, i) => (
          <button
            key={exp.id}
            onClick={() => setActive(i)}
            style={{
              background: active === i ? '#2a2a2a' : 'transparent',
              border: active === i ? '1px solid #444' : '1px solid transparent',
              color: active === i ? '#fff' : '#888',
              fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 8,
              cursor: 'pointer', whiteSpace: 'nowrap',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{
              display: 'inline-block', fontSize: 10, fontWeight: 700,
              background: active === i ? '#df0000' : '#333',
              color: active === i ? '#fff' : '#999',
              width: 18, height: 18, lineHeight: '18px', textAlign: 'center',
              borderRadius: 4, marginRight: 6, verticalAlign: 'middle',
              transition: 'all 0.2s ease',
            }}>
              {exp.num}
            </span>
            {exp.label}
            <span style={{
              color: active === i ? '#777' : '#555',
              fontSize: 11, marginLeft: 4,
            }}>
              {exp.subtitle}
            </span>
          </button>
        ))}

        <span style={{
          marginLeft: 'auto', fontSize: 11, color: '#444', whiteSpace: 'nowrap',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          <kbd style={kbdStyle}>1</kbd> <kbd style={kbdStyle}>2</kbd> <kbd style={kbdStyle}>3</kbd> <kbd style={kbdStyle}>4</kbd> to switch
        </span>
      </nav>

      <div style={{ flex: 1, position: 'relative' }}>
        {EXPLORATIONS.map((exp, i) => (
          <iframe
            key={exp.id}
            src={exp.src}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              border: 'none',
              opacity: active === i ? 1 : 0,
              pointerEvents: active === i ? 'auto' : 'none',
              transition: 'opacity 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

const kbdStyle = {
  display: 'inline-block', background: '#252525', border: '1px solid #333',
  borderRadius: 3, padding: '1px 5px', fontFamily: 'inherit', fontSize: 10, color: '#666',
};
