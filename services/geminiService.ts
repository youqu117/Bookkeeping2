
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Tag, Account } from "../types";

export interface AIResponse {
  action: 'create' | 'analysis' | 'chat';
  text?: string;
  data?: any;
}

export const processWithGemini = async (
  userInput: string,
  context: { tags: Tag[], accounts: Account[], recentTransactions: Transaction[] },
  apiKey?: string
): Promise<AIResponse> => {
  // 优先使用传入的 API Key，其次尝试环境变量
  const finalApiKey = apiKey || (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;
  
  if (!finalApiKey) {
      return { action: 'chat', text: 'Please configure your Gemini API Key in Settings.' };
  }

  const ai = new GoogleGenAI({ apiKey: finalApiKey });
  
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
    Goal: Analyze user input and return a JSON object with action 'create', 'analysis', or 'chat'.
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
              action: { type: Type.STRING },
              text: { type: Type.STRING },
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
      
      return JSON.parse(response.text || '{}');
  } catch (error) {
      console.error("Gemini Error:", error);
      return { action: 'chat', text: "I'm having trouble thinking right now. Please check your API Key." };
  }
};
