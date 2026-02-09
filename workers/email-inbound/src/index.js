import PostalMime from 'postal-mime';

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

export default {
  async email(message, env, ctx) {
    // Parse the raw email with postal-mime
    const rawEmail = await new Response(message.raw).arrayBuffer();
    const parser = new PostalMime();
    const parsed = await parser.parse(rawEmail);

    // Build payload in same format as Postmark inbound webhook
    // so our API handler needs zero changes
    const payload = {
      From: message.from,
      FromName: parsed.from?.name || '',
      To: message.to,
      Subject: parsed.subject || '',
      TextBody: parsed.text || '',
      HtmlBody: parsed.html || '',
      MessageID: parsed.messageId || '',
      CcAddresses: (parsed.cc || []).map((addr) => addr.address || addr),
      Attachments: (parsed.attachments || []).map((att) => ({
        Name: att.filename || 'attachment',
        Content: arrayBufferToBase64(att.content),
        ContentType: att.mimeType || 'application/octet-stream',
        ContentLength: att.content.byteLength,
      })),
    };

    const res = await fetch(
      `${env.WEBHOOK_URL}?token=${env.WEBHOOK_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      // Reject so Cloudflare retries delivery
      message.setReject(`Webhook failed: ${res.status}`);
    }
  },
};
