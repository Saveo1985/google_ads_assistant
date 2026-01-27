import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface N8nResponse {
    success: boolean;
    data?: any;
    message?: string;
}

export const useN8nTrigger = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<N8nResponse | null>(null);
    const { user } = useAuth();

    /**
     * Triggers an n8n webhook with the provided payload.
     * Automatically injects user metadata for security and auditing.
     */
    const triggerWorkflow = async (webhookUrl: string, payload: Record<string, any> = {}) => {
        setIsLoading(true);
        setError(null);
        setResponse(null);

        try {
            // Enforce context awareness: Attach User ID and App ID to every request
            const enrichedPayload = {
                ...payload,
                _metadata: {
                    userId: user?.uid || 'anonymous',
                    timestamp: new Date().toISOString(),
                    appId: '2h_web_solutions_google_ads_asssitant_v1',
                    source: 'web_client'
                }
            };

            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(enrichedPayload),
            });

            if (!res.ok) {
                throw new Error(`Workflow execution failed: ${res.statusText}`);
            }

            // Handle cases where n8n returns JSON or plain text
            const contentType = res.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                data = await res.text();
            }

            setResponse({ success: true, data });
            return data;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            setResponse({ success: false, message: errorMessage });
            console.error("n8n Trigger Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return { triggerWorkflow, isLoading, error, response };
};
