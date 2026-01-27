import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink, Briefcase } from 'lucide-react';
import { onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAppCollection, Client } from '../lib/db';
import ClientAssistant from '../components/ClientAssistant';

export default function Clients() {
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [showAssistant, setShowAssistant] = useState(false);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="relative h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-['Federo'] text-gray-900">Clients</h1>
                    <p className="text-gray-500 font-['Barlow']">Manage your client portfolio</p>
                </div>
                <button
                    onClick={() => setShowAssistant(true)}
                    className="flex items-center gap-2 bg-[#101010] text-[#B7EF02] px-5 py-2.5 rounded-lg hover:bg-gray-900 transition-colors font-['Barlow'] font-medium"
                >
                    <Plus size={18} />
                    <span>Add Client</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading clients...</div>
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
                    {clients.map((client) => (
                        <div
                            key={client.id}
                            onClick={() => navigate(`/clients/${client.id}`)}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-lg bg-[#F0F0F3] flex items-center justify-center text-xl font-['Federo'] text-gray-700">
                                    {client.name.substring(0, 1)}
                                </div>
                                <a
                                    href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-[#B7EF02] transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ExternalLink size={18} />
                                </a>
                            </div>
                            <h3 className="text-xl font-['Federo'] text-gray-900 mb-1">{client.name}</h3>
                            <p className="text-sm text-gray-500 font-['Barlow'] mb-4 truncate">{client.website}</p>

                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">ACTIVE</span>
                                <span className="text-xs text-gray-400">Campaigns: 0</span>
                            </div>
                        </div>
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
        </div>
    );
}
