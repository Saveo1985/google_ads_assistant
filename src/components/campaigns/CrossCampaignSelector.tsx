import React, { useEffect, useState } from 'react';
import { Share2, Link, Check, Square, CheckSquare } from 'lucide-react';
import { onSnapshot, query, getDocs, collection, where } from 'firebase/firestore';
import { getAppCollection } from '../../lib/db';

interface CrossCampaignSelectorProps {
    clientId: string;
    currentCampaignId: string;
    onContextChange: (contextString: string) => void;
}

export default function CrossCampaignSelector({ clientId, currentCampaignId, onContextChange }: CrossCampaignSelectorProps) {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isOpen, setIsOpen] = useState(false);

    // 1. Fetch Sibling Campaigns
    useEffect(() => {
        if (!clientId) return;

        const q = getAppCollection(`clients/${clientId}/campaigns`);
        const unsub = onSnapshot(q, (snapshot) => {
            const siblings = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter((c: any) => c.id !== currentCampaignId); // Exclude current
            setCampaigns(siblings);
        });

        return () => unsub();
    }, [clientId, currentCampaignId]);

    // 2. Handle Selection & Context Building
    const toggleCampaign = async (campaignId: string, campaignName: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(campaignId)) {
            newSet.delete(campaignId);
        } else {
            newSet.add(campaignId);
        }
        setSelectedIds(newSet);

        // Build Context from Selected Campaigns
        if (newSet.size === 0) {
            onContextChange("");
            return;
        }

        const contexts: string[] = [];

        // Iterate through all selected IDs and fetch their Knowledge Base "Strategy" or "Summary"
        for (const id of Array.from(newSet)) {
            const camp = campaigns.find(c => c.id === id);
            if (!camp) continue;

            try {
                // Determine what to fetch. 
                // Priority: 'strategy_brief' > 'csv' summary > 'memory_base' field

                let campaignContext = `[CROSS-REFERENCE: ${camp.name}]\n`;

                // A. Check 'knowledge_base' subcollection for Strategy Briefs
                const kbRef = getAppCollection(`clients/${clientId}/campaigns/${id}/knowledge_base`);
                // Simple fetch of all KB items for now (limit 5 to avoid huge payload)
                const kbSnapshot = await getDocs(kbRef);

                const strategyDocs = kbSnapshot.docs.filter(d => d.data().type === 'strategy_brief');

                if (strategyDocs.length > 0) {
                    campaignContext += `STRATEGY: ${strategyDocs[0].data().content}\n`;
                } else if (camp.goal) {
                    campaignContext += `GOAL: ${camp.goal}\n`;
                }

                contexts.push(campaignContext);

            } catch (err) {
                console.error(`Error fetching context for ${id}`, err);
            }
        }

        onContextChange(contexts.join('\n---\n'));
    };

    if (campaigns.length === 0) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                title="Connect other campaigns to share knowledge"
            >
                <div className="flex items-center gap-2 text-gray-700 font-['Barlow'] font-medium">
                    <Share2 size={16} className="text-[#B7EF02]" />
                    <span>Connect Knowledge Base</span>
                </div>
                {selectedIds.size > 0 && (
                    <span className="bg-[#B7EF02] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                        {selectedIds.size}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="p-2 space-y-1 bg-white">
                    {campaigns.map(camp => {
                        const isSelected = selectedIds.has(camp.id);
                        return (
                            <button
                                key={camp.id}
                                onClick={() => toggleCampaign(camp.id, camp.name)}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-all ${isSelected
                                        ? 'bg-[#fcfdec] text-gray-900 border border-[#B7EF02]/50'
                                        : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`text-[#B7EF02] transition-transform ${isSelected ? 'scale-110' : 'opacity-50'}`}>
                                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                </div>
                                <span className="font-['Barlow'] truncate">{camp.name}</span>
                                {isSelected && <Link size={12} className="ml-auto text-[#B7EF02]" />}
                            </button>
                        );
                    })}
                    <div className="p-2 text-[10px] text-gray-400 text-center border-t border-gray-100 mt-2">
                        Selected campaigns will share their strategy with the AI.
                    </div>
                </div>
            )}
        </div>
    );
}
