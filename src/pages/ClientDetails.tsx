import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FolderOpen, Calendar } from 'lucide-react';
import { onSnapshot, doc, collection, query, orderBy } from 'firebase/firestore';
import { getAppDoc, getAppCollection } from '../lib/db';
import CampaignAssistant from '../components/CampaignAssistant';

export default function ClientDetails() {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [showAssistant, setShowAssistant] = useState(false);

    useEffect(() => {
        if (!clientId) return;

        // Fetch Client Info
        const unsubClient = onSnapshot(getAppDoc('clients', clientId), (doc) => {
            if (doc.exists()) setClient({ id: doc.id, ...doc.data() });
        });

        // Fetch Campaigns Sub-collection
        const q = query(getAppCollection(`clients/${clientId}/campaigns`), orderBy('createdAt', 'desc'));
        const unsubCampaigns = onSnapshot(q, (snapshot) => {
            setCampaigns(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => {
            unsubClient();
            unsubCampaigns();
        };
    }, [clientId]);

    if (!client) return <div className="p-8">Loading Client...</div>;

    return (
        <div className="relative h-full">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/clients')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft size={16} />
                    <span className="font-['Barlow']">Back to Clients</span>
                </button>

                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-['Federo'] text-gray-900">{client.name}</h1>
                        <a href={client.website} target="_blank" className="text-[#B7EF02] hover:underline font-['Barlow']">
                            {client.website}
                        </a>
                    </div>
                    <button
                        onClick={() => setShowAssistant(true)}
                        className="flex items-center gap-2 bg-[#101010] text-[#B7EF02] px-5 py-2.5 rounded-lg hover:bg-gray-900 transition-colors font-['Barlow'] font-medium"
                    >
                        <Plus size={18} />
                        <span>New Campaign</span>
                    </button>
                </div>
            </div>

            {/* Campaigns Grid */}
            <div className="grid grid-cols-1 gap-4">
                {campaigns.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 font-['Barlow']">No campaigns found. Launch the Assistant to import or create one.</p>
                    </div>
                ) : (
                    campaigns.map((camp) => (
                        <div key={camp.id} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-[#B7EF02] transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-[#F0F0F3] rounded-lg text-gray-600 group-hover:bg-[#f9fceb] group-hover:text-[#8cb800] transition-colors">
                                        <FolderOpen size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-['Federo'] text-gray-900">{camp.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="px-2 py-0.5 bg-gray-100 text-xs font-bold text-gray-500 rounded uppercase">{camp.status}</span>
                                            <span className="text-xs text-gray-400 font-['Barlow']">{camp.type}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                                        <Calendar size={12} />
                                        <span>Created {camp.createdAt?.toDate().toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Assistant Drawer */}
            {showAssistant && (
                <>
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setShowAssistant(false)} />
                    <CampaignAssistant clientId={clientId!} onClose={() => setShowAssistant(false)} />
                </>
            )}
        </div>
    );
}
