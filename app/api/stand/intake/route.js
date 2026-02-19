import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const FIELD_LABELS = {
  elevator_pitch: 'Elevator Pitch',
  success_6mo: '6-Month Success',
  success_12mo: '12-Month Success',
  age_range: 'Age Range',
  first_win: 'First Win',
  built_today: 'What\'s Built Today',
  working_not_working: 'Working / Not Working',
  real_money: 'Real Money?',
  personality_words: 'Personality Words',
  design_admire: 'Design Inspiration',
  mobile_desktop: 'Mobile vs Desktop',
  timeline: 'Timeline',
};

async function sendNotificationEmail(data) {
  try {
    const rows = Object.entries(data)
      .filter(([key]) => key !== 'submittedAt')
      .flatMap(([, section]) =>
        Object.entries(section).map(([fieldId, value]) => {
          const label = FIELD_LABELS[fieldId] || fieldId;
          const display = value || '(empty)';
          return `<tr>
            <td style="padding:10px 16px;border-bottom:1px solid #eee;vertical-align:top;">
              <strong style="font-size:13px;color:#0A1628;">${label}</strong>
            </td>
            <td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px;color:#333;line-height:1.5;">
              ${display.replace(/\n/g, '<br/>')}
            </td>
          </tr>`;
        })
      )
      .join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'DM Sans',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:24px 32px;background:#1a1a2e;">
          <span style="font-family:serif;font-size:18px;font-weight:700;color:#C4A77D;">Stand Intake</span>
          <span style="font-size:13px;color:#888;margin-left:12px;">Submitted ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </td></tr>
        <tr><td style="height:2px;background:#C4A77D;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:24px 32px;background:#fff;">
          <h2 style="font-family:serif;font-size:20px;color:#0A1628;margin:0 0 8px;">Lauren submitted her intake</h2>
          <p style="font-size:14px;color:#666;margin:0 0 24px;">Here are all her answers:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:4px;">
            ${rows}
          </table>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#1a1a2e;">
          <span style="font-size:12px;color:#888;">Also saved to stand-project/reference/intake-response.json</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Stand Intake <concierge@andysantamaria.com>',
        to: ['andy@andysantamaria.com'],
        subject: 'Lauren submitted her Stand intake',
        html,
      }),
    });
  } catch (e) {
    console.error('Failed to send notification email:', e);
  }
}

export async function POST(request) {
  try {
    const data = await request.json();

    const response = {
      submittedAt: new Date().toISOString(),
      ...data,
    };

    // Try to save locally (works in dev, fails silently on Vercel)
    try {
      const dir = path.join(process.cwd(), 'stand-project', 'reference');
      await mkdir(dir, { recursive: true });
      const filePath = path.join(dir, 'intake-response.json');
      await writeFile(filePath, JSON.stringify(response, null, 2));
    } catch {
      // Read-only filesystem in production — that's fine, email is primary
    }

    // Send email notification before responding
    await sendNotificationEmail(response);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save intake response:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
