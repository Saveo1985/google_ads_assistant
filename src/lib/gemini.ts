import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const getGeminiResponse = async (
    userPrompt: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    memoryBaseContext: string
) => {
    // Validierung des API-Keys
    if (!API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY ist nicht in der .env definiert oder leer.");
    }

    try {
        // Wir nutzen Gemini 1.5 Flash für Geschwindigkeit
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            },
        });

        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 2048,
            },
        });

        // System-Instruktion inkl. der CSV-Daten (Memory Base)
        const systemInstruction = `
    Du bist der "2H Web Solutions Google Ads Assistant". 
    Deine Aufgabe ist es, Kampagnen-Daten zu analysieren und strategische Tipps zu geben.
    
    KONTEXT AUS DER MEMORY-BASE (CSV):
    ${memoryBaseContext || "Keine spezifischen Daten hochgeladen."}
    
    REGELN:
    1. Antworte präzise und datenbasiert.
    2. Wenn du Aufgaben identifizierst, formuliere sie klar.
    3. Nutze die oben genannten CSV-Daten als primäre Informationsquelle für diese Kampagne.
  `;

        const finalPrompt = `System-Info: ${systemInstruction}\n\nUser-Frage: ${userPrompt}`;

        const result = await chat.sendMessage(finalPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        // Fehler weiterwerfen, damit die UI darauf reagieren kann
        // Keine sensiblen Daten loggen!
        throw error;
    }
};
