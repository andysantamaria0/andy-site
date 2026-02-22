import { emailLayout } from './template';

const FONT_STACK = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/**
 * HTML email for trip acceptance confirmation.
 */
export function acceptReplyHtml(tripName, summary) {
  const body = `
    <h2 style="font-family:serif;font-size:22px;font-weight:700;color:#0A1628;margin:0 0 16px;">Added to your trip</h2>
    <p style="font-family:${FONT_STACK};font-size:15px;color:#333;line-height:1.6;margin:0 0 20px;">
      We&rsquo;ve added the following to <strong>${escapeHtml(tripName)}</strong>:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:16px;background-color:#F8F7F4;border-left:3px solid #C4A77D;border-radius:2px;">
          <span style="font-family:${FONT_STACK};font-size:14px;color:#0A1628;">${escapeHtml(summary)}</span>
        </td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
      <tr>
        <td align="center" style="background-color:#4A35D7;border-radius:2px;">
          <a href="https://andysantamaria.com/trips" target="_blank" style="display:inline-block;padding:12px 28px;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:#F0EDE6;text-decoration:none;">View Trip</a>
        </td>
      </tr>
    </table>
  `;
  return emailLayout(body);
}

/**
 * HTML email for disambiguation prompt.
 */
export function disambiguationReplyHtml(candidates) {
  const optionRows = candidates
    .map(
      (c) =>
        `<tr>
          <td style="padding:10px 16px;border-bottom:1px solid #eee;">
            <span style="font-family:${FONT_STACK};font-size:14px;color:#0A1628;font-weight:600;">${escapeHtml(c.name)}</span>
            ${c.destination ? `<br/><span style="font-family:${FONT_STACK};font-size:12px;color:#7B8FA8;">${escapeHtml(c.destination)}</span>` : ''}
            <br/><span style="font-family:${FONT_STACK};font-size:12px;color:#C4A77D;">Reply "${escapeHtml(c.trip_code)}"</span>
          </td>
        </tr>`
    )
    .join('');

  const body = `
    <h2 style="font-family:serif;font-size:22px;font-weight:700;color:#0A1628;margin:0 0 16px;">Which trip?</h2>
    <p style="font-family:${FONT_STACK};font-size:15px;color:#333;line-height:1.6;margin:0 0 20px;">
      We found multiple trips that could match. Reply with the code for the right one:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #eee;border-radius:2px;">
      ${optionRows}
    </table>
  `;
  return emailLayout(body);
}

/**
 * HTML email acknowledging receipt of an inbound message.
 */
export function ackReplyHtml(tripName, summary, tripId) {
  const summaryBlock = summary
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
        <tr>
          <td style="padding:16px;background-color:#F8F7F4;border-left:3px solid #C4A77D;border-radius:2px;">
            <span style="font-family:${FONT_STACK};font-size:14px;color:#0A1628;">${escapeHtml(summary)}</span>
          </td>
        </tr>
      </table>`
    : '';

  const body = `
    <h2 style="font-family:serif;font-size:22px;font-weight:700;color:#0A1628;margin:0 0 16px;">Received</h2>
    <p style="font-family:${FONT_STACK};font-size:15px;color:#333;line-height:1.6;margin:0 0 4px;">
      Got your message for <strong>${escapeHtml(tripName)}</strong>. It&rsquo;s in the inbox and ready for the trip organizer to review.
    </p>
    ${summaryBlock}
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
      <tr>
        <td align="center" style="background-color:#4A35D7;border-radius:2px;">
          <a href="https://andysantamaria.com/trips${tripId ? `/${tripId}/inbox` : ''}" target="_blank" style="display:inline-block;padding:12px 28px;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:#F0EDE6;text-decoration:none;">View Inbox</a>
        </td>
      </tr>
    </table>
  `;
  return emailLayout(body);
}

/**
 * HTML email notifying the trip owner that items were auto-applied.
 */
export function autoAcceptNotificationHtml(tripName, senderName, summary) {
  const body = `
    <h2 style="font-family:serif;font-size:22px;font-weight:700;color:#0A1628;margin:0 0 16px;">Auto-applied update</h2>
    <p style="font-family:${FONT_STACK};font-size:15px;color:#333;line-height:1.6;margin:0 0 20px;">
      <strong>${escapeHtml(senderName)}</strong> sent an update for <strong>${escapeHtml(tripName)}</strong> that was automatically applied:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:16px;background-color:#F8F7F4;border-left:3px solid #C4A77D;border-radius:2px;">
          <span style="font-family:${FONT_STACK};font-size:14px;color:#0A1628;">${escapeHtml(summary)}</span>
        </td>
      </tr>
    </table>
    <p style="font-family:${FONT_STACK};font-size:13px;color:#7B8FA8;line-height:1.5;margin:20px 0 0;">
      Low-risk items (own stay dates, own logistics) are applied automatically. You can review or undo in the trip inbox.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
      <tr>
        <td align="center" style="background-color:#4A35D7;border-radius:2px;">
          <a href="https://andysantamaria.com/trips" target="_blank" style="display:inline-block;padding:12px 28px;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:#F0EDE6;text-decoration:none;">View Trip</a>
        </td>
      </tr>
    </table>
  `;
  return emailLayout(body);
}

/**
 * HTML email for trip invite.
 */
export function inviteEmailHtml(tripName, destination, inviterName, joinUrl) {
  const body = `
    <h2 style="font-family:serif;font-size:22px;font-weight:700;color:#0A1628;margin:0 0 16px;">You&rsquo;re invited</h2>
    <p style="font-family:${FONT_STACK};font-size:15px;color:#333;line-height:1.6;margin:0 0 20px;">
      <strong>${escapeHtml(inviterName)}</strong> invited you to <strong>${escapeHtml(tripName)}</strong>${destination ? ` in ${escapeHtml(destination)}` : ''}.
    </p>
    <p style="font-family:${FONT_STACK};font-size:14px;color:#555;line-height:1.5;margin:0 0 24px;">
      Vialoure is where your group plans the trip &mdash; shared calendar, expenses, and logistics all in one place.
    </p>
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="background-color:#4A35D7;border-radius:2px;">
          <a href="${escapeHtml(joinUrl)}" target="_blank" style="display:inline-block;padding:12px 28px;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:#F0EDE6;text-decoration:none;">View Trip</a>
        </td>
      </tr>
    </table>
  `;
  return emailLayout(body);
}

/**
 * HTML email welcoming an approved access request.
 */
export function welcomeEmailHtml(name) {
  const body = `
    <h2 style="font-family:serif;font-size:22px;font-weight:700;color:#0A1628;margin:0 0 16px;">You&rsquo;re in!</h2>
    <p style="font-family:${FONT_STACK};font-size:15px;color:#333;line-height:1.6;margin:0 0 20px;">
      ${escapeHtml(name)}, your access to Vialoure has been approved. Sign in to get started.
    </p>
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="background-color:#4A35D7;border-radius:2px;">
          <a href="https://andysantamaria.com/trips/login" target="_blank" style="display:inline-block;padding:12px 28px;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:#F0EDE6;text-decoration:none;">Sign In</a>
        </td>
      </tr>
    </table>
  `;
  return emailLayout(body);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
