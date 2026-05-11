import { Telegraf } from 'telegraf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';
import { JSONFilePreset } from 'lowdb/node';
import { execSync } from 'child_process';

dotenv.config();

const db = await JSONFilePreset('db.json', { watchedWallets: [], activeTokens: [] });
const bot = new Telegraf(process.env.TELEGRAF_TOKEN);
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Programmatic bridge to execute GMGN tasks via CLI
 */
function runGmgnCliCommand(actionName, argumentsObject) {
  try {
    // Format JSON arguments cleanly for terminal ingestion strings
    const jsonArgs = JSON.stringify(argumentsObject).replace(/"/g, '\\"');
    const systemOutput = execSync(
      `gmgn-cli run ${actionName} --args "${jsonArgs}" --key "${process.env.GMGN_PRIVATE_KEY}" --api "${process.env.GMGN_API_KEY}" --raw`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return JSON.parse(systemOutput.trim());
  } catch (error) {
    console.error(`[GMGN CLI Execution Failure]: ${error.stderr || error.message}`);
    return { error: true, details: error.message };
  }
}

// Fetch the schema model structures directly from the source repository reference to avoid local imports
let fetchedDeclarations = [];
try {
  const remoteSchema = await axios.get('githubusercontent.com');
  fetchedDeclarations = remoteSchema.data;
} catch (fetchError) {
  console.error("⚠️ Failed to load declarations remotely, using fallback templates.");
  // Basic fallback declaration scheme array if network times out
  fetchedDeclarations = [{
    name: "market_trending",
    description: "Fetch trending tokens list from GMGN data grid",
    parameters: { type: "OBJECT", properties: { chain: { type: "STRING" } } }
  }];
}

// INITIALIZE MODEL WITH THE RESOLVED SYSTEM DECLARATIONS
const model = ai.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    tools: [{ functionDeclarations: fetchedDeclarations }] 
});

const MASTER_SYSTEM_PROMPT = `You are Brody, a pro crypto agent directly integrated with the GMGN.AI data infrastructure.

TONE PROTOCOL:
- Speak intelligently and clearly, just like an experienced developer or professional alpha trader.
- If the user sends a message in Pidgin English, you MUST reply back entirely in fluent West African Pidgin English.
- Do not use forced hype, generic filler words, or excessive emojis. Keep things clean and professional.

EXECUTION DIRECTIVE:
- When the user tells you to check a coin, inspect dev holdings, track insiders, check win rates, or swap tokens, select the corresponding function declaration from your tools and run it immediately. Never guess, never beat around the bush, and never explain the code backend to the user.`;

// Conversational engine processing automatic tool routing
async function handleConversationalEngine(userMessage, telegramContext) {
    const chatSession = model.startChat({
        history: [
            { role: 'user', parts: [{ text: MASTER_SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: "Trading modules online. Linked directly to native GMGN toolsets." }] }
        ]
    });

    let response = await chatSession.sendMessage(userMessage);
    
    // Automatically intercept if Gemini requests a data check from GMGN Skills
    if (response.response.functionCalls) {
        for (const call of response.response.functionCalls) {
            console.log(`[AI Triggered Action] Executing GMGN Skill: ${call.name}`);
            
            // Secure check to restrict live swaps execution to your specific account admin profile
            if ((call.name.includes('swap') || call.name.includes('trade')) && telegramContext.from.username !== process.env.TELEGRAM_ADMIN_USERNAME) {
                return "⚠️ Security Guard Notice: Access Denied. Live transaction executions are restricted to the primary wallet owner parameters.";
            }

            // Execute the live data package call using the local command line binary utility runner
            const toolResult = runGmgnCliCommand(call.name, call.args);

            // Send raw numbers back into Gemini so it gives you a clean human answer
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

// CHAT INTERFACE BOUNDS
bot.on('text', async (ctx) => {
    try {
        await ctx.sendChatAction('typing');
        const replyText = await handleConversationalEngine(ctx.message.text, ctx);
        await ctx.reply(replyText, { parse_mode: 'HTML' }).catch(() => ctx.reply(replyText));
    } catch (err) {
        await ctx.reply(`❌ Engine Sync Failure: ${err.message}`);
    }
});

bot.launch();
console.log("🔥 Brody Agent System Active with Native GMGN Skills Configured.");
