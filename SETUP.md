# KitBot — Setup Guide

This walks you from "nothing" to a working bot that can build the Gaming
Community Kit in any server, plus a real storefront in your own server that
auto-provisions a customer's server after they pay. No prior Discord bot or
Node.js experience assumed.

Total time: 45–90 minutes the first time. After that, deploying changes
takes seconds.

---

## Part 1 — Create your Discord bot application

1. Go to https://discord.com/developers/applications and click **New Application**. Name it "KitBot" (or your product's name).
2. Open the **Bot** tab on the left.
   - Click **Reset Token** (or **Copy** if this is your first token) and save it somewhere safe — this is `DISCORD_TOKEN`. Never share it or commit it to a public repo; anyone with it can control your bot.
   - Turn ON these two toggles under **Privileged Gateway Intents**:
     - **Server Members Intent** (needed for welcome messages, auto-roles, leveling)
     - **Message Content Intent** (needed for leveling and message logging)
3. Open **OAuth2 → General** and copy the **Client ID** — this is `DISCORD_CLIENT_ID`.
4. Open **OAuth2 → URL Generator**:
   - Scopes: check `bot` and `applications.commands`.
   - Bot permissions: check **Administrator** (simplest for a bot that builds entire servers; you can lock this down later).
   - Copy the generated URL at the bottom — this is your **bot invite link**. Save it as `BOT_INVITE_URL` later.

---

## Part 2 — Get the code running locally (to test before you host it)

You need [Node.js](https://nodejs.org) 18 or newer installed.

1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
2. Fill in `.env`:
   - `DISCORD_TOKEN` — from Part 1, step 2
   - `DISCORD_CLIENT_ID` — from Part 1, step 3
   - `HOME_GUILD_ID` — right-click your own Discord server icon → Copy Server ID (enable Developer Mode in Discord Settings → Advanced first if you don't see this option). Setting this makes commands appear instantly in your server while testing, instead of waiting up to an hour.
   - Leave the Stripe and `BOT_INVITE_URL` lines for now — Part 4.
3. Install dependencies and register your slash commands:
   ```
   npm install
   npm run deploy-commands
   ```
4. Start the bot:
   ```
   npm start
   ```
   You should see `[ready] Logged in as YourBot#0000`.
5. Invite the bot to your own test server using the invite link from Part 1, step 4.
6. In that server, try `/setup-kit kit:Gaming Community Kit`. Watch it build the whole server in front of you.

If a command doesn't show up, double check `HOME_GUILD_ID` is correct and re-run `npm run deploy-commands`.

---

## Part 3 — Host it 24/7 (Railway)

Your bot needs to run all the time, not just on your laptop. [Railway](https://railway.app) has a simple free/low-cost tier that works well for this.

1. Push this project to a **private** GitHub repo (don't make it public — it's fine to have the code itself be private since it contains your business logic, and `.env` is already git-ignored so your token never gets committed).
2. In Railway: **New Project → Deploy from GitHub repo** → pick your repo.
3. Once it's created, go to the service's **Variables** tab and add every value from your `.env` file (same names: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `HOME_GUILD_ID`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_GAMING`, `BOT_INVITE_URL`). Do **not** set `HOME_GUILD_ID` in production once you're selling to other servers — leave it blank so commands register globally.
4. Railway auto-detects `npm start` from `package.json` — no extra config needed.
5. Under **Settings → Networking**, click **Generate Domain**. This gives you a public URL like `https://kitbot-production.up.railway.app` — set that as `PUBLIC_URL` in Variables (used later for the Stripe success page).
6. Deploy. Check the logs for `[ready] Logged in as...` and `[web] Success page listening on port...`.
7. Run `npm run deploy-commands` **once from your own machine** (with `HOME_GUILD_ID` blank in your local `.env` for this run) to register commands globally so they work in every server the bot joins, not just yours.

---

## Part 4 — Set up Stripe (the actual storefront)

This is what makes "buy the kit → bot builds your server automatically" work with zero manual steps on your end.

1. Create a [Stripe](https://dashboard.stripe.com) account if you don't have one.
2. **Products → Add Product**: name it "Gaming Community Kit", price $29, one-time payment. Save it, then copy its **Price ID** (starts with `price_...`) — set that as `STRIPE_PRICE_GAMING` in your env vars (locally and on Railway).
3. Still on the product, click **Create payment link**.
   - Under **After payment**, choose **Don't show confirmation page** → **Redirect customers to another website**.
   - Set the redirect URL to: `https://YOUR-RAILWAY-URL/success?session_id={CHECKOUT_SESSION_ID}` (yes, include that literal `{CHECKOUT_SESSION_ID}` — Stripe fills it in automatically).
4. Copy the Payment Link URL. This is what `/config set-text key:storeLink value:<link>` in Discord will use.
5. Get your **Secret key** from **Developers → API keys** (use the **test mode** key while you're trying this out, switch to the live key when you're ready to actually sell) → set as `STRIPE_SECRET_KEY`.

**Test the whole flow before going live:**
1. In your Discord server: `/config set-text key:storeLink value:<your payment link>`, then `/store-panel kit:Gaming Community Kit` in a #store channel.
2. Click **Buy Now**, complete checkout with a [Stripe test card](https://docs.stripe.com/testing) (`4242 4242 4242 4242`, any future date/CVC).
3. You'll land on your success page with an activation code.
4. In a *different, empty* test server (invite the bot there too), run `/activate session_id:<the code>`.
5. Watch it verify the payment and build the entire kit automatically.

When you're confident it works, swap `STRIPE_SECRET_KEY` for your **live** key and switch the Payment Link to live mode too.

---

## Day-to-day: adding features with AI

The whole codebase is under `src/modules/`, one folder per feature
(moderation, tickets, welcome, autoroles, giveaways, leveling, logging,
announcements, setup, store). Each module is self-contained:

- `commands/*.js` — slash commands (drop a new file in here, restart, run `npm run deploy-commands`, done)
- `events/*.js` — things that happen automatically (someone joins, sends a message, etc.)
- `buttons/*.js` — button click handlers
- `index.js` (optional) — an `init(client)` function for anything that needs to run on startup (like the giveaway timer)

To add a feature, tell Claude (or any AI coding assistant) something like:

> "Here's my KitBot codebase. Add a `/suggest` command to the suggestions
> flow: it posts an embed with 👍/👎 reactions to a configured suggestions
> channel." — and paste the relevant existing module as an example of the
> pattern to follow.

To build your next kit (Creator Kit, Business Kit, etc.), open
`src/config/kits.js` and add a new entry — copy the `gaming` block, rename
it, change the roles/channels. Everything else (the bot, the storefront,
`/activate`) works with any kit key you add there without further code
changes.

---

## Troubleshooting

- **Slash commands don't show up** → run `npm run deploy-commands` again; global deploys can take up to an hour, guild-specific (`HOME_GUILD_ID`) deploys are instant.
- **"I need Administrator permission" error on `/setup-kit`** → re-invite the bot using a link generated with the Administrator permission checked (Part 1, step 4).
- **Leveling/welcome/logging not firing** → make sure both privileged intents are ON in the Developer Portal (Part 1, step 2) — this is the #1 cause of "the bot just doesn't respond to X."
- **`/activate` says "not recognized"** → make sure `STRIPE_SECRET_KEY` and `STRIPE_PRICE_GAMING` are set correctly and match the mode (test vs live) the Payment Link was created in.
