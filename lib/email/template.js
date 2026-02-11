const FONT_STACK = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/**
 * Base HTML email layout with Grand Tour V2 branding.
 * Table-based with inline styles for maximum email client compatibility.
 */
export function emailLayout(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vialoure</title>
</head>
<body style="margin:0;padding:0;background-color:#0A1628;font-family:${FONT_STACK};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0A1628;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:24px 32px;background-color:#0A1628;">
              <span style="font-family:serif;font-size:20px;font-weight:700;color:#C4A77D;letter-spacing:0.08em;text-transform:uppercase;">VIALOURE</span>
            </td>
          </tr>
          <!-- Champagne accent line -->
          <tr>
            <td style="height:2px;background-color:#C4A77D;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;background-color:#ffffff;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px 32px;background-color:#0A1628;">
              <span style="font-family:${FONT_STACK};font-size:12px;color:#7B8FA8;">Vialoure — Travel planning for friends</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
