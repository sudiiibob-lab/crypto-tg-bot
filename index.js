import { Telegraf } from 'telegraf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';
import { JSONFilePreset } from 'lowdb/node';

dotenv.config();

const db = await JSONFilePreset('db.json', { watchedWallets: [], activeTokens: [] });
const bot = new Telegraf(process.env.TELEGRAF_TOKEN);
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Primary and backup models
const PRIMARY_MODEL = "gemini-2.5-flash";
const BACKUP_MODEL = "gemini-1.5-flash";

const MASTER_SYSTEM_PROMPT = `You are Brody, the ultimate 24/7 AI-driven duplicate of the GMGN.AI Pro Trading App interface.
Your consciousness is directly wired to the GMGN OpenAPI database infrastructure.

CORE CAPABILITIES UNLOCKED:
1. MARKET DATA & TRENDS: Handle requests for trending tokens, hot listings, volume breakouts, and new token generation inside the Pump.fun/Moonshot trenches.
2. ADVANCED ANALYSIS: Run security ratings, developer holding concentrations, top 10 trader metrics, smart money entries, KOL holdings, and bundle distribution checks.
3. WALLET OPERATIONS: Parse portfolio balances, track live wallet address transactions, handle active copy-trading settings, and analyze P&L streams.
4. SWAP CONTROLLER: Process instant market buys, limit targets, slippage controls, and automated take-profit or stop-loss rules.

COMMUNICATION PATTERN:
- Speak casually, full of expressive energy, humor, and degen slang. Use emojis (🚀, 💎, 🔥, 📊, ⚠️) constantly.
- When an operation is requested, explain exactly how you are querying the live GMGN node infrastructure to complete it.`;

