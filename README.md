# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:** Node.js


1. Install dependencies:
   ```bash
   npm install
   ```
   This app uses several libraries for UI and functionality, including:
   - `react-markdown` for rendering AI responses.
   - `react-syntax-highlighter` for code block highlighting.
   - `remark-gfm` for extended markdown support (tables, etc.).

2. Create a `.env` file in the root directory (you can copy `.env.example` if it exists) and add your API keys:
   ```
   VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   VITE_OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
   VITE_CLAUDE_API_KEY="YOUR_CLAUDE_API_KEY"
   ```
3. Run the app:
   ```bash
   npm run dev
   ```
