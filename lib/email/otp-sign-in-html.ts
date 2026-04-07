export function buildOtpSignInEmailHtml(params: { code: string }): string {
  const { code } = params;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
</head>
<body style="margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;color:#0f172a;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:420px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:28px 24px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#0891b2;letter-spacing:0.08em;text-transform:uppercase;">Whisper</p>
              <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0f172a;">Your sign-in code</h1>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#64748b;">Enter this code on the sign-in page. It expires in 10 minutes.</p>
              <div style="text-align:center;padding:16px 12px;background:#f1f5f9;border-radius:10px;border:1px solid #e2e8f0;font-size:28px;font-weight:700;letter-spacing:0.25em;color:#0f172a;font-variant-numeric:tabular-nums;">
                ${escapeHtml(code)}
              </div>
              <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">If you didn&apos;t request this, you can ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
