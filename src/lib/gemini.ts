import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ Missing VITE_GEMINI_API_KEY in .env file");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const runGemini = async (prompt: string): Promise<string> => {
    try {
        if (!API_KEY) throw new Error("Gemini API Key is missing.");

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return text;
    } catch (error: any) {
        console.error("Error communicating with Gemini:", error);

        // DEBUG MODE: Zeige die echte Fehlermeldung im Chat an
        // Damit sehen wir sofort, ob es "403 Forbidden", "Referer blocked" oder etwas anderes ist.
        return `⚠️ SYSTEM ERROR: ${error.message || JSON.stringify(error)}`;
    }
};
