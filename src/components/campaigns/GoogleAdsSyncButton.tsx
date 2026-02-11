import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useN8nTrigger } from '../../hooks/useN8nTrigger';
import { toast } from 'react-hot-toast';

interface GoogleAdsSyncButtonProps {
    clientId: string;
    campaignId?: string;
}

export const GoogleAdsSyncButton: React.FC<GoogleAdsSyncButtonProps> = ({ clientId, campaignId }) => {
    const { triggerWorkflow, isLoading } = useN8nTrigger();
    const [lastSync, setLastSync] = useState<string | null>(null);

    const handleSync = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        // Flexible URL detection: Specific > Generic
        const webhookUrl = import.meta.env.VITE_GOOGLE_ADS_SYNC_WEBHOOK_URL || import.meta.env.VITE_N8N_WEBHOOK_URL || import.meta.env.VITE_N8N_SYNC_WEBHOOK;

        console.log("Attempting Sync with Webhook URL:", webhookUrl ? "Found" : "Missing", webhookUrl);

        if (!webhookUrl) {
            toast.error("Configuration Error: Sync Webhook URL not set.", {
                // description: "Please check VITE_N8N_WEBHOOK_URL in your .env file." // react-hot-toast doesn't support description in standard error
                duration: 5000
            });
            console.error("Please check VITE_GOOGLE_ADS_SYNC_WEBHOOK_URL or VITE_N8N_WEBHOOK_URL in your .env file.");
            return;
        }

        const toastId = toast.loading("Syncing with Google Ads...");

        try {
            const result = await triggerWorkflow(webhookUrl, {
                clientId,
                campaignId,
                action: "sync_campaigns",
                timestamp: new Date().toISOString()
            });

            if (result) {
                setLastSync(new Date().toLocaleTimeString());
                toast.success("Google Ads Sync Complete", { id: toastId });
            } else {
                throw new Error("No response from workflow");
            }
        } catch (err) {
            console.error("Sync failed:", err);
            toast.error("Sync Failed. Check console.", {
                id: toastId
            });
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={isLoading}
            className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
        ${isLoading
                    ? 'bg-gray-100 text-gray-400 cursor-wait'
                    : 'bg-[#B7EF02] hover:bg-[#a6d902] text-black shadow-sm hover:shadow-md'
                }
      `}
            title={lastSync ? `Last sync: ${lastSync}` : 'Sync with Google Ads'}
        >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync Ads'}</span>
        </button>
    );
};
