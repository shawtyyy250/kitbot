// Tiny web server that rides along in the SAME process as the bot (so
// there's nothing extra to host). Its only job is the page a customer lands
// on right after paying: it shows them their activation code and the two
// things they need to do next. No database, no sessions, no auth - Stripe
// is the source of truth, and /activate re-checks with Stripe directly.
const express = require('express');

function startWebServer() {
  const app = express();

  app.get('/success', (req, res) => {
    const sessionId = req.query.session_id || '';
    const inviteUrl = process.env.BOT_INVITE_URL || '#';
    res.type('html').send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>You're in! Activate your kit</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; background:#0b0e14; color:#e6e8ee; margin:0; padding:0; display:flex; align-items:center; justify-content:center; min-height:100vh; }
  .card { max-width: 560px; padding: 40px; background:#151923; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,.4); }
  h1 { font-size: 22px; margin-top:0; }
  .code { font-family: monospace; font-size: 15px; background:#0b0e14; border:1px solid #2a2f3a; border-radius:8px; padding:14px; word-break:break-all; user-select:all; margin: 16px 0; }
  ol { padding-left: 20px; line-height:1.9; }
  a.btn { display:inline-block; margin-top:16px; background:#5865f2; color:white; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600; }
  code { background:#0b0e14; padding:2px 6px; border-radius:4px; }
</style>
</head>
<body>
  <div class="card">
    <h1>✅ Payment received - let's set up your server</h1>
    <ol>
      <li>Create a brand new (or empty) Discord server if you don't have one yet.</li>
      <li><a class="btn" href="${inviteUrl}" target="_blank" rel="noopener">Invite the bot to that server</a></li>
      <li>In that server, run this command and paste your activation code:</li>
    </ol>
    <p><code>/activate</code></p>
    <div class="code">${sessionId ? sessionId : 'No session_id found - check your confirmation email or contact support.'}</div>
    <p>The bot will build your entire server automatically - channels, roles, tickets, everything - in a few seconds.</p>
  </div>
</body>
</html>`);
  });

  app.get('/', (req, res) => res.redirect('/success'));

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`[web] Success page listening on port ${port}`));
}

module.exports = { startWebServer };
