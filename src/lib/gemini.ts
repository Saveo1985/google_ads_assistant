// src/lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BRAIN_RULES, type AgentRole } from "./ai/roles";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// KONFIGURATION: Wir verwenden strikt das neueste Modell laut Projekt-Vorgaben.
const MODEL_NAME = "gemini-3-pro-preview";

/**
 * Sendet einen Prompt an Gemini mit spezifischen "Brain Rules".
 * @param prompt Die User-Eingabe
 * @param role Die Rolle des Agenten (Standard: ASSISTANT)
 * @param context Optionaler Daten-Kontext (z.B. CSV-Inhalt als String)
 */
export async function getGeminiResponse(
    prompt: string,
    role: AgentRole = 'ASSISTANT',
    context: string = "",
    images: { mimeType: string; data: string }[] = []
): Promise<string> {
    if (!API_KEY) {
        console.error("⚠️ SYSTEM ERROR: VITE_GEMINI_API_KEY ist nicht gesetzt.");
        return "Systemfehler: API-Key fehlt. Bitte .env überprüfen.";
    }

    try {
        // 1. Modell Initialisierung (Gemini 3 Flash Preview)
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: BRAIN_RULES.CORE + "\n\n" + (BRAIN_RULES[role] || "")
        });

        // 2. Prompt Zusammensetzung (Multimodal)
        const parts: any[] = [];

        // Context & User Prompt
        const textPart = `
CONTEXT DATA:
${context}

USER QUESTION:
${prompt}
        `.trim();

        parts.push({ text: textPart });

        // Add Images
        images.forEach(img => {
            parts.push({
                inlineData: {
                    mimeType: img.mimeType,
                    data: img.data
                }
            });
        });

        // 3. Request
        const result = await model.generateContent(parts);
        const response = await result.response;
        return response.text();

    } catch (error: any) {
        console.error(`❌ Gemini Error (${MODEL_NAME}):`, error);

        // Spezifische Fehlerbehandlung für 404/Modell nicht gefunden
        if (error.message?.includes("404") || error.message?.includes("not found")) {
            return `Fehler: Das Modell '${MODEL_NAME}' ist nicht erreichbar oder der API-Key hat keinen Zugriff darauf.`;
        }

        return `⚠️ SYSTEM ERROR: ${error.message || "Unbekannter Fehler bei der KI-Verarbeitung."}`;
    }
}

/**
 * Analyzes a brand based on Name and URL to generate a business profile.
 * usage: const profile = await analyzeBrand("Nike", "nike.com", scrapedMarkdown);
 */
export async function analyzeBrand(name: string, url: string, scrapedData?: string) {
    let contextInstruction = `Analyze the brand "${name}" with website "${url}".`;

    if (scrapedData) {
        contextInstruction += `
        
        CRITICAL: Do not guess. Use the following SCRAPED CONTENT from the website to extract the data:
        ---
        ${scrapedData.substring(0, 8000)} 
        ---
        `;
    } else {
        contextInstruction += `
        Analyze based on the URL context and your knowledge base.
        `;
    }

    const prompt = `
    ${contextInstruction}
    I need a structured summary of this business.
    
    Return ONLY a raw JSON object (no markdown, no quotes) with these fields:
    {
      "industry": "Specific Industry (e.g. E-commerce Fashion)",
      "description": "A 2-sentence professional summary of what they do and who they serve.",
      "key_products": "Comma separated list of 3 potential main offerings",
      "suggested_strategy": "1 sentence marketing angle"
    }
  `;

    try {
        // Re-using your existing generic getGeminiResponse, or calling model directly if needed.
        // Assuming getGeminiResponse returns a string, we parse it.
        const responseText = await getGeminiResponse(prompt, 'ASSISTANT', 'Focus on factual business analysis.');

        // Clean up potential Markdown formatting from AI (e.g. ```json ... ```)
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("AI Analysis Failed:", error);
        // Fallback data if AI fails
        return {
            industry: "Unknown",
            description: `New client: ${name}. Website: ${url}`,
            key_products: "",
            suggested_strategy: "Manual review required."
        };
    }
}

/**
 * Refines client analysis data based on user feedback.
 * @param currentAnalysis The current JSON object of the client analysis.
 * @param userFeedback The user's natural language correction.
 */
export async function refineClientData(currentAnalysis: any, userFeedback: string) {
    const prompt = `
    You are correcting business intelligence data for a client.
    
    CURRENT DATA:
    ${JSON.stringify(currentAnalysis, null, 2)}
    
    USER CORRECTION:
    "${userFeedback}"
    
    TASK:
    Update the JSON strictly based on the correction. 
    - Keep the existing fields: "industry", "description", "key_products" (comma separated), "suggested_strategy".
    - Only change what the user asked to change.
    - If the user provides new info, integrate it intelligently.
    - Return ONLY the raw JSON object. No markdown.
    `;

    try {
        const responseText = await getGeminiResponse(prompt, 'ASSISTANT', 'Data refinement task.');
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("AI Refinement Failed:", error);
        throw new Error("Could not refine data.");
    }
}

