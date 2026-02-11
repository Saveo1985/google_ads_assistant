import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useN8nTrigger } from '../../hooks/useN8nTrigger';
import { toast } from 'react-hot-toast';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface GoogleAdsSyncButtonProps {
    clientId: string;
    campaignId?: string;
    lastSyncedAt?: any;
}

export const GoogleAdsSyncButton: React.FC<GoogleAdsSyncButtonProps> = ({ clientId, campaignId, lastSyncedAt }) => {
    const { triggerWorkflow, isLoading } = useN8nTrigger();
    const [lastSyncTime, setLastSyncTime] = useState<any>(lastSyncedAt);

    // Sync state with prop
    useEffect(() => {
        setLastSyncTime(lastSyncedAt);
    }, [lastSyncedAt]);

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
                const clientRef = doc(db, 'apps', '2h_web_solutions_google_ads_asssitant_v1', 'clients', clientId);
                await updateDoc(clientRef, { lastSyncedAt: serverTimestamp() });


                setLastSyncTime(new Date());
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
        <div className="flex flex-col items-center">
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
                title={lastSyncTime ? `Last sync: ${lastSyncTime.toLocaleString()}` : 'Sync with Google Ads'}
            >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Syncing...' : 'Sync Ads'}</span>
            </button>
            <div className="text-center mt-2">
                <p className="text-[10px] text-gray-400 font-['Barlow']">
                    {lastSyncTime ?
                        `Letzter Sync: ${new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(lastSyncTime.toDate ? lastSyncTime.toDate() : new Date(lastSyncTime))}`
                        : "Noch nie synchronisiert"}
                </p>
            </div>
        </div>
    );
};
