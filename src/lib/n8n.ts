// src/lib/n8n.ts

const N8N_SCRAPE_URL = import.meta.env.VITE_N8N_SCRAPE_URL || "";

export interface ScrapeResult {
    content: string;
    error?: string;
}

/**
 * Calls the n8n Universal Web Scraper workflow.
 * @param url The website URL to scrape.
 * @returns The markdown content of the website.
 */
export async function scrapeWebsite(url: string): Promise<ScrapeResult> {
    if (!N8N_SCRAPE_URL) {
        console.error("⚠️ System Error: VITE_N8N_SCRAPE_URL is missing.");
        return { content: "", error: "Configuration Error: Scraper URL not set." };
    }

    try {
        const response = await fetch(N8N_SCRAPE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            throw new Error(`N8N Error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.content || data.data || ""; // Support both potential return formats

        return { content };

    } catch (error: unknown) {
        console.error("❌ Scraper Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to scrape website.";
        return { content: "", error: errorMessage };
    }
}
