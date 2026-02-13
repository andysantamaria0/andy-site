import { createClient } from '@supabase/supabase-js';
import { buildParsePrompt } from '../../../lib/utils/parsePrompt';
import { detectTrip, buildDisambiguationMessage } from '../../../lib/utils/tripDetection';
import { sendDisambiguationReply, sendAckReply, sendOwnerAutoAcceptNotification } from '../../../lib/utils/sendReply';
import { tryAutoAccept } from '../../../lib/utils/autoAccept';
import { checkFeature } from '../../../lib/features';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();

/**
 * Strip quoted reply content from email body text.
 * Handles Gmail ("On ... wrote:"), Outlook ("From: ..."), and line-quoted ("> ") formats.
 */
function stripQuotedReply(text) {
  if (!text) return '';
  // Gmail-style: "On <date> <name> wrote:"
  const gmailIdx = text.search(/\nOn .+ wrote:\s*\n/i);
  if (gmailIdx !== -1) return text.slice(0, gmailIdx).trim();
  // Outlook-style: "From: ..." or "-----Original Message-----"
  const outlookIdx = text.search(/\n-{2,}.*(?:Original Message|Forwarded message)/i);
  if (outlookIdx !== -1) return text.slice(0, outlookIdx).trim();
  // Line-quoted: first line starting with ">"
  const quoteIdx = text.search(/\n>/);
  if (quoteIdx !== -1) return text.slice(0, quoteIdx).trim();
  return text;
}

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

const CONCIERGE_ADDRESS = 'concierge@andysantamaria.com';

export async function POST(request) {
  if (!(await checkFeature('concierge_email'))) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
  }

  // Authenticate via query param
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token || token !== process.env.POSTMARK_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();

  // Extract fields from webhook payload
  const {
    From: fromEmail,
    FromName: fromName,
    To: toAddress,
    CcAddresses: ccAddresses,
    Subject: subject,
    TextBody: textBody,
    HtmlBody: htmlBody,
    StrippedTextReply: strippedReply,
    MessageID: messageId,
    Attachments: attachments,
  } = payload;

  // Collect all recipient addresses
  const recipient = typeof toAddress === 'string'
    ? toAddress.toLowerCase().trim()
    : (toAddress || '').toString().toLowerCase().trim();

  const allAddresses = [recipient, ...(ccAddresses || []).map((a) => a.toLowerCase().trim())];

  // Use service role client (no user session in webhooks)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Dedup by message_id (before expensive operations)
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

  // Detect trip: concierge address uses sender-based detection, trip-*@ uses legacy lookup
  const isConcierge = allAddresses.some((a) => a === CONCIERGE_ADDRESS);
  const legacyAddress = allAddresses.find((a) => /^trip-[a-z0-9]+@/i.test(a));

  const parseText = (textBody || '').trim() || stripHtml(htmlBody || '');
  // For trip detection, use only the user's own text (no quoted thread)
  // to avoid matching trip codes from quoted disambiguation emails.
  // Priority: Postmark's StrippedTextReply > manual quote stripping > full body
  const stripped = (strippedReply || '').trim() || stripQuotedReply(parseText);
  // Include subject in detection text so trip codes/keywords in subject line work
  const detectionText = [subject, stripped].filter(Boolean).join(' ');

  const detection = await detectTrip(supabase, {
    senderEmail: fromEmail,
    messageText: isConcierge ? detectionText : null,
    toAddress: !isConcierge ? (legacyAddress || recipient) : null,
  });

  if (detection.ambiguous) {
    // Send disambiguation reply via email
    await sendDisambiguationReply('email', fromEmail, detection.candidates);
    return NextResponse.json({ status: 'disambiguation_sent' });
  }

  const trip = detection.trip;
  if (!trip) {
    return NextResponse.json({ status: 'no_matching_trip' });
  }

  // Get trip members for context
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

  // Use detected member or find by email
  const senderMember = detection.member || (fromEmail
    ? (members || []).find((m) => {
        const email = (m.profiles?.email || m.email || '').toLowerCase();
        return email === fromEmail.toLowerCase().trim();
      })
    : null);

  // Build attachment content blocks for Claude (images + PDFs)
  const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
  const attachmentBlocks = [];

  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      const contentType = (att.ContentType || '').toLowerCase();
      const data = att.Content; // base64-encoded
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

      const responseText = message.content?.[0]?.text || '';
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        parsedData = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
      } else {
        parsedData = JSON.parse(responseText);
      }
    } catch (e) {
      parseError = e.message || 'Failed to parse email content';
    }
  } else {
    parseError = 'No text or attachment content found in email';
  }

  // Store in inbound_emails
  const { data: inserted, error: insertError } = await supabase
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
      channel: 'email',
      reply_to: fromEmail || null,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Failed to insert inbound email:', insertError);
    return NextResponse.json({ status: 'insert_error', error: insertError.message }, { status: 500 });
  }

  // Try auto-accept for low-risk items
  let autoResult = null;
  if (parsedData && senderMember?.id && inserted) {
    autoResult = await tryAutoAccept(supabase, {
      inboundEmailId: inserted.id,
      tripId: trip.id,
      parsedData,
      senderMemberId: senderMember.id,
      members,
    });

    if (autoResult.autoApplied) {
      // Notify trip owner (unless the sender IS the owner)
      const owner = (members || []).find((m) => m.role === 'owner');
      if (owner && owner.id !== senderMember.id) {
        const ownerEmail = owner.profiles?.email || owner.email;
        const senderName = senderMember.profiles?.display_name || senderMember.display_name || senderMember.profiles?.email || fromEmail;
        await sendOwnerAutoAcceptNotification({
          ownerEmail,
          tripName: trip.name,
          senderName,
          summary: autoResult.summary,
        });
      }
    }
  }

  // Send acknowledgment reply (customized based on auto-accept result)
  if (autoResult?.fullyApplied) {
    await sendAckReply({
      channel: 'email',
      replyTo: fromEmail,
      tripName: trip.name,
      subject,
      textOverride: `Updated for ${trip.name}: ${autoResult.summary}`,
    });
  } else if (autoResult?.autoApplied) {
    await sendAckReply({
      channel: 'email',
      replyTo: fromEmail,
      tripName: trip.name,
      subject,
      textOverride: `Updated for ${trip.name}: ${autoResult.summary}. The rest is in the inbox for the trip organizer.`,
    });
  } else {
    await sendAckReply({
      channel: 'email',
      replyTo: fromEmail,
      tripName: trip.name,
      summary: parsedData?.summary || null,
      subject,
    });
  }

  return NextResponse.json({ status: 'ok' });
}
