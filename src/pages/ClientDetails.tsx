import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, PlayCircle, PauseCircle, Archive as ArchiveIcon, Filter, Lightbulb, Target, Factory } from 'lucide-react';
import { onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { getAppDoc, getAppCollection } from '../lib/db';
import { updateCampaignStatus, type CampaignStatus } from '../lib/firebase/campaigns';
import CreateCampaignModal from '../components/campaigns/CreateCampaignModal';
import { DeleteConfirmationModal } from '../components/ui/DeleteConfirmationModal';
import ClientEconomicsSimulator from '../components/clients/ClientEconomicsSimulator';
import { CampaignCard } from '../components/campaigns/CampaignCard';

// Helper for Status Colors & Icons
const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any, bg: string }> = {
    'active': { label: 'Active', color: 'text-green-600', icon: PlayCircle, bg: 'bg-green-100' },
    'paused': { label: 'Paused', color: 'text-orange-600', icon: PauseCircle, bg: 'bg-orange-100' },
    'archived': { label: 'Archived', color: 'text-gray-500', icon: ArchiveIcon, bg: 'bg-gray-100' }
};

export default function ClientDetails() {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // UI State
    const [showArchived, setShowArchived] = useState(false);


    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [campaignToDelete, setCampaignToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (e: React.MouseEvent, campaign: any) => {
        e.stopPropagation();
        setCampaignToDelete(campaign);
        setDeleteModalOpen(true);
    };



    const changeStatus = async (e: React.MouseEvent, campaignId: string, newStatus: CampaignStatus) => {
        e.stopPropagation();
        if (!clientId) return;

        try {
            await updateCampaignStatus(clientId, campaignId, newStatus);
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Status could not be updated.");
        }
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

        // Close menu on click outside


        return () => {
            unsubClient();
            unsubCampaigns();

        };
    }, [clientId]);

    if (!client) return <div className="p-8">Loading Client...</div>;

    // Filter Logic
    const visibleCampaigns = campaigns.filter(c => showArchived || c.status !== 'archived');
    const archivedCount = campaigns.filter(c => c.status === 'archived').length;

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
                    <div className="flex items-center gap-3">
                        {archivedCount > 0 && (
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors font-['Barlow'] text-sm ${showArchived ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                <Filter size={16} />
                                {showArchived ? 'Hide Archived' : `Show Archived (${archivedCount})`}
                            </button>
                        )}
                        {/* Sync Button Removed */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-[#101010] text-[#B7EF02] px-5 py-2.5 rounded-lg hover:bg-gray-900 transition-colors font-['Barlow'] font-medium"
                        >
                            <Plus size={18} />
                            <span>New Campaign</span>
                        </button>
                    </div>
                </div>
            </div>


            {/* AI Business Intelligence Context */}
            <div className="bg-white border-l-4 border-[#B7EF02] shadow-sm rounded-r-xl p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="text-[#B7EF02]" size={20} />
                    <h2 className="text-lg font-['Federo'] text-gray-900">Strategic Context & AI Memory</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-['Barlow']">
                    <div>
                        <div className="flex items-start gap-3 mb-4">
                            <Factory className="text-gray-400 mt-1" size={16} />
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Industry / Niche</p>
                                <p className="text-gray-800">{client.industry || "Not specified"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="mt-1"><span className="text-gray-400 text-xs">📝</span></div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Business Description</p>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {client.description || "No description available."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-start gap-3">
                            <Target className="text-gray-400 mt-1" size={16} />
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Global Goals & KPIs</p>
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                    {client.goals || "No specific goals defined."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Economics Simulator */}
            <ClientEconomicsSimulator
                clientId={client.id}
                initialData={client.unitEconomics}
                initialServiceLines={client.serviceLines || (client.unitEconomics ? [{
                    id: 'default',
                    name: 'General',
                    currency: 'EUR',
                    ...client.unitEconomics
                }] : [])}
            />

            {/* Campaigns Grid */}
            <div className="grid grid-cols-1 gap-4">
                {visibleCampaigns.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 font-['Barlow']">{campaigns.length > 0 ? "No active campaigns. Check archived." : "No campaigns found. Launch the Assistant to import or create one."}</p>
                    </div>
                ) : (
                    visibleCampaigns.map((camp) => (
                        <CampaignCard
                            key={camp.id}
                            campaign={camp}
                            clientId={clientId!}
                            onNavigate={(id) => navigate(`/clients/${clientId}/campaigns/${id}`)}
                            onDelete={handleDeleteClick}
                            onChangeStatus={changeStatus}
                            statusConfig={STATUS_CONFIG}
                        />
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
