# Gemini free-tier setup

LoWisa uses the Google Gemini Developer API by default. Google AI Studio provides a free tier for supported models, but quotas and model access can vary by account and change over time. A free API key is required; payment is not required to start on the free tier.

1. Open https://aistudio.google.com/app/apikey and sign in.
2. Create an API key.
3. In Vercel → Project → Settings → Environment Variables, set:
   - `AI_PROVIDER` = `gemini`
   - `GEMINI_API_KEY` = your key
   - `GEMINI_MODEL` = `gemini-3.8-flash` (or a model available to your account in AI Studio)
4. Redeploy the project.
5. Send `/aistatus` to the bot. The AI check should report a live Gemini response.

For local development, put these values in `.env`. Never commit your API key or put it in frontend code.

## Limits and errors

- Free-tier quotas and rate limits apply; they can change and vary by model.
- HTTP 429 means the free-tier quota/rate limit was reached. Wait and retry later.
- A model-not-found or permission error means the configured model is unavailable for your key. Select a model listed in your AI Studio/API model access page and update `GEMINI_MODEL`.
- The bot does not automatically switch to a paid provider when the free quota is exhausted.
- Use `/aistatus` and the Vercel runtime logs to troubleshoot provider errors.

Official docs:
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://ai.google.dev/api/generate-content
