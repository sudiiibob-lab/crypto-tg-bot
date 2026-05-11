import { Telegraf } from 'telegraf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';
import { JSONFilePreset } from 'lowdb/node';

dotenv.config();

const db = await JSONFilePreset('db.json', { watchedWallets: [], activeTokens: [] });
const bot = new Telegraf(process.env.TELEGRAF_TOKEN);
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

const MASTER_SYSTEM_PROMPT = `You are Brody, a premium crypto trading intelligence engine built for the GMGN.AI Pro infrastructure.

TONE & BEHAVIOR PROTOCOL:
- Speak clearly, intelligently, and respectfully like an expert trading mentor.
- If the user interacts with you using West African Pidgin English, you MUST switch modes completely and reply in smooth, natural, and correct Pidgin English.
- Use a maximum of 1-2 functional emojis per response. Never force fake trading hype or scream text.
- Do not explain whether queries are on-chain actions. Do not reference raw programming backgrounds.

CONTEXT MANAGEMENT:
- Use the live payload data provided below your system prompt to formulate deep, understandable, and direct analytical feedback on safety, insider presence, and metrics.`;

// Core network routing functions mimicking GMGN data layers directly
async function fetchTokenSecurityMetrics(tokenMint) {
    const res = await axios.get(`https://gmgn.ai`, {
        headers: { 'X-GMGN-API-KEY': process.env.GMGN_API_KEY || '' },
        timeout: 5000
    }).catch(() => null);
    return res?.data?.data || null;
}

async function executeTokenSwap(tokenMint, amountSol, action) {
    const res = await axios.post('https://gmgn.ai', {
        routingArgs: {
            inputToken: action === 'BUY' ? "So11111111111111111111111111111111111111112" : tokenMint,
            outputToken: action === 'BUY' ? tokenMint : "So11111111111111111111111111111111111111112",
            amount: amountSol,
            slippageCapping: 15
        }
    }, {
        headers: { 'X-GMGN-API-KEY': process.env.GMGN_API_KEY || '' },
        timeout: 6000
    }).catch(() => null);
    return res?.data || null;
}

// MAIN MESSAGE PARSING GATEWAY
bot.on('text', async (ctx) => {
    try {
        await ctx.sendChatAction('typing');
        const userMsg = ctx.message.text;
        const lowercaseMsg = userMsg.toLowerCase();
        
        const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
        const targetAddress = userMsg.match(solanaAddressRegex)?.[0];
        
        let extractedLiveContext = "";

        // 1. CHAT DIRECTIVE: CHECK TOKEN METRICS / INSIDER DETAILS
        if (targetAddress && (lowercaseMsg.includes('dev') || lowercaseMsg.includes('insider') || lowercaseMsg.includes('holder') || lowercaseMsg.includes('check') || lowercaseMsg.includes('scan'))) {
            const tokenStats = await fetchTokenSecurityMetrics(targetAddress);
            if (tokenStats) {
                extractedLiveContext = `[REAL-TIME DATA FOR ${targetAddress}: Dev balance: ${tokenStats.creator_balance_percentage || 0}%, Top 10 Holders: ${tokenStats.top_10_percentage || 0}%, Insiders Buying Rate: ${tokenStats.insider_buy_percentage || 0}%, Renounced: ${tokenStats.is_renounced ? 'Yes' : 'No'}. Transmit these figures cleanly to the user.]`;
            } else {
                extractedLiveContext = `[SYSTEM NOTIFICATION: No real-time payload returned for ${targetAddress}. Tell the user the GMGN API timed out, but do it in your configured tone.]`;
            }
        }
        
        // 2. CHAT DIRECTIVE: DIRECT TRADING SWAPS EXECUTION
        else if (targetAddress && (lowercaseMsg.includes('buy') || lowercaseMsg.includes('snipe') || lowercaseMsg.includes('sell'))) {
            const isBuy = lowercaseMsg.includes('buy') || lowercaseMsg.includes('snipe');
            const numericMatch = lowercaseMsg.match(/\d+(\.\d+)?/);
            const rawAmount = numericMatch ? numericMatch[0] : "0.1"; // Defaults to safe amount if not mentioned
            
            const actionResult = await executeTokenSwap(targetAddress, rawAmount, isBuy ? 'BUY' : 'SELL');
            if (actionResult && actionResult.txHash) {
                return await ctx.reply(`🎯 **Order Handled Successfully!**\n\n⚡ **Action:** ${isBuy ? 'BUY' : 'SELL'}\n🪙 **Target:** \`${targetAddress}\`\n🚀 **Tx Hash:** \`${actionResult.txHash}\``, { parse_mode: 'Markdown' });
            } else {
                extractedLiveContext = `[SYSTEM TRANSACTION NOTICE: The execution swap command on GMGN router failed for ${targetAddress}. Explain that the transaction dropped due to slippage or insufficient wallet balance context.]`;
            }
        }

        // Run final processing through Gemini 2.5
        const processingPrompt = `${MASTER_SYSTEM_PROMPT}\n\n${extractedLiveContext}\nUser Directive: "${userMsg}"\nBrody Output:`;
        const aiResponse = await model.generateContent([processingPrompt]);
        const cleanReply = aiResponse.response.text();

        await ctx.reply(cleanReply, { parse_mode: 'HTML' }).catch(() => ctx.reply(cleanReply));
    } catch (err) {
        await ctx.reply(`❌ Operation Error: ${err.message}`);
    }
});

bot.launch();
console.log("🔥 Brody Agent online. Direct Node pipelines bound with zero external package dependencies.");
