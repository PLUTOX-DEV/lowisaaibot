# OpenRouter setup

The bot uses the OpenAI Node SDK pointed at OpenRouter's OpenAI-compatible endpoint:

```text
https://openrouter.ai/api/v1
```

## Environment

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openrouter/auto
OPENROUTER_SITE_URL=
OPENROUTER_SITE_NAME=LoWisa Telegram AI
```

`OPENROUTER_MODEL` can be replaced with a specific model ID from the OpenRouter model catalog.

## Request flow

```text
Telegram message
      ↓
Node.js / Telegraf
      ↓
LoWisa retrieval + conversation memory
      ↓
OpenRouter chat completion
      ↓
Telegram response
```

## Security

Never commit `.env` or expose `OPENROUTER_API_KEY` in client-side code. The key belongs only on the bot server.

## Model changes

You can change models without changing application code:

```env
OPENROUTER_MODEL=your/model-id
```

For production, consider explicit model fallbacks or routing rules once you know the bot's traffic, budget, and latency requirements.
