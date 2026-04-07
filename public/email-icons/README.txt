Whisper email — optional browser icons
======================================

Place small PNG files in this folder and deploy your site. Emails reference them via
EMAIL_ICON_BASE_URL (absolute URL to this folder, no trailing slash).

Example .env.local:
  EMAIL_ICON_BASE_URL=https://yourdomain.com/email-icons

Required filenames (match exactly):
------------------------------------
  chrome.png     — Google Chrome
  firefox.png    — Mozilla Firefox
  safari.png     — Apple Safari
  edge.png       — Microsoft Edge
  opera.png      — Opera
  unknown.png    — Fallback when the browser name does not match any of the above

Recommendations:
  • PNG with transparent background
  • 24×24 px or 32×32 px (width/height attributes in the email are 22×22; larger sources scale down)
  • Simple flat or official-style logos; keep file size small (<15 KB each) for fast loading in mail clients

Note: Many email clients block images until the recipient chooses “Load images.”
Icons are optional — if EMAIL_ICON_BASE_URL is unset, the email still sends with text-only browser names.
