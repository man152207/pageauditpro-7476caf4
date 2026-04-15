---
name: OpenAI integration for AI insights
description: AI insights use OpenAI gpt-4o model, API key stored in DB settings table
type: feature
---
AI-powered insights are generated using OpenAI's 'gpt-4o' model. The API key is stored in the `settings` table (key: `openai_api_key`, scope: `global`). The `generate-ai-insights` edge function reads the key from DB, builds a prompt from audit metrics, and calls the OpenAI completions API. Max tokens: 1500. Temperature: 0.7.
