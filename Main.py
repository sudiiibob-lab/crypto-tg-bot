import os
import re
import httpx
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from google import genai
from google.genai import types

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
GMGN_KEY = os.getenv("GMGN_API_KEY")  # Ready for your key tomorrow

# 1. Initialize the Advanced Gemini Client
ai_client = genai.Client(api_key=GEMINI_KEY)

# 2. Give the AI its personality, freedom, and strict text limit instructions
AGENT_PERSONALITY = (
    "You are Brody, a fully autonomous, smart, and friendly AI Memecoin Trading Agent. "
    "Talk to the user like a close friend and street-smart trading partner. Use casual, energetic language. "
    "You have full flexibility: you can just chat/gist about anything, answer general questions, "
    "or process on-chain metrics. "
    "You have access to live Google Search tools. Always use them to fetch up-to-date, real-time "
    "crypto news, trending tokens, and sentiment. "
    "When a GMGN data payload is attached to the prompt, interpret the risk metrics automatically "
    "and give your raw, unfiltered verdict on whether the token is clean or a honeypot trap. "
    "CRITICAL USER MESSAGE LIMIT RULE: Your final text response back to the user MUST be punchy, "
    "clear, and strictly under 1,500 characters. If you have data for multiple coins, only present "
    "the top 2 or 3 best tokens with their addresses so the Telegram message limit never breaks."
)

# Helper function to extract a potential crypto token address
def extract_contract_address(text: str) -> str:
    match = re.search(r'\b[a-zA-Z0-9]{32,44}\b', text)
    return match.group(0) if match else None

# Real-time connection to GMGN API Core Skill
async def fetch_gmgn_security_data(contract: str, chain: str = "sol") -> dict:
    if not GMGN_KEY:
        return None
    
    url = f"gmgn.ai{chain}/{contract}"
    headers = {"Authorization": f"Bearer {GMGN_KEY}"}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json().get("data", {})
    except Exception:
        return None
    return None

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
    
    # Scan input for a contract address to invoke GMGN skills
    contract = extract_contract_address(user_message)
    gmgn_report = ""
    
    if contract:
        if GMGN_KEY:
            gmgn_data = await fetch_gmgn_security_data(contract, chain="sol")
            if gmgn_data:
                gmgn_report = (
                    f"\n\n[GMGN DATABASE INJECTED DATA FOR CONTRACT {contract}]:\n"
                    f"- Is Honeypot: {gmgn_data.get('is_honeypot', 'Unknown')}\n"
                    f"- Is Renounced: {gmgn_data.get('is_renounced', 'Unknown')}\n"
                    f"- Blacklist Function: {gmgn_data.get('is_blacklist', 'Unknown')}\n"
                    f"- Top Holders Ownership: {gmgn_data.get('top_holders_percentage', 'Unknown')}%\n"
                    f"- Creator Balance Dumped: {gmgn_data.get('creator_dumped', 'Unknown')}\n"
                )
        else:
            gmgn_report = "\n\n[System Notification: User sent a contract address, but GMGN_API_KEY variable is empty!]"

    # Prepare prompt configuration
    full_prompt = user_message + gmgn_report
    
    try:
        # 3. Pass everything to the AI with live Google Search grounding
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=full_prompt,
            config=types.GenerateContentConfig(
                system_instruction=AGENT_PERSONALITY,
                tools=[{"google_search": {}}], 
                temperature=0.75
            )
        )
        
        reply = response.text
        
        # Friendly reminder if it looks like a trade command without a key
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
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_agent_chat))
    
    print("Brody AI Agent is alive and listening with safe text limits...")
    app.run_polling()

if __name__ == '__main__':
    main()

    app.run_polling()

if __name__ == '__main__':
    main()
