# AI Debate Web App

Dark-mode Node web app where you pick two AI engines (Claude, Gemini, ChatGPT), enter a starting argument, optionally tweak an extra prompt modifier, and watch them debate in a chat-style UI.

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
   
   Or run the server separately:
   ```bash
   npm run server
   ```

## How to Use

### Basic Debate Flow
1. Select two AI engines from the dropdowns (Engine A and Engine B)
2. Enter a starting topic in the "Starting Topic" field
3. Optionally add an "Extra Prompt Modifier" to influence AI responses
4. Click **Start Debate** to begin - the first AI will respond immediately
5. Click **Proceed** to advance the debate turn by turn

### Custom Prompt Injection
You can inject your own custom prompts into the conversation at any time:

1. **Start a debate** first using the normal flow
2. Click **"Inject your point of view"** button in the bottom navigation
3. In the modal that opens:
   - Write your custom prompt in the text area
   - **Optional**: Click "Prefill Last AI Response" to start with the previous AI's message and edit it
   - Click **Proceed** to inject your prompt and continue the debate
4. Your custom prompt appears as a "User" message in the chat
5. The next AI in the sequence will respond to your injected prompt
6. The debate continues normally from there

**Use Cases for Custom Prompts:**
- Steer the conversation in a new direction
- Ask clarifying questions to the AIs
- Challenge specific points made in the debate
- Introduce new perspectives or information
- Edit and reuse previous AI responses as your own input

## Project Structure
```
├── backend/
│   └── server.js          # Express server with AI provider integrations
├── public/                # Static frontend files
├── logs/                  # AI prompt logs (auto-generated)
├── package.json           # Dependencies and scripts
├── .env                   # API keys (create from .env.example)
└── README.md             # This file
```

## Features
- **AI Prompt Logging**: All prompts sent to AI providers are automatically logged to `logs/ai-prompts-YYYY-MM-DD.jsonl`
- **Multi-Provider Support**: Supports OpenAI, Anthropic, and Google Gemini APIs
- **Dark Mode UI**: Clean, modern interface optimized for readability

## Notes
- The app advances one turn at a time when you press **Proceed**. You can edit the Extra Prompt at any time and it will affect the next AI turn.
- The server proxies calls to provider APIs — keep your keys in `.env` and never commit them to source control.
- All AI prompts are logged to the `logs/` directory for analysis and debugging.
- For production, add auth, rate-limiting, and proper error handling.
