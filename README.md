# LoWisa Telegram AI

A TypeScript/Node.js Telegram bot that brings the LoWisa teaching philosophy into a Telegram community.

## AI provider: OpenRouter

This starter is wired for **OpenRouter first**. The bot calls OpenRouter directly over HTTP at `https://openrouter.ai/api/v1`, so it does **not** need the OpenAI Node SDK. `openrouter/auto` can route requests automatically; you can also set an explicit model ID from the OpenRouter catalog.

The bot defaults to:

```env
AI_PROVIDER=openrouter
OPENROUTER_MODEL=openrouter/auto
```

You can replace `OPENROUTER_MODEL` with any model ID available in the OpenRouter catalog.

## What is included

- LoWisa project knowledge base with seed content derived from the public LoWisa website.
- RAG-style retrieval from MongoDB knowledge documents.
- OpenRouter AI support via direct HTTP.
- Mock AI mode for local development without an API key.
- Private-chat tutor mode.
- Group-mode mention handling: `@LoWisaBot <question>`.
- Rich Telegram formatting for onboarding, help, docs, about, and progress views.
- Real-time crypto prices for common coins through CoinGecko.
- Automatic Telegram command-menu updates on bot startup.
- LoWisa-style teaching loop: explain → ask for reasoning → challenge → check understanding.
- Coding help for APIs, Node.js, MongoDB, auth, Docker, testing, debugging, architecture, and related topics.
- Conversation memory per user/chat.
- Community analytics: messages, questions, active users, topics, and activity summaries.
- Raid tracking commands.
- Admin-only analytics commands and REST API.
- Knowledge review, approval, rejection, and editing.

## Deploy on Vercel

Vercel uses the Telegram webhook function in `api/telegram.ts`. Do not use
long polling (`bot.launch()`) on Vercel.

1. Import the project into Vercel.
   In **Project Settings → Build & Development Settings**, set the Framework
   Preset to **Other** and clear/disable any static **Output Directory** such as
   `public`. Vercel automatically detects `api/telegram.ts` as a Node function;
   `vercel.json` sets its maximum duration. This project does not produce a
   static website directory.
2. Add these environment variables:

   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_BOT_USERNAME=LoWisaBot
   TELEGRAM_WEBHOOK_SECRET=replace-with-a-long-random-value
   MONGODB_URI=mongodb+srv://...
   AI_PROVIDER=openrouter
   OPENROUTER_API_KEY=your_openrouter_key
   OPENROUTER_MODEL=openrouter/auto
   ```

3. Deploy. Your webhook URL is:

   ```text
   https://your-project.vercel.app/api/telegram
   ```

4. Register the webhook once:

   ```text
   https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-project.vercel.app/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>
   ```

Replace both placeholders before opening the URL. Telegram will send new
messages to Vercel, and the function will connect to MongoDB as needed.

For local development, continue using `npm run dev`. The Vercel webhook and
local long-polling entry points are separate.

## Architecture

```text
Telegram
   |
   v
Telegraf bot
   |
   +---- Tutor / RAG ---- MongoDB knowledge
   |
   +---- Memory --------- MongoDB conversations
   |
   +---- Analytics ------- MongoDB users/messages/raids
   |
   +---- Admin API ------- stats/knowledge/approval
   |
   v
OpenRouter (recommended)
   |
   v
Selected LLM / Auto Router
```

## Requirements

- Node.js 20+
- MongoDB 7+ (local or Atlas)
- Telegram bot token from `@BotFather`
- OpenRouter API key for live AI responses

## Setup

```bash
npm install
cp .env.example .env
```

Then edit `.env`:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
MONGODB_URI=mongodb://127.0.0.1:27017/lowisa_telegram_ai
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openrouter/auto
```

In a Telegram group, `/stats`, `/report`, `/raid`, and `/knowledge` can only be
used by users whose Telegram status is **administrator** or **creator**. The bot
must be added to the group so it can check member status. The REST admin API
does not use an API key; protect it with a private network, reverse proxy, or
other access-control layer before exposing it publicly.

Seed the starter LoWisa knowledge:

```bash
npm run seed
```

