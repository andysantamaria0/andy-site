import { createClient } from '../../../../../../lib/supabase/server';
import { NextResponse } from 'next/server';

const URL_REGEX = /^https?:\/\//i;

// Domain → suggestion_type mapping
const DOMAIN_TYPES = {
  'airbnb': 'logistics',
  'booking.com': 'logistics',
  'vrbo': 'logistics',
  'hotels.com': 'logistics',
  'hostelworld': 'logistics',
  'agoda': 'logistics',
  'expedia': 'logistics',
  'skyscanner': 'logistics',
  'kayak': 'logistics',
  'google.com/travel': 'logistics',
  'tripadvisor': 'event',
  'yelp': 'event',
  'thefork': 'event',
  'opentable': 'event',
  'resy': 'event',
  'viator': 'event',
  'getyourguide': 'event',
  'klook': 'event',
};

function guessTypeFromDomain(hostname, pathname) {
  const domain = hostname.toLowerCase();
  for (const [key, type] of Object.entries(DOMAIN_TYPES)) {
    if (domain.includes(key)) return type;
  }
  // Google Maps links are often for restaurants/activities
  if (domain.includes('google') && (pathname.includes('/maps') || pathname.includes('/place'))) {
    return 'event';
  }
  return 'logistics';
}

function cleanTitle(raw) {
  if (!raw) return null;
  // Remove common suffixes like " | Airbnb", " - Booking.com", " — TripAdvisor"
  return raw
    .replace(/\s*[|–—-]\s*(Airbnb|Booking\.com|Vrbo|Hotels\.com|TripAdvisor|Yelp|Viator|GetYourGuide|Expedia|Google Maps|OpenTable|Resy|TheFork).*$/i, '')
    .replace(/\s*[-–—]\s*$/, '')
    .trim()
    .slice(0, 200);
}

async function fetchUrlMeta(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Vialoure/1.0)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) return {};

    // Only read first 50KB to find meta tags
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let html = '';
    while (html.length < 50000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel();

    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1];
    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)?.[1];
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];

    return {
      title: cleanTitle(ogTitle) || cleanTitle(titleTag) || null,
      description: ogDesc?.slice(0, 300) || null,
    };
  } catch {
    return {};
  }
}

export async function POST(request, { params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { text, leg_id } = await request.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const input = text.trim();
  const isUrl = URL_REGEX.test(input);

  let title = input;
  let subtitle = null;
  let url = null;
  let suggestionType = 'logistics';

  if (isUrl) {
    url = input;
    try {
      const parsed = new URL(input);
      suggestionType = guessTypeFromDomain(parsed.hostname, parsed.pathname);
      // Fallback title from domain
      title = parsed.hostname.replace(/^www\./, '');
    } catch {
      title = input;
    }

    // Try to fetch real title
    const meta = await fetchUrlMeta(input);
    if (meta.title) title = meta.title;
    if (meta.description) subtitle = meta.description;
  }

  const { data, error } = await supabase
    .from('suggestions')
    .insert({
      trip_id: tripId,
      leg_id: leg_id || null,
      suggestion_type: suggestionType,
      title,
      subtitle,
      url,
      payload: {},
      source: 'manual',
      created_by: user.id,
    })
    .select('*, leg:leg_id(destination)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
