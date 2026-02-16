// src/lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BRAIN_RULES, type AgentRole } from "./ai/roles";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// KONFIGURATION: Wir verwenden strikt das neueste Modell laut Projekt-Vorgaben.
// STRICT: ONLY USE GEMINI 3 (FLASH OR PRO)
const MODEL_NAME = "gemini-3-flash-preview";

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
            systemInstruction: BRAIN_RULES[role] || BRAIN_RULES.CORE
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
 * Attempts to scrape the website content.
 * Note: Client-side scraping is limited by CORS. In a production app, this should call a backend proxy or n8n webhook.
 */
export async function scrapeWebsite(url: string): Promise<string | null> {
    try {
        // Simple fetch - often blocked by CORS, but we try specific endpoints or proxies if configured.
        // For now, we attempt a direct fetch.
        const response = await fetch(url, { method: 'GET', mode: 'cors' });
        if (!response.ok) throw new Error("Network response was not ok");
        const text = await response.text();

        // Basic HTML cleanup to get text content
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        return doc.body.innerText.slice(0, 5000); // Limit context
    } catch (error) {
        console.warn("Client-side scraping failed (CORS or Network):", error);
        return null;
    }
}

/**
 * Analyzes a brand based on Name and URL to generate a business profile.
 * usage: const profile = await analyzeBrand("Nike", "nike.com", scrapedMarkdown);
 */
export async function analyzeBrand(name: string, url: string, scrapedData?: string, userHint?: string) {
    let contextInstruction = `Analyze the brand "${name}" with website "${url}".`;

    // STRICT REALITY HIERARCHY
    contextInstruction += `
    
    STRICT REALITY HIERARCHY:
    1. Scraped Content (Highest Priority) - IF AVAILABLE, YOU MUST USE THIS. IGNORE INTERNAL KNOWLEDGE.
    2. User Hints (Overrides everything if provided)
    3. Internal AI Knowledge (last resort)

    CRITICAL RULE: If Scraped Content is provided, YOU MUST IGNORE all prior knowledge about the domain.
    If the content says 'Service', do not assume 'E-Commerce'.
    DO NOT HALLUCINATE.
    `;

    if (userHint) {
        contextInstruction += `
        USER HINT (PRIORITY 2 - Contextual Override):
        "${userHint}"
        `;
    }

    if (scrapedData) {
        contextInstruction += `
        
        SOURCE MATERIAL (PRIORITY 1 - TRUTH):
        ---
        ${scrapedData}
        ---
        
        Instruction: Extract facts ONLY from the Source Material above.
        `;
    } else {
        contextInstruction += `
        No scraped data available. Analyze based on URL context and internal knowledge.
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
        const responseText = await getGeminiResponse(prompt, 'ASSISTANT', 'Focus on strict factual analysis from provided context.');
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("AI Analysis Failed:", error);
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