Start the bot:

```bash
npm run dev
```

Each startup synchronizes the Telegram command menu with the commands supported
by the current bot version. Users may need to reopen the chat or Telegram menu
to see the refreshed list.

Build for production:

```bash
npm run build
npm start
```

## No external AI during local development

You can switch to mock mode:

```env
AI_PROVIDER=mock
```

Then start normally:

```bash
npm run dev
```

## Telegram commands

User commands:

- `/start` — onboarding
- `/help` — command list
- `/about` — learn what LoWisa is and how the tutor teaches
- `/learn <topic>` — start a tutor lesson
- `/challenge [topic]` — get a challenge
- `/price [coins]` — current USD prices and 24-hour changes, for example `/price BTC SOL ETH`
- `/progress` — view your tracked learning progress
- `/level <level>` — set beginner, junior, intermediate, or advanced
- `/docs` — show LoWisa resource links
- `/ask <question>` — ask the tutor directly

### Live crypto prices

The bot supports these common coins:

`BTC`, `ETH`, `SOL`, `BNB`, `ADA`, `DOGE`, `XRP`, and `LINK`.

Examples:

```text
/price BTC SOL ETH
/price bitcoin
What is the current price of SOL and BTC?
What is the latest ETH value?
```

Prices are fetched from CoinGecko at request time and include the USD price,
24-hour change, source, and retrieval timestamp. Market data can change
quickly, so use the displayed timestamp and verify important financial
decisions with a trusted exchange or market-data provider. The bot does not
provide investment advice.

Group mode:

```text
@LoWisaBot explain connection pooling
```

In a group, you can also reply directly to a message sent by the bot. The
reply becomes the next turn in the same conversation, so you do not need to
mention the bot again.

Admin commands:

- `/stats` — current community stats
- `/report` — activity summary
- `/raid start <name>` — start a raid
- `/raid join` — join active raid
- `/raid status` — active raid stats
- `/knowledge pending` — review pending knowledge entries
- `/knowledge approved` — review approved knowledge entries
- `/knowledge rejected` — review rejected knowledge entries

Admin bot commands only work in Telegram groups or supergroups, and only for
users with the Telegram status **administrator** or **creator**. The bot must
be able to read group member status.

## Admin API

```text
GET  /health
GET  /api/admin/stats
GET  /api/admin/knowledge?status=pending&limit=50
GET  /api/admin/knowledge/pending
POST /api/admin/knowledge
POST /api/admin/knowledge/:id/approve
POST /api/admin/knowledge/:id/reject
PATCH /api/admin/knowledge/:id
```

The admin REST routes do not require an API key. Do not expose them directly to
the public internet without adding authentication at the deployment layer.

Knowledge API details:

- `status` accepts `pending`, `approved`, or `rejected`.
- `limit` is capped at 100.
- New entries default to `pending`.
- `PATCH` supports `title`, `content`, `category`, `tags`, `sourceUrl`, and
  `sourceName`.
- `tags` must be an array of strings.

## Seed knowledge

`npm run seed` inserts a curated starter set covering:

- What LoWisa is
- System Immersion
- AI coding tutor behavior
- 25 engineering domains
- Audit My AI Code
- Applied Math Lab
- Project continuation
- Safe sandboxing
- Learning cohorts
- Clock it / community learning
- Official resources

The public LoWisa site can change, so keep the seed data and source URLs maintained as the product evolves.

## OpenRouter notes

OpenRouter supports an OpenAI-compatible API and automatic provider/model routing. Its current docs use the endpoint `https://openrouter.ai/api/v1`. Optional `HTTP-Referer` and `X-Title` headers are supported for app attribution.

For production, monitor usage and model pricing in OpenRouter because `openrouter/auto` can route different requests to different models. OpenRouter also supports explicit model fallbacks when you need more control.

## Production hardening

Before production, add webhook deployment, rate limiting, queueing, Redis, audit logs, stricter admin RBAC, secret management, a dedicated vector index (MongoDB Atlas Vector Search or another vector database), and abuse controls. Do not allow an AI model to execute destructive admin actions directly; use explicit tools and approvals.
