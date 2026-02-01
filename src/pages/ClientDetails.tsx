import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FolderOpen, Calendar, Trash2, Brain, Target } from 'lucide-react';
import { onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { getAppDoc, getAppCollection } from '../lib/db';
import CreateCampaignModal from '../components/campaigns/CreateCampaignModal';
import { DeleteConfirmationModal } from '../components/ui/DeleteConfirmationModal';

export default function ClientDetails() {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [campaignToDelete, setCampaignToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (e: React.MouseEvent, campaign: any) => {
        e.stopPropagation();
        setCampaignToDelete(campaign);
        setDeleteModalOpen(true);
    };

    const confirmDeleteCampaign = async () => {
        if (!campaignToDelete || !clientId) return;
        setIsDeleting(true);
        try {
            // Path: apps/{APP_ID}/clients/{clientId}/campaigns/{campaignId}
            await deleteDoc(getAppDoc(`clients/${clientId}/campaigns`, campaignToDelete.id));
            setDeleteModalOpen(false);
            setCampaignToDelete(null);
        } catch (error) {
            console.error("Error deleting campaign:", error);
            alert("Fehler beim Löschen der Kampagne.");
        } finally {
            setIsDeleting(false);
        }
    };

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
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-[#101010] text-[#B7EF02] px-5 py-2.5 rounded-lg hover:bg-gray-900 transition-colors font-['Barlow'] font-medium"
                    >
                        <Plus size={18} />
                        <span>New Campaign</span>
                    </button>
                </div>
            </div>

            {/* AI Business Intelligence Card */}
            {client.audit && (
                <div className="mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-[#101010] rounded text-[#B7EF02]">
                            <Brain size={20} />
                        </div>
                        <h2 className="text-xl font-['Federo'] text-gray-900">AI Business Intelligence</h2>
                        {client.industry && (
                            <span className="ml-2 px-3 py-1 bg-[#B7EF02]/20 text-black text-xs font-bold uppercase rounded-full font-['Barlow'] tracking-wide">
                                {client.industry}
                            </span>
                        )}
                    </div>

                    <p className="font-['Barlow'] text-gray-600 mb-6 leading-relaxed max-w-4xl">
                        {client.description || "No description available."}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Key Products */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase mb-3 font-['Barlow'] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-black rounded-full"></span> Key Products
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {(client.audit.products || "").split(',').map((prod: string, i: number) => (
                                    <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded text-sm text-gray-700 font-['Barlow']">
                                        {prod.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* AI Strategy */}
                        <div className="relative">
                            <h3 className="text-sm font-bold text-gray-900 uppercase mb-3 font-['Barlow'] flex items-center gap-2">
                                <Target size={14} /> Suggested Strategy
                            </h3>
                            <div className="p-4 bg-gray-50 border-l-4 border-[#B7EF02] text-gray-700 italic font-medium font-['Barlow'] rounded-r-lg">
                                "{client.audit.strategy}"
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Campaigns Grid */}
            <div className="grid grid-cols-1 gap-4">
                {campaigns.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 font-['Barlow']">No campaigns found. Launch the Assistant to import or create one.</p>
                    </div>
                ) : (
                    campaigns.map((camp) => (
                        <div
                            key={camp.id}
                            onClick={() => navigate(`/clients/${clientId}/campaigns/${camp.id}`)}
                            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-[#B7EF02] transition-colors cursor-pointer group"
                        >
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
                                    <button
                                        onClick={(e) => handleDeleteClick(e, camp)}
                                        className="mt-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Delete Campaign"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Wizard Modal */}
            {showCreateModal && (
                <CreateCampaignModal clientId={clientId!} onClose={() => setShowCreateModal(false)} />
            )}

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeleteCampaign}
                title="Kampagne Löschen"
                itemName={campaignToDelete?.name || 'Kampagne'}
                isLoading={isDeleting}
            />
        </div>
    );
}
