
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Parses user input into a structured expense object using Gemini.
 */
export const parseExpenseMessage = async (message: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const currentDate = new Date().toISOString().split('T')[0];
    
    const systemInstruction = `## ROLE
You are a Financial Data Parser for the SmartSpend app. Your sole task is to convert natural language into a valid JSON object matching a PostgreSQL schema.

## RULES
1. If the user mentions a relative date like "yesterday," calculate the date relative to [CURRENT_DATE].
2. If no category is obvious, default to "Other."
3. Always format the amount as a positive number.
4. If a specific category name is implied (like 'gym membership' -> 'Health' or 'Gym' if custom), try to match context.
5. Today's date [CURRENT_DATE] is: ${currentDate}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: {
              type: Type.NUMBER,
              description: "The expense amount as a float",
            },
            category: {
              type: Type.STRING,
              description: "The most appropriate category name",
            },
            description: {
              type: Type.STRING,
              description: "Short summary of the expense",
            },
            date: {
              type: Type.STRING,
              description: "Date in YYYY-MM-DD format",
            },
          },
          required: ["amount", "category", "description", "date"],
        },
      },
    });

    const text = response.text.trim();
    const result = JSON.parse(text);
    
    return result;
  } catch (error) {
    console.error("Error parsing expense with Gemini:", error);
    return null;
  }
};
