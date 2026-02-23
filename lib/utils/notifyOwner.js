/**
 * Send a fire-and-forget WhatsApp notification to the site owner.
 * Errors are swallowed — this must never block user flows.
 */
export function notifyOwner(message) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  const to = process.env.OWNER_WHATSAPP_NUMBER;

  if (!sid || !token || !from || !to) return;

  const waFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
  const waTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const params = new URLSearchParams({ From: waFrom, To: waTo, Body: message });

  fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  }).catch(() => {});
}
