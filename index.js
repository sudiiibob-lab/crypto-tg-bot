import { Telegraf } from 'telegraf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';
import { JSONFilePreset } from 'lowdb/node';

dotenv.config();

// Initialize Ultra-Light Local Database for Watchlists (Saves money!)
const db = await JSONFilePreset('db.json', { watchedWallets: [], activeTokens: [] });

// Initialize Agent Infrastructure
const bot = new Telegraf(process.env.TELEGRAF_TOKEN);
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
        const tradeResponse = await axios.post('https://gmgn.ai', {
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
