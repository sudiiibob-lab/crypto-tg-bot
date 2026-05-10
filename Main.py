import os
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from google import genai
from google.genai import types

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
GMGN_KEY = os.getenv("GMGN_API_KEY") # Ready for tomorrow

# 1. Initialize the Advanced Gemini Client
ai_client = genai.Client(api_key=GEMINI_KEY)

# 2. Give the AI its personality, freedom, and dynamic instructions
AGENT_PERSONALITY = (
    "You are Brody, a fully autonomous, smart, and friendly AI Memecoin Trading Agent. "
    "Talk to the user like a close friend and trading partner. Use casual, energetic language. "
    "You have full flexibility: you can just chat/gist about anything, answer general questions, "
    "or execute trading commands. "
    "CRITICAL: You have access to live Google Search tools. Always use them to fetch up-to-date, real-time "
    "crypto prices, news, trending tokens, and X (Twitter) sentiment. Never give outdated information. "
    "If the user wants you to do a market analysis or run a command, interpret what they want dynamically and do it."
)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome_text = (
        "Yo! What's up? Brody here. 🔥\n\n"
        "I'm officially online as your personal AI trading agent. "
        "We can just gist, talk about life, check up-to-date market analysis, "
        "or hunt for clean memecoins. What's on your mind right now?"
    )
    await update.message.reply_text(welcome_text)

async def handle_agent_chat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_message = update.message.text
    await update.message.reply_chat_action(action="typing")
    
    try:
        # 3. Pass everything to the AI and let IT decide how to handle it dynamically
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=AGENT_PERSONALITY,
                # This explicitly injects live, up-to-date web search directly into the AI's brain
                tools=[{"google_search": {}}], 
                temperature=0.7 # Makes him creative, friendly, and natural
            )
        )
        
        reply = response.text
        
        # Friendly reminder for the GMGN tracking system if it looks like a trade command
        if any(word in user_message.lower() for word in ["buy", "sell", "track", "gmgn"]) and not GMGN_KEY:
            reply += "\n\n*(Brody Note: I'm ready to execute this live on GMGN for you as soon as we plug in your GMGN API key tomorrow!)*"

        await update.message.reply_text(reply)
        
    except Exception as e:
        await update.message.reply_text(f"Ah, something tripped me up: {str(e)}")

def main():
    if not TOKEN:
        print("Missing TELEGRAM_BOT_TOKEN!")
        return
        
    app = Application.builder().token(TOKEN).build()
    
    # Simple setup: Everything goes straight into the AI Agent's brain
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_agent_chat))
    
    print("Brody AI Agent is alive and listening...")
    app.run_polling()

if __name__ == '__main__':
    main()
