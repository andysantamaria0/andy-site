import { createClient } from '@supabase/supabase-js';
import { buildDisambiguationMessage } from './tripDetection';
import { acceptReplyHtml, disambiguationReplyHtml } from '../email/templates';

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
    } else {
      // SMS/MMS/voice — reply via Twilio
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
 * Send a disambiguation message asking "which trip?" via the appropriate channel.
 */
export async function sendDisambiguationReply(channel, replyTo, candidates) {
  const message = buildDisambiguationMessage(candidates);

  try {
    if (channel === 'email') {
      await sendEmailReply(replyTo, 'Which trip?', message, disambiguationReplyHtml(candidates));
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
 * Send an SMS via Twilio API.
 */
async function sendSmsReply(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  const params = new URLSearchParams({ From: from, To: to, Body: body });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio error ${res.status}: ${err}`);
  }
}
