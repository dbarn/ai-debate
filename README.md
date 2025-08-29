# AI Debate Web App

Dark-mode Node web app where you pick two AI engines (Claude, Gemini, ChatGPT), enter a starting argument, optionally tweak an extra prompt modifier, and watch them debate in a chat-style UI. All radiuses are 3px.

## Quick Start

1. **Clone** this folder or unzip the archive and `cd` into it.
2. Copy `.env.example` to `.env` and add the API keys you want:
   - `OPENAI_API_KEY` for ChatGPT (OpenAI)
   - `ANTHROPIC_API_KEY` for Claude
   - `GEMINI_API_KEY` for Gemini
3. Install deps and run:

   ```bash
   npm install
   npm run dev
   # then open http://localhost:3000
   ```

## Notes
- The app advances one turn at a time when you press **Proceed**. You can edit the Extra Prompt at any time and it will affect the next AI turn.
- **Restart Debate** clears the chat but keeps your selected engines, topic, and extra prompt so you can start again quickly.
- The server proxies calls to provider APIs — keep your keys in `.env` and never commit them to source control.
- For production, add auth, rate-limiting, and proper error handling.
