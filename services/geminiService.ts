
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Tag, Account } from "../types";

export interface AIResponse {
  action: 'create' | 'analysis' | 'chat';
  text?: string;
  data?: any;
}

export const processWithGemini = async (
  userInput: string,
  context: { tags: Tag[], accounts: Account[], recentTransactions: Transaction[] }
): Promise<AIResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
      return { action: 'chat', text: 'API Key is missing.' };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const tagContext = context.tags.map(t => 
    `Tag: "${t.name}" (ID: ${t.id})${t.subTags.length > 0 ? `, SubTags: [${t.subTags.join(', ')}]` : ''}`
  ).join('\n');
  
  const accountContext = context.accounts.map(a => 
    `Account: "${a.name}" (ID: ${a.id})`
  ).join('\n');

  const txContext = JSON.stringify(context.recentTransactions.slice(0, 10).map(t => ({
      date: new Date(t.date).toLocaleDateString(),
      amount: t.amount,
      type: t.type,
      note: t.note
  })));

  const systemInstruction = `
    You are an intelligent financial assistant for ZenLedger, a minimalist bookkeeping app.
    
    Current Context:
    - Current Date: ${new Date().toLocaleDateString()}
    - Available Accounts:
    ${accountContext}
    - Available Tags (Categories):
    ${tagContext}
    - Recent Transactions:
    ${txContext}

    Goal: Analyze user input and return a JSON object.
    
    SCENARIO 1: RECORD A TRANSACTION
    If the user wants to log spending/income:
    - Extract: amount (number), type (expense/income), accountId, tags (array of IDs), note.
    - Result: { "action": "create", "data": { "amount": 20, "type": "expense", "accountId": "a1", "tags": ["1"], "note": "lunch" }, "text": "I've prepared the transaction for you." }

    SCENARIO 2: ANALYSIS
    If user asks for insights:
    - Result: { "action": "analysis", "text": "Your food spending increased by 20% this week..." }

    SCENARIO 3: CHAT
    - Result: { "action": "chat", "text": "Hello! How can I help with your finances today?" }

    Always return JSON matching the specified format.
  `;

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: userInput }] }],
        config: { 
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING, description: "One of 'create', 'analysis', 'chat'" },
              text: { type: Type.STRING, description: "Helpful response text" },
              data: { 
                type: Type.OBJECT,
                properties: {
                  amount: { type: Type.NUMBER },
                  type: { type: Type.STRING },
                  accountId: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  note: { type: Type.STRING }
                }
              }
            },
            required: ['action', 'text']
          }
        }
      });
      
      const responseText = response.text;
      if (!responseText) throw new Error("Empty response from AI");
      
      return JSON.parse(responseText);
  } catch (error) {
      console.error("Gemini Error:", error);
      return { action: 'chat', text: "I'm having trouble thinking right now. Please try again." };
  }
};
