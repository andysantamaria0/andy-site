import { createClient } from '@supabase/supabase-js';
import { buildParsePrompt } from '../../../../lib/utils/parsePrompt';
import { detectTripForWhatsApp, buildDisambiguationMessage } from '../../../../lib/utils/tripDetection';
import { sendAckReply, sendDisambiguationReply, sendOwnerAutoAcceptNotification } from '../../../../lib/utils/sendReply';
import { tryAutoAccept } from '../../../../lib/utils/autoAccept';
import { validateTelnyxSignature } from '../../../../lib/utils/telnyxAuth';
import { saveMediaToStorage } from '../../../../lib/utils/mediaStorage';
import { checkFeature } from '../../../../lib/features';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();

function ok() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request) {
  if (!(await checkFeature('concierge_whatsapp'))) {
    return ok();
  }

  const rawBody = await request.text();
  let webhookData;
  try {
    webhookData = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate Telnyx signature
  const signature = request.headers.get('telnyx-signature-ed25519') || '';
  const timestamp = request.headers.get('telnyx-timestamp') || '';

  if (process.env.TELNYX_PUBLIC_KEY && !validateTelnyxSignature(
    process.env.TELNYX_PUBLIC_KEY.trim(), signature, timestamp, rawBody
  )) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const payload = webhookData?.data?.payload;
  if (!payload) return ok();

  const from = payload.from?.phone_number;
  const messageBody = payload.text || '';
  const messageId = payload.id;
  const media = payload.media || [];
  const senderName = payload.from?.display_name || null;

  if (!from) return ok();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Dedup by message ID
  if (messageId) {
    const { data: existing } = await supabase
      .from('inbound_emails')
      .select('id')
      .eq('twilio_message_sid', messageId)
      .single();

    if (existing) {
      return ok();
    }
  }

  // Detect trip
  const detection = await detectTripForWhatsApp(supabase, {
    senderPhone: from,
    messageText: messageBody,
  });

  // Handle "switch to" command
  if (detection.switched) {
    sendAckReply({ channel: 'whatsapp', replyTo: from, tripName: detection.trip.name, textOverride: `Switched to ${detection.trip.name}. Send your message now!` }).catch(console.error);
    return ok();
  }

  if (detection.ambiguous) {
    sendDisambiguationReply('whatsapp', from, detection.candidates).catch(console.error);
    return ok();
  }

  if (!detection.trip) {
    sendAckReply({ channel: 'whatsapp', replyTo: from, textOverride: "I couldn't find a trip for your number. Ask the trip organizer to add your phone number." }).catch(console.error);
    return ok();
  }

  const trip = detection.trip;

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

  // Build content blocks for Claude
  const contentBlocks = [];
  const mediaBuffers = [];

  // Fetch media attachments — Telnyx media URLs are public
  for (const item of media) {
    const mediaUrl = item.url;
    const mediaType = (item.content_type || '').toLowerCase();
    if (!mediaUrl) continue;

    try {
      const res = await fetch(mediaUrl);
      if (!res.ok) continue;

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const data = buffer.toString('base64');

      if (mediaType.startsWith('image/')) {
        contentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data },
        });
        mediaBuffers.push({ buffer, mimeType: mediaType });
      } else if (mediaType === 'application/pdf') {
        contentBlocks.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data },
        });
      } else if (mediaType.startsWith('audio/')) {
        contentBlocks.push({
          type: 'document',
          source: { type: 'base64', media_type: mediaType, data },
        });
      }
    } catch (e) {
      console.error('Failed to fetch media:', e);
    }
  }

  // Add text body
  const text = messageBody.trim();
  if (text) {
    contentBlocks.push({ type: 'text', text });
  }

  const hasContent = contentBlocks.length > 0;

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
        text: text || '(see attached media)',
      });

      const content = [
        ...contentBlocks.filter((b) => b.type !== 'text'),
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
      parseError = e.message || 'Failed to parse message content';
    }
  } else {
    parseError = 'No text or media content found';
  }

  // Store in inbound_emails
  const channel = 'whatsapp';
  const { data: inserted, error: insertError } = await supabase
    .from('inbound_emails')
    .insert({
      trip_id: trip.id,
      from_email: from,
      from_name: senderName || null,
      subject: text ? text.slice(0, 60) : (media.length > 0 ? 'WhatsApp Media' : null),
      text_body: text || null,
      message_id: messageId || null,
      raw_payload: webhookData,
      sender_member_id: detection.member?.id || null,
      sender_profile_id: detection.member?.user_id || null,
      parsed_data: parsedData,
      parse_error: parseError,
      status: 'pending',
      channel,
      reply_to: from,
      twilio_message_sid: messageId || null,
      whatsapp_group_id: null,
      whatsapp_group_name: null,
      whatsapp_sender_name: senderName,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Failed to insert WhatsApp inbound:', insertError);
    return ok();
  }

  // Persist photos to storage
  if (mediaBuffers.length > 0 && inserted) {
    for (const m of mediaBuffers) {
      await saveMediaToStorage(supabase, {
        tripId: trip.id,
        buffer: m.buffer,
        mimeType: m.mimeType,
        channel: 'whatsapp',
        sourceMessageId: inserted.id,
        memberId: detection.member?.id || null,
      });
    }
  }

  // Try auto-accept for low-risk items
  let ackMsg;
  if (parsedData && detection.member?.id && inserted) {
    const autoResult = await tryAutoAccept(supabase, {
      inboundEmailId: inserted.id,
      tripId: trip.id,
      parsedData,
      senderMemberId: detection.member.id,
      members,
    });

    if (autoResult.autoApplied) {
      const owner = (members || []).find((m) => m.role === 'owner');
      if (owner && owner.id !== detection.member.id) {
        const ownerEmail = owner.profiles?.email || owner.email;
        const memberName = detection.member.profiles?.display_name || detection.member.display_name || senderName || from;
        await sendOwnerAutoAcceptNotification({
          ownerEmail,
          tripName: trip.name,
          senderName: memberName,
          summary: autoResult.summary,
        });
      }
    }

    if (autoResult.fullyApplied) {
      ackMsg = `Updated for ${trip.name}: ${autoResult.summary}`;
    } else if (autoResult.autoApplied) {
      ackMsg = `Updated for ${trip.name}: ${autoResult.summary}. The rest is in the inbox.`;
    } else {
      ackMsg = parsedData?.summary
        ? `Got it for ${trip.name}: ${parsedData.summary}`
        : `Got your message for ${trip.name}. It's in the inbox for the trip organizer.`;
    }
  } else {
    ackMsg = parsedData?.summary
      ? `Got it for ${trip.name}: ${parsedData.summary}`
      : `Got your message for ${trip.name}. It's in the inbox for the trip organizer.`;
  }

  // Send ack via separate API call (fire-and-forget)
  sendAckReply({ channel: 'whatsapp', replyTo: from, tripId: trip.id, tripName: trip.name, summary: parsedData?.summary, textOverride: ackMsg }).catch(console.error);

  return ok();
}
