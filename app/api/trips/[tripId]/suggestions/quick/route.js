import { createClient } from '../../../../../../lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();
const URL_REGEX = /^https?:\/\//i;
const MAPS_SHORT_RE = /^https?:\/\/maps\.app\.goo\.gl\//i;
const MAPS_PLACE_RE = /\/maps\/place\/([^/@]+)/;

// Follow redirects on short URLs (e.g. maps.app.goo.gl) to get the real URL
async function resolveRedirects(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    return res.url || url;
  } catch {
    return url;
  }
}

// Extract place name from Google Maps URL path: /maps/place/Place+Name/
function extractMapsPlaceName(url) {
  const match = url.match(MAPS_PLACE_RE);
  if (!match) return null;
  return decodeURIComponent(match[1].replace(/\+/g, ' '));
}

async function fetchPageText(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let html = '';
    while (html.length < 100000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel();

    // Strip script/style tags, extract text content + meta tags
    const metaTags = [];
    const metaRegex = /<meta[^>]+(property|name|itemprop)=["']([^"']+)["'][^>]+content=["']([^"']+)["']/gi;
    let match;
    while ((match = metaRegex.exec(html)) !== null) {
      metaTags.push(`${match[2]}: ${match[3]}`);
    }
    // Also try reversed order (content before property)
    const metaRegex2 = /<meta[^>]+content=["']([^"']+)["'][^>]+(property|name|itemprop)=["']([^"']+)["']/gi;
    while ((match = metaRegex2.exec(html)) !== null) {
      metaTags.push(`${match[3]}: ${match[1]}`);
    }

    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '';

    // Strip tags for body text
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : html;
    const text = bodyHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);

    return {
      title: titleTag.trim(),
      meta: metaTags.join('\n'),
      text,
    };
  } catch {
    return null;
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

  // Non-URL: just create a simple suggestion with the text as title
  if (!isUrl) {
    const { data, error } = await supabase
      .from('suggestions')
      .insert({
        trip_id: tripId,
        leg_id: leg_id || null,
        suggestion_type: 'event',
        title: input,
        payload: {},
        source: 'manual',
        created_by: user.id,
      })
      .select('*, leg:leg_id(destination)')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  // Resolve short-URL redirects (e.g. maps.app.goo.gl → full google.com/maps URL)
  let resolvedUrl = input;
  if (MAPS_SHORT_RE.test(input)) {
    resolvedUrl = await resolveRedirects(input);
  }

  // Extract place name from Google Maps URLs
  const mapsPlaceName = extractMapsPlaceName(resolvedUrl);

  // Fetch page content
  const page = await fetchPageText(input);

  let title = mapsPlaceName || input;
  let subtitle = null;
  let suggestionType = 'event';
  let priceAmount = null;
  let priceCurrency = null;
  let priceNote = null;
  let payload = {};

  // Build context for the AI — include place name from URL if page content is sparse
  const hasPageContent = page && (page.title || page.meta || page.text);
  const pageIsGeneric = !page?.title || /^google maps$/i.test(page?.title?.trim());

  const extraContext = mapsPlaceName
    ? `\nPLACE NAME (from URL): ${mapsPlaceName}`
    : '';

  if (hasPageContent || mapsPlaceName) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Extract structured information from this travel-related link. The URL is: ${resolvedUrl}
${extraContext}
${!pageIsGeneric ? `\nPAGE TITLE: ${page?.title || ''}` : ''}
${!pageIsGeneric && page?.meta ? `\nMETA TAGS:\n${page.meta}` : ''}
${!pageIsGeneric && page?.text ? `\nPAGE TEXT (truncated):\n${page.text}` : ''}

Respond with ONLY valid JSON:
{
  "title": "short, clean name of the place/property/restaurant/activity (NOT the full page title or URL)",
  "subtitle": "brief description — location, key features, capacity, etc (1 line max)",
  "type": "event|logistics|expense — classify as:
    event = restaurants, bars, cafes, attractions, tours, activities, museums, shows, beaches, parks, landmarks, things to do
    logistics = hotels, apartments, villas, flights, ferries, trains, car rentals, airports, transit
    expense = shopping, tickets with a clear price, fees
    When in doubt, use event.",
  "price_amount": 123.45 or null,
  "price_currency": "USD" or "EUR" etc, or null,
  "price_note": "per night" or "per person" or "total" etc, or null,
  "accommodation_type": "villa|apartment|hotel|hostel|other" or null (only if logistics/accommodation),
  "dates": "any check-in/check-out or event dates mentioned, or null",
  "location": "city/area if mentioned, or null"
}`
        }],
      });

      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

      title = parsed.title || mapsPlaceName || page?.title || input;
      subtitle = parsed.subtitle || null;
      suggestionType = parsed.type || 'event';
      priceAmount = parsed.price_amount || null;
      priceCurrency = parsed.price_currency || null;
      priceNote = parsed.price_note || null;
      payload = {
        accommodation_type: parsed.accommodation_type,
        dates: parsed.dates,
        location: parsed.location,
      };
    } catch {
      // AI failed — fall back to place name or page title
      title = mapsPlaceName || page?.title || input;
    }
  }

  const { data, error } = await supabase
    .from('suggestions')
    .insert({
      trip_id: tripId,
      leg_id: leg_id || null,
      suggestion_type: suggestionType,
      title,
      subtitle,
      url: input,
      price_amount: priceAmount,
      price_currency: priceCurrency,
      price_note: priceNote,
      payload,
      source: 'manual',
      created_by: user.id,
    })
    .select('*, leg:leg_id(destination)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
