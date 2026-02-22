import { createClient } from '../../../../../../lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();
const URL_REGEX = /^https?:\/\//i;

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
        suggestion_type: 'logistics',
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

  // URL: fetch the page and use AI to extract structured data
  const page = await fetchPageText(input);

  let title = input;
  let subtitle = null;
  let suggestionType = 'logistics';
  let priceAmount = null;
  let priceCurrency = null;
  let priceNote = null;
  let payload = {};

  if (page && (page.title || page.meta || page.text)) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Extract structured information from this travel listing page. The URL is: ${input}

PAGE TITLE: ${page.title}

META TAGS:
${page.meta}

PAGE TEXT (truncated):
${page.text}

Respond with ONLY valid JSON:
{
  "title": "short, clean name of the property/restaurant/activity (NOT the full page title)",
  "subtitle": "brief description — location, key features, capacity, etc (1 line max)",
  "type": "logistics|event|expense — use logistics for accommodation/transport, event for restaurants/activities",
  "price_amount": 123.45 or null,
  "price_currency": "USD" or "EUR" etc, or null,
  "price_note": "per night" or "per person" or "total" etc, or null,
  "accommodation_type": "villa|apartment|hotel|hostel|other" or null,
  "dates": "any check-in/check-out or event dates mentioned, or null",
  "location": "city/area if mentioned, or null"
}`
        }],
      });

      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

      title = parsed.title || page.title || input;
      subtitle = parsed.subtitle || null;
      suggestionType = parsed.type || 'logistics';
      priceAmount = parsed.price_amount || null;
      priceCurrency = parsed.price_currency || null;
      priceNote = parsed.price_note || null;
      payload = {
        accommodation_type: parsed.accommodation_type,
        dates: parsed.dates,
        location: parsed.location,
      };
    } catch {
      // AI failed — fall back to page title
      title = page.title || input;
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
