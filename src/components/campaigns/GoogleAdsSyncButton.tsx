import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useN8nTrigger } from '../../hooks/useN8nTrigger';
import toast from 'react-hot-toast';

interface Props {
    clientId: string;
    campaignId?: string;
}

const SYNC_WEBHOOK_URL = import.meta.env.VITE_N8N_SYNC_WEBHOOK || "";

export const GoogleAdsSyncButton: React.FC<Props> = ({ clientId, campaignId }) => {
    const { triggerWorkflow, isLoading } = useN8nTrigger();

    const handleSync = async () => {
        if (!SYNC_WEBHOOK_URL) {
            toast.error("Configuration Error: Sync Webhook URL not set.");
            return;
        }

        try {
            await triggerWorkflow(SYNC_WEBHOOK_URL, {
                action: 'sync_google_ads',
                clientId,
                campaignId // Optional: if provided, sync only this campaign
            });
            toast.success("Google Ads Sync Triggered!");
        } catch (error) {
            console.error("Sync failed:", error);
            toast.error("Failed to trigger sync.");
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={isLoading}
            className="flex items-center gap-2 bg-[#B7EF02] text-black px-4 py-2 rounded-lg hover:bg-[#a3d602] transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
        >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            <span>{isLoading ? "Syncing..." : "Sync Ads"}</span>
        </button>
    );
};
