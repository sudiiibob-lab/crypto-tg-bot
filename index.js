import { Telegraf } from 'telegraf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { gmgnSkills } from '@gmgnai/gmgn-skills'; 
import axios from 'axios';
import dotenv from 'dotenv';
import { JSONFilePreset } from 'lowdb/node';

dotenv.config();

const db = await JSONFilePreset('db.json', { watchedWallets: [], activeTokens: [] });
const bot = new Telegraf(process.env.TELEGRAF_TOKEN);
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Force Gemini to absorb all native GMGN capabilities (Insiders, Swaps, Whale Tracking, Security)
const model = ai.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    tools: [{ functionDeclarations: gmgnSkills.getDeclarations() }] 
});

const MASTER_SYSTEM_PROMPT = `You are Brody, a pro crypto agent directly integrated with the GMGN.AI data infrastructure.

TONE PROTOCOL:
- Speak intelligently and clearly, just like an experienced developer or professional alpha trader.
- If the user sends a message in Pidgin English, you MUST reply back entirely in fluent West African Pidgin English.
- Do not use forced hype, generic filler words, or excessive emojis. Keep things clean and professional.

EXECUTION DIRECTIVE:
- When the user tells you to check a coin, inspect dev holdings, track insiders, check win rates, or swap tokens, select the corresponding function declaration from your tools and run it immediately. Never guess, never beat around the bush, and never explain the code backend to the user.`;

// Deep conversational function calling pipeline loop
async function handleConversationalEngine(userMessage) {
    const chatSession = model.startChat({
        history: [
            { role: 'user', parts: [{ text: MASTER_SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: "Trading modules online. Linked directly to native GMGN toolsets." }] }
        ]
    });

    let response = await chatSession.sendMessage(userMessage);
    
    // If Gemini decides it needs to perform an action using a GMGN skill
    if (response.response.functionCalls) {
        for (const call of response.response.functionCalls) {
            console.log(`[AI Triggered Action] Executing GMGN Skill: ${call.name}`);
            
            // Runs the underlying GMGN skill automatically using your background platform keys
            const toolResult = await gmgnSkills.execute(call.name, call.args, {
                apiKey: process.env.GMGN_API_KEY,
                privateKey: process.env.GMGN_PRIVATE_KEY
            });

            // Feeds raw JSON data from the blockchain/API back to Gemini to explain to you cleanly
            response = await chatSession.sendMessage([
                {
                    functionResponse: {
                        name: call.name,
                        response: { result: toolResult }
                    }
                }
            ]);
        }
    }
    
    return response.response.text();
}

// MAIN COMMAND INTERFACE
bot.on('text', async (ctx) => {
    try {
        await ctx.sendChatAction('typing');
        const replyText = await handleConversationalEngine(ctx.message.text);
        await ctx.reply(replyText, { parse_mode: 'HTML' }).catch(() => ctx.reply(replyText));
    } catch (err) {
        await ctx.reply(`❌ Agent Execution Failure: ${err.message}`);
    }
});

bot.launch();
console.log("🔥 Brody Agent System Active with Native GMGN Skills Configured.");
