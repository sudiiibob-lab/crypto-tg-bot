import { Telegraf } from 'telegraf';
import { GoogleGenAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';
import { JSONFilePreset } from 'lowdb/node';

dotenv.config();

// Initialize Ultra-Light Local Database for Watchlists (Saves money!)
const db = await JSONFilePreset('db.json', { watchedWallets: [], activeTokens: [] });

// Initialize Agent Infrastructure
const bot = new Telegraf(process.env.TELEGRAF_TOKEN);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

// Strict System Prompt for Memecoin Specialization & High-Value Token Management
const SYSTEM_INSTRUCTION = `You are an elite, hyper-profitable memecoin trading engine.
CRITICAL RULES:
1. Maximize output density. Always keep explanations under 45 words to conserve our $2 budget.
2. Rely strictly on data points: Liquidity, Dev holdings, and volume structures.
3. If an action is required, output standard syntax instructions for the GMGN integration suite.`;

// 1. CHART FRIENDLY VISION CONTROLLER
bot.on('photo', async (ctx) => {
    try {
        const photoArray = ctx.message.photo;
        const targetFile = photoArray[photoArray.length - 1];
        const fileUrl = await ctx.telegram.getFileLink(targetFile.file_id);
        
        // Convert incoming stream directly to binary structures for Gemini
        const imageBuffer = await axios.get(fileUrl.href, { responseType: 'arraybuffer' });
        const generativePart = {
            inlineData: {
                data: Buffer.from(imageBuffer.data).toString("base64"),
                mimeType: "image/jpeg"
            }
        };

        ctx.reply("⚡ Scanning chart candlestick configurations & safety metrics...");
        
        const responseBlock = await model.generateContent([
            SYSTEM_INSTRUCTION,
            generativePart,
            "Inspect this chart screenshot for liquidity dumps, trendline retests, or honeypots. Give a clear rating: BULLISH or RUG."
        ]);

        ctx.reply(`🧠 Agent Intelligence:\n\n${responseBlock.response.text()}`);
    } catch (error) {
        ctx.reply(`❌ Vision Error: ${error.message}`);
    }
});

// 2. DYNAMIC LIVE MONITORING AND WATCHLIST COMMANDS
bot.command('watch', async (ctx) => {
    const segments = ctx.message.text.split(' ');
    if (segments.length < 2) return ctx.reply("❌ Usage: /watch [wallet_address]");
    
    const targetWallet = segments[1];
    
    // Write directly to local persistent volume
    db.data.watchedWallets.push({ wallet: targetWallet, timestamp: Date.now() });
    await db.write();
    
    ctx.reply(`📡 Target Added! Tracking wallet ${targetWallet} via active GMGN background hooks.`);
});

// 3. EXECUTE LIVE TRADING VIA GMGN SKILLS API DIRECT COUPLING
bot.command('snipe', async (ctx) => {
    const segments = ctx.message.text.split(' ');
    if (segments.length < 3) return ctx.reply("❌ Usage: /snipe [token_mint] [amount_sol]");
    
    const [_, tokenMint, solAmount] = segments;
    ctx.reply(`🚀 Initiating execution block on GMGN Router for ${solAmount} SOL...`);

    try {
        // Direct trade placement leveraging the GMGN skills interface values
        const tradeResponse = await axios.post('gmgn.ai', {
            routingArgs: {
                inputToken: "So11111111111111111111111111111111111111112",
                outputToken: tokenMint,
                amount: solAmount,
                slippageCapping: 10
            }
        }, {
            headers: { 'X-GMGN-API-KEY': process.env.GMGN_API_KEY }
        });

        ctx.reply(`🎯 Order Dispatched!\nTx Hash: ${tradeResponse.data.txHash || 'Pending Confirmation'}`);
    } catch (err) {
        ctx.reply(`⚠️ Execution Failure: ${err.response?.data?.message || err.message}`);
    }
});

// 4. GENERAL MEMECOIN COMMAND CHAT INTERFACE
bot.on('text', async (ctx) => {
    try {
        const query = ctx.message.text;
        const output = await model.generateContent([SYSTEM_INSTRUCTION, query]);
        ctx.reply(output.response.text());
    } catch (err) {
        ctx.reply(`❌ Core Logic Error: ${err.message}`);
    }
});

bot.launch();
console.log("🔥 Agent System Active and Bound to GMGN Endpoints.");
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
        "My eyes are officially open! You can now send me screenshots, charts, "
        "or image texts, and I'll analyze them for you. What's on your mind?"
    )
    await update.message.reply_text(welcome_text)

# 3. New Unified Handler for Text and Photos
async def handle_agent_chat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_message = update.message.text or update.message.caption or ""
    await update.message.reply_chat_action(action="typing")
    
    contents_payload = []
    
    # Check if the user sent a photo
    if update.message.photo:
        # Fetch the highest quality image version
        photo_file = await update.message.photo[-1].get_file()
        photo_bytes = await photo_file.download_as_bytearray()
        
        # Structure the image file into a format Gemini reads directly
        image_data = types.Part.from_bytes(
            data=bytes(photo_bytes),
            mime_type="image/jpeg"
        )
        contents_payload.append(image_data)
    
    # Check text inside the message or caption for token data
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
                    f"- Top Holders Ownership: {gmgn_data.get('top_holders_percentage', 'Unknown')}%\n"
                )
        else:
            gmgn_report = "\n\n[System Notification: Contract detected, but GMGN_API_KEY variable is empty!]"

    # Combine user text question/caption with the GMGN data block
    full_text_prompt = f"{user_message}\n{gmgn_report}".strip()
    if full_text_prompt:
        contents_payload.append(full_text_prompt)
        
    if not contents_payload:
        return

    try:
        # Pass the visual image frames + text to Gemini simultaneously
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents_payload,
            config=types.GenerateContentConfig(
                system_instruction=AGENT_PERSONALITY,
                tools=[{"google_search": {}}], 
                temperature=0.75
            )
        )
        
        reply = response.text
        
        if any(word in user_message.lower() for word in ["buy", "sell", "track", "gmgn"]) and not GMGN_KEY:
            reply += "\n\n*(Brody Note: I am ready to auto-trade this as soon as we connect your GMGN API key tomorrow!)*"

        await update.message.reply_text(reply)
        
    except Exception as e:
        await update.message.reply_text(f"Ah, something tripped up my vision engine: {str(e)}")

def main():
    if not TOKEN:
        print("Missing TELEGRAM_BOT_TOKEN!")
        return
        
    app = Application.builder().token(TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    # This handler configuration opens up text AND photos/images for Brody
    app.add_handler(MessageHandler(filters.TEXT | filters.PHOTO & ~filters.COMMAND, handle_agent_chat))
    
    print("Brody Vision Agent is alive and listening...")
    app.run_polling()

if __name__ == '__main__':
    main()
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
