# KitBot

A single modular Discord bot that turns "buy a kit" into "fully built,
professional Discord server" in under a minute — no manual setup, no
copy-pasting a template, no giant pile of separate bots.

## What's in the box

```
KitBot
├── Moderation      /kick /ban /unban /timeout /warn /warnings /purge
├── Tickets         private support channels via button, /close-ticket, transcripts
├── Welcome         auto-embed on join
├── AutoRoles       instant join role + button-gated verification
├── Giveaways       /giveaway start|end|reroll, reaction entries, auto-ending
├── Leveling        passive XP, /rank, /leaderboard, level-up announcements
├── Logging         message edits/deletes, joins/leaves, bans → a log channel
├── Announcements   /announce
├── Setup           /setup-kit — builds an entire server (roles+channels+perms) from a template
└── Store           Discord-native storefront + Stripe-verified /activate auto-provisioning
```

Different products (Gaming Kit, Creator Kit, Business Kit, ...) are just
different entries in `src/config/kits.js` — same bot, same code, different
configuration. See `SETUP.md` for the full walkthrough (Discord app setup,
hosting, Stripe) and the "Day-to-day" section for how to keep extending
this with AI.

## Quick start

```
cp .env.example .env   # then fill in the values - see SETUP.md Part 1-2
npm install
npm run deploy-commands
npm start
```
