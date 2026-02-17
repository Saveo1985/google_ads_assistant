import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getAppCollection } from '../lib/db';
import { useTranslation } from 'react-i18next';
import { Briefcase, FolderOpen, ArrowRight } from 'lucide-react';

interface ClientWithCampaigns {
    id: string;
    name: string;
    campaigns: any[];
}

export default function AllCampaigns() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [data, setData] = useState<ClientWithCampaigns[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Clients
                const clientsSnapshot = await getDocs(query(getAppCollection('clients'), orderBy('name')));
                const clients = clientsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, campaigns: [] }));

                // 2. Fetch Campaigns for each client
                const results = await Promise.all(clients.map(async (client) => {
                    const campaignsSnapshot = await getDocs(query(getAppCollection(`clients/${client.id}/campaigns`), orderBy('createdAt', 'desc')));
                    const campaigns = campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    return { ...client, campaigns };
                }));

                // 3. Filter out clients with 0 campaigns (optional, but cleaner)
                // user wants to see all campaigns, maybe keeping clients without campaigns is not useful here?
                // keeping all for now to show hierarchy
                setData(results);
            } catch (error) {
                console.error("Error fetching all campaigns:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500 font-['Barlow']">Loading Campaigns...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-['Federo'] text-gray-900">{t('nav.campaigns')}</h1>
                <p className="text-gray-500 font-['Barlow']">Overview of all active campaigns across clients</p>
            </div>

            <div className="space-y-8">
                {data.map((client) => (
                    <div key={client.id} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                        {/* Client Name - Big & Bold */}
                        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
                            <Briefcase className="text-[#B7EF02]" size={24} />
                            <h2 className="text-2xl font-bold font-['Federo'] text-gray-900 leading-none">
                                {client.name}
                            </h2>
                        </div>

                        {/* Campaigns List */}
                        {client.campaigns.length === 0 ? (
                            <p className="text-gray-400 font-['Barlow'] italic text-sm ml-9">No campaigns found.</p>
                        ) : (
                            <div className="grid gap-3 ml-2 md:ml-9">
                                {client.campaigns.map((camp) => (
                                    <button
                                        key={camp.id}
                                        onClick={() => navigate(`/clients/${client.id}/campaigns/${camp.id}`)}
                                        className="group flex items-center justify-between p-4 bg-gray-50 hover:bg-[#F0F0F3] rounded-lg border border-transparent hover:border-[#B7EF02] transition-all text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FolderOpen className="text-gray-400 group-hover:text-[#B7EF02] transition-colors" size={20} />
                                            <div>
                                                <h3 className="font-['Barlow'] font-medium text-gray-900 text-lg group-hover:text-black">
                                                    {camp.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-['Barlow'] font-medium
                                                        ${camp.status === 'active' ? 'bg-green-100 text-green-700' :
                                                            camp.status === 'paused' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-gray-100 text-gray-500'}`}>
                                                        {camp.status?.toUpperCase() || 'UNKNOWN'}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-['Barlow'] ml-2">
                                                        Click to open Assistant
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="text-gray-300 group-hover:text-[#B7EF02] transition-colors" size={20} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {data.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <FolderOpen className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-gray-900">No data found</h3>
                        <p className="text-gray-500">Create clients and campaigns to see them here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