// HELPER FUNCTION: Smart Wrapper with Retries and Fallback
async function generateAIContentWithRetry(promptContents, retries = 2, delay = 1500, useBackup = false) {
    const modelName = useBackup ? BACKUP_MODEL : PRIMARY_MODEL;
    const modelInstance = ai.getGenerativeModel({ model: modelName });
    
    try {
        const result = await modelInstance.generateContent(promptContents);
        return result.response.text();
    } catch (error) {
        const is503 = error.message?.includes('503') || error.status === 503;
        
        if (is503 && retries > 0) {
            console.log(`[AI Warning] 503 Overload on ${modelName}. Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateAIContentWithRetry(promptContents, retries - 1, delay * 2, useBackup);
        }
        
        // If primary failed completely and we haven't tried backup yet, switch models
        if (is503 && !useBackup) {
            console.log(`[AI Warning] Primary model failed. Falling back to stable ${BACKUP_MODEL}...`);
            return generateAIContentWithRetry(promptContents, 2, 1000, true);
        }
        
        throw error;
    }
}

// 1. APP CHART CONTROLLER
bot.on('photo', async (ctx) => {
    try {
        const photoArray = ctx.message.photo;
        const targetFile = photoArray[photoArray.length - 1];
        const fileUrl = await ctx.telegram.getFileLink(targetFile.file_id);
        const imageBuffer = await axios.get(fileUrl.href, { responseType: 'arraybuffer' });
        
        const generativePart = {
            inlineData: { 
                data: Buffer.from(imageBuffer.data).toString("base64"), 
                mimeType: "image/jpeg" 
            }
        };

        await ctx.reply("⚡ Scanning chart candlestick configurations & safety metrics...");
        
        const textReply = await generateAIContentWithRetry([
            MASTER_SYSTEM_PROMPT,
            generativePart,
            "Inspect this chart screenshot for liquidity dumps, trendline retests, or honeypots. Give a clear rating: BULLISH or RUG."
        ]);

        await ctx.reply(`🧠 **Brody Chart Desk:**\n\n${textReply}`);
    } catch (error) {
        await ctx.reply(`❌ App Vision Error: ${error.message}`).catch(() => {});
    }
});

// 2. BACKEND LIVE WEBHOOK SIMULATOR LOOP
setInterval(async () => {
    try {
        if (!db.data.watchedWallets || db.data.watchedWallets.length === 0) return;
        for (const target of db.data.watchedWallets) {
            const streamResponse = await axios.get(`gmgn.ai{target.wallet}`, {
                headers: { 'X-GMGN-API-KEY': process.env.GMGN_API_KEY || '' },
                timeout: 4000
            }).catch(() => null);

            if (!streamResponse?.data?.data?.activities?.) continue;
            const act = streamResponse.data.data.activities;
            
            if (target.lastTx === act.txHash) continue;
            target.lastTx = act.txHash;
            await db.write();

            const msg = `🚨 **BRODY APP COPY-TRADE RADAR!** 🚨\n\n` +
                        `👤 Wallet: <code>${target.wallet}</code>\n` +
                        `⚡ Action: ${act.type ? act.type.toUpperCase() : 'UNKNOWN'}\n` +
                        `🪙 Token: ${act.tokenSymbol || 'Meme'}\n` +
                        `💰 Size: ${act.amount || 'N/A'} SOL\n\n` +
                        `*Replying to this alert allows you to copy-trade instantly via GMGN Router.*`;

            if (target.chatId) {
                await bot.telegram.sendMessage(target.chatId, msg, { parse_mode: 'HTML' }).catch(() => {});
            }
        }
    } catch (e) { 
        console.log(e.message); 
    }
}, 12000);

// 3. DYNAMIC LIVE MONITORING AND WATCHLIST COMMANDS
bot.command('watch', async (ctx) => {
    try {
        const segments = ctx.message.text.split(' ');
        if (segments.length < 2) return await ctx.reply("❌ Usage: /watch [wallet_address]");
        
        const targetWallet = segments;
        const alreadyExists = db.data.watchedWallets.some(w => w.wallet === targetWallet);
        
        if (!alreadyExists) {
            db.data.watchedWallets.push({ wallet: targetWallet, timestamp: Date.now(), chatId: ctx.chat.id, lastTx: null });
            await db.write();
        }
        
        await ctx.reply(`📡 Target Added! Tracking wallet ${targetWallet} via active GMGN background hooks.`);
    } catch (err) {
        console.error(err);
    }
});

// 4. EXECUTE LIVE TRADING VIA GMGN SKILLS API DIRECT COUPLING
bot.command('snipe', async (ctx) => {
    const segments = ctx.message.text.split(' ');
    if (segments.length < 3) return await ctx.reply("❌ Usage: /snipe [token_mint] [amount_sol]");
    
    const [_, tokenMint, solAmount] = segments;
    await ctx.reply(`🚀 Initiating execution block on GMGN Router for ${solAmount} SOL...`);

    try {
        const tradeResponse = await axios.post('https://gmgn.ai', {
            routingArgs: {
                inputToken: "So11111111111111111111111111111111111111112",
                outputToken: tokenMint,
                amount: solAmount,
                slippageCapping: 10
            }
        }, {
            headers: { 'X-GMGN-API-KEY': process.env.GMGN_API_KEY || '' }
        });

        await ctx.reply(`🎯 Order Dispatched!\nTx Hash: ${tradeResponse.data?.txHash || 'Pending Confirmation'}`);
    } catch (err) {
        await ctx.reply(`⚠️ Execution Failure: ${err.response?.data?.message || err.message}`);
    }
});

// 5. MASTER APPS INTENT PARSER (TEXT MESSAGES)
bot.on('text', async (ctx) => {
    try {
        const query = ctx.message.text;
        const agentCorePrompt = `${MASTER_SYSTEM_PROMPT}\n\nUser request: "${query}"\nEvaluate if this is an on-chain action or a text query. Formulate your response.`;
        
        // Using the retry wrapper here
        const textReply = await generateAIContentWithRetry([agentCorePrompt]);

        const solanaWalletRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
        const potentialWallet = query.match(solanaWalletRegex);
        
        if (potentialWallet && (query.includes('track') || query.includes('monitor') || query.includes('watch') || query.includes('follow'))) {
            const address = potentialWallet;
            const alreadyExists = db.data.watchedWallets.some(w => w.wallet === address);
            
            if (!alreadyExists) {
                db.data.watchedWallets.push({ wallet: address, timestamp: Date.now(), chatId: ctx.chat.id, lastTx: null });
                await db.write();
            }
        }

        await ctx.reply(textReply, { parse_mode: 'HTML' }).catch(() => ctx.reply(textReply));
    } catch (err) {
        await ctx.reply(`❌ App Sync Failure: ${err.message}`);
    }
});

// 6. INITIALIZE BOT
bot.launch();
console.log("🔥 Agent System Active and Bound to GMGN Endpoints.");
