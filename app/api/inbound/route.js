import { createClient } from '@supabase/supabase-js';
import { buildParsePrompt } from '../../../lib/utils/parsePrompt';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request) {
  // Authenticate via query param
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token || token !== process.env.POSTMARK_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();

  // Extract fields from Postmark inbound webhook
  const {
    From: fromEmail,
    FromName: fromName,
    To: toAddress,
    Subject: subject,
    TextBody: textBody,
    HtmlBody: htmlBody,
    MessageID: messageId,
    Attachments: attachments,
  } = payload;

  // Determine the recipient address (first To address)
  const recipient = typeof toAddress === 'string'
    ? toAddress.toLowerCase().trim()
    : (toAddress || '').toString().toLowerCase().trim();

  // Use service role client (no user session in webhooks)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Look up trip by inbound_email
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('inbound_email', recipient)
    .single();

  if (!trip) {
    // No matching trip — return 200 so Postmark doesn't retry
    return NextResponse.json({ status: 'no_matching_trip' });
  }

  // Dedup by message_id
  if (messageId) {
    const { data: existing } = await supabase
      .from('inbound_emails')
      .select('id')
      .eq('message_id', messageId)
      .single();

    if (existing) {
      return NextResponse.json({ status: 'duplicate' });
    }
  }

  // Get trip members to identify sender and build context
  const { data: members } = await supabase
    .from('trip_members')
    .select(`
      *,
      profiles:user_id (
        display_name,
        avatar_url,
        email
      )
    `)
    .eq('trip_id', trip.id);

  // Try to match sender email to a trip member
  const senderEmail = (fromEmail || '').toLowerCase().trim();
  const senderMember = senderEmail
    ? (members || []).find((m) => {
        const email = (m.profiles?.email || m.email || '').toLowerCase();
        return email === senderEmail;
      })
    : null;

  // Build text for parsing (prefer text body, fall back to stripped HTML)
  const parseText = (textBody || '').trim() || stripHtml(htmlBody || '');

  // Build attachment content blocks for Claude (images + PDFs)
  const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
  const attachmentBlocks = [];

  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      const contentType = (att.ContentType || '').toLowerCase();
      const data = att.Content; // base64-encoded by Postmark
      if (!data) continue;

      if (IMAGE_TYPES.has(contentType)) {
        attachmentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: contentType, data },
        });
      } else if (contentType === 'application/pdf') {
        attachmentBlocks.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data },
        });
      }
    }
  }

  const hasContent = parseText || attachmentBlocks.length > 0;

  // Parse with Claude
  let parsedData = null;
  let parseError = null;

  if (hasContent) {
    try {
      const memberContext = (members || []).map((m) => ({
        member_id: m.id,
        user_id: m.user_id,
        name: m.profiles?.display_name || m.display_name || m.profiles?.email || m.email || 'Unknown',
        email: m.profiles?.email || m.email,
        is_manual: !m.user_id,
        current_stay_start: m.stay_start,
        current_stay_end: m.stay_end,
      }));

      const promptText = buildParsePrompt({
        trip,
        memberContext,
        text: parseText || '(see attached files)',
      });

      // Build content array: attachments first, then the text prompt
      const content = [
        ...attachmentBlocks,
        { type: 'text', text: promptText },
      ];

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content }],
      });

      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsedData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (e) {
      parseError = e.message || 'Failed to parse email content';
    }
  } else {
    parseError = 'No text or attachment content found in email';
  }

  // Store in inbound_emails
  const { error: insertError } = await supabase
    .from('inbound_emails')
    .insert({
      trip_id: trip.id,
      from_email: fromEmail || null,
      from_name: fromName || null,
      subject: subject || null,
      text_body: textBody || null,
      html_body: htmlBody || null,
      message_id: messageId || null,
      raw_payload: payload,
      sender_member_id: senderMember?.id || null,
      sender_profile_id: senderMember?.user_id || null,
      parsed_data: parsedData,
      parse_error: parseError,
      status: 'pending',
    });

  if (insertError) {
    console.error('Failed to insert inbound email:', insertError);
    // Still return 200 to prevent Postmark retries
    return NextResponse.json({ status: 'insert_error', error: insertError.message });
  }

  return NextResponse.json({ status: 'ok' });
}
