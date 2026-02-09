import React, { useEffect, useState } from 'react';
import { Plus, Briefcase, Search } from 'lucide-react';
import { onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { getAppCollection, getAppDoc, type Client } from '../lib/db';
import ClientAssistant from '../components/ClientAssistant';
import ClientCard from '../components/clients/ClientCard';
import { DeleteConfirmationModal } from '../components/ui/DeleteConfirmationModal';
import { useTranslation } from 'react-i18next';

export default function Clients() {
    const { t } = useTranslation();
    const [clients, setClients] = useState<Client[]>([]);
    const [showAssistant, setShowAssistant] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (e: React.MouseEvent, client: Client) => {
        e.stopPropagation(); // Prevent navigation
        setClientToDelete(client);
        setDeleteModalOpen(true);
    };

    const confirmDeleteClient = async () => {
        if (!clientToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(getAppDoc('clients', clientToDelete.id));
            setDeleteModalOpen(false);
            setClientToDelete(null);
        } catch (error) {
            console.error("Error deleting client:", error);
            alert("Fehler beim Löschen des Clients.");
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        const q = query(getAppCollection('clients'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Client[];
            setClients(clientData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-['Federo'] text-gray-900">{t('clients.title')}</h1>
                    <p className="text-gray-500 font-['Barlow']">Manage your client portfolio</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('clients.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#B7EF02] w-full md:w-64 font-['Barlow']"
                        />
                    </div>
                    <button
                        onClick={() => setShowAssistant(true)}
                        className="flex items-center gap-2 bg-[#101010] text-[#B7EF02] px-5 py-2.5 rounded-lg hover:bg-gray-900 transition-colors font-['Barlow'] font-medium whitespace-nowrap"
                    >
                        <Plus size={18} />
                        <span>{t('clients.add_new')}</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400">{t('common.loading')}</div>
            ) : clients.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <Briefcase className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900">No clients yet</h3>
                    <p className="text-gray-500 mb-4">Use the Assistant to onboard your first client.</p>
                    <button
                        onClick={() => setShowAssistant(true)}
                        className="text-[#101010] underline font-medium"
                    >
                        Open Assistant
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                        <ClientCard
                            key={client.id}
                            client={client}
                            onDelete={(e) => handleDeleteClick(e, client)}
                        />
                    ))}
                </div>
            )}

            {/* Assistant Drawer */}
            {showAssistant && (
                <>
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setShowAssistant(false)} />
                    <ClientAssistant onClose={() => setShowAssistant(false)} />
                </>
            )}

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeleteClient}
                title={t('common.delete') + " Client"}
                itemName={clientToDelete?.name || 'Client'}
                isLoading={isDeleting}
            />
        </div>
    );
}
