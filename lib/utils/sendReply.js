import { createClient } from '@supabase/supabase-js';
import { buildDisambiguationMessage } from './tripDetection';
import { acceptReplyHtml, disambiguationReplyHtml, ackReplyHtml, autoAcceptNotificationHtml } from '../email/templates';

const CONCIERGE_EMAIL = 'concierge@andysantamaria.com';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Send a confirmation reply after the trip owner accepts an inbox item.
 */
export async function sendAcceptReply(inboundEmail, tripName, parsedResult) {
  const channel = inboundEmail.channel || 'email';
  const replyTo = inboundEmail.reply_to || inboundEmail.from_email;
  if (!replyTo) return;

  const summary = inboundEmail.parsed_data?.summary || 'your update';
  const body = `Added to ${tripName}: ${summary}`;

  try {
    if (channel === 'email') {
      await sendEmailReply(
        replyTo,
        `Re: ${inboundEmail.subject || 'Your message'}`,
        body,
        acceptReplyHtml(tripName, summary)
      );
    } else if (channel === 'whatsapp') {
      await sendWhatsAppReply(replyTo, body);
    } else {
      // SMS/MMS/voice — reply via Telnyx
      await sendSmsReply(replyTo, body);
    }

    // Mark reply as sent
    const supabase = getSupabase();
    await supabase
      .from('inbound_emails')
      .update({ reply_sent: true, reply_sent_at: new Date().toISOString() })
      .eq('id', inboundEmail.id);
  } catch (e) {
    console.error('Failed to send accept reply:', e);
  }
}

/**
 * Send an acknowledgment reply immediately after receiving an inbound message.
 */
export async function sendAckReply({ channel, replyTo, tripId, tripName, summary, subject, textOverride }) {
  if (!replyTo) return;

  const text = textOverride
    ? textOverride
    : summary
      ? `Got your message for ${tripName}: ${summary}. It's in the inbox for the trip organizer to review.`
      : `Got your message for ${tripName}. It's in the inbox for the trip organizer to review.`;

  try {
    if (channel === 'email') {
      await sendEmailReply(
        replyTo,
        `Re: ${subject || 'Your message'}`,
        text,
        ackReplyHtml(tripName, textOverride || summary, tripId)
      );
    } else if (channel === 'whatsapp') {
      await sendWhatsAppReply(replyTo, text);
    } else {
      await sendSmsReply(replyTo, text);
    }
  } catch (e) {
    console.error('Failed to send ack reply:', e);
  }
}

/**
 * Notify the trip owner via email when items are auto-applied.
 */
export async function sendOwnerAutoAcceptNotification({ ownerEmail, tripName, senderName, summary }) {
  if (!ownerEmail) return;

  try {
    await sendEmailReply(
      ownerEmail,
      `Auto-applied: ${senderName} updated ${tripName}`,
      `${senderName} sent an update for ${tripName} that was automatically applied: ${summary}`,
      autoAcceptNotificationHtml(tripName, senderName, summary)
    );
  } catch (e) {
    console.error('Failed to send auto-accept owner notification:', e);
  }
}

/**
 * Send a disambiguation message asking "which trip?" via the appropriate channel.
 */
export async function sendDisambiguationReply(channel, replyTo, candidates) {
  const message = buildDisambiguationMessage(candidates);

  try {
    if (channel === 'email') {
      await sendEmailReply(replyTo, 'Which trip?', message, disambiguationReplyHtml(candidates));
    } else if (channel === 'whatsapp') {
      await sendWhatsAppReply(replyTo, message);
    } else {
      await sendSmsReply(replyTo, message);
    }
  } catch (e) {
    console.error('Failed to send disambiguation reply:', e);
  }
}

/**
 * Send an email via Resend API.
 */
async function sendEmailReply(to, subject, text, html) {
  const payload = {
    from: `Vialoure Concierge <${CONCIERGE_EMAIL}>`,
    to: [to],
    subject,
    text,
  };
  if (html) payload.html = html;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
}

/**
 * Send an SMS via Telnyx API.
 */
async function sendSmsReply(to, body) {
  const apiKey = process.env.TELNYX_API_KEY;
  const from = process.env.TELNYX_PHONE_NUMBER;

  const payload = { from, to, text: body };
  const profileId = process.env.TELNYX_MESSAGING_PROFILE_ID;
  if (profileId) payload.messaging_profile_id = profileId;

  const res = await fetch('https://api.telnyx.com/v2/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telnyx error ${res.status}: ${err}`);
  }
}

/**
 * Send a WhatsApp message via Telnyx API.
 */
async function sendWhatsAppReply(to, body) {
  const apiKey = process.env.TELNYX_API_KEY;
  const from = process.env.TELNYX_WHATSAPP_NUMBER;

  const payload = { from, to, text: body };
  const profileId = process.env.TELNYX_MESSAGING_PROFILE_ID;
  if (profileId) payload.messaging_profile_id = profileId;

  const res = await fetch('https://api.telnyx.com/v2/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telnyx WhatsApp error ${res.status}: ${err}`);
  }
}
