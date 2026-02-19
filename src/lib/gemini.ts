import { GoogleGenerativeAI } from "@google/generative-ai";
import { BRAIN_RULES, type AgentRole } from "./ai/roles";
import { getExpertKnowledge } from "./knowledge";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// KONFIGURATION: Wir verwenden strikt das neueste Modell laut Projekt-Vorgaben.
// STRICT: ONLY USE GEMINI 3 (FLASH OR PRO)
const MODEL_NAME = "gemini-3-flash-preview";

const OUTPUT_FORMAT_INSTRUCTION = `
####### OUTPUT FORMAT RULES (CRITICAL) #######
- Für Google Ads Assets (Headlines, Descriptions, Keywords):
  Nutze für JEDES EINZELNE Element einen separaten Code-Block (Triple-Backticks).
  NIEMALS mehrere Assets in einen Block schreiben.
  
  RICHTIG:
  Hier sind deine Headlines:
  \`\`\`Headline 1\`\`\`
  \`\`\`Headline 2\`\`\`
  
  FALSCH:
  \`\`\`
  Headline 1
  Headline 2
  \`\`\`
##############################################
`;
// ... (rest of file)


/**
 * Holt eine Antwort vom Google Ads Expert (RAG Light).
 * Lädt automatisch das Wissen aus Firestore und injiziert es in den Kontext.
 */
export async function getExpertResponse(prompt: string, userContext: string = ""): Promise<string> {
    try {
        // 1. Fetch "Long-Term Memory"
        const expertKnowledge = await getExpertKnowledge();

        // 2. Combine Context
        const combinedContext = `
        ${userContext}

        =============================================
        CRITICAL KNOWLEDGE BASE (LONG-TERM MEMORY):
        =============================================
        ${expertKnowledge}
        `;

        // 3. Call Gemini with EXPERT role
        return await getGeminiResponse(prompt, 'EXPERT', combinedContext);

    } catch (error: unknown) {
        console.error("Expert Response Failed:", error);
        return "Entschuldigung, ich kann gerade nicht auf mein Experten-Wissen zugreifen. (Fehler: Knowledge Retrieval)";
    }
}

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
        // 1. Modell Initialisierung
        const baseInstruction = BRAIN_RULES[role] || BRAIN_RULES.CORE;

        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: baseInstruction + "\n\n" + OUTPUT_FORMAT_INSTRUCTION
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

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`❌ Gemini Error (${MODEL_NAME}):`, error);

        // Spezifische Fehlerbehandlung für 404/Modell nicht gefunden
        if (errorMessage.includes("404") || errorMessage.includes("not found")) {
            return `Fehler: Das Modell '${MODEL_NAME}' ist nicht erreichbar oder der API-Key hat keinen Zugriff darauf.`;
        }

        return `⚠️ SYSTEM ERROR: ${errorMessage || "Unbekannter Fehler bei der KI-Verarbeitung."}`;
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
    3. Internal AI Knowledge (last resort - ONLY allowed if no URL was provided at all)

    CRITICAL RULE: If a URL was provided ("${url}") but 'Scraped Content' is missing or empty, YOU MUST NOT HALLUCINATE.
    Do not guess based on the domain name. Do not use training data.
    
    IF SCRAPING FAILED AND NO USER HINT:
    Return exactly:
    {
      "industry": "Scraping Failed",
      "description": "Could not read website. Please provide manual details or check the URL.",
      "key_products": "",
      "suggested_strategy": "Manual input required."
    }
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
        ⚠️ SCRAPING FAILED. NO SOURCE MATERIAL.
        Do not invent data. Follow the CRITICAL RULE above.
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
    } catch (error: unknown) {
        console.error("AI Analysis Failed:", error);
        return {
            industry: "Analysis Error",
            description: `System fail: ${error instanceof Error ? error.message : "Unknown error"}`,
            key_products: "",
            suggested_strategy: "Try again later."
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
    } catch (error: unknown) {
        console.error("AI Refinement Failed:", error);
        throw new Error("Could not refine data.");
    }
}

