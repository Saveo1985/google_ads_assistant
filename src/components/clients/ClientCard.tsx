import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Trash2, FolderOpen, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { getDocs } from 'firebase/firestore';
import { getAppCollection, type Client } from '../../lib/db';

interface ClientCardProps {
    client: Client;
    onDelete?: (e: React.MouseEvent) => void;
}

export default function ClientCard({ client, onDelete }: ClientCardProps) {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Strict Navigation Handler
    const handleCampaignClick = (e: React.MouseEvent, campaignId: string) => {
        e.stopPropagation();
        e.preventDefault();

        if (!campaignId) {
            console.error("Critical Error: Missing Campaign ID in click handler");
            return;
        }

        // CORRECT ROUTE: /clients/:clientId/campaigns/:campaignId
        navigate(`/clients/${client.id}/campaigns/${campaignId}`);
    };

    // Fetch Campaigns on Mount
    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const coll = getAppCollection(`clients/${client.id}/campaigns`);
                const snapshot = await getDocs(coll);

                // MANDATORY: Explicit ID Map
                const campaignsList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                console.log(`Loaded ${campaignsList.length} campaigns for ${client.name}`, campaignsList);
                setCampaigns(campaignsList);
            } catch (error) {
                console.error("Error fetching campaigns:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, [client.id]);

    const handleCardClick = () => {
        navigate(`/clients/${client.id}`);  // Corrected: Plural 'clients'
    };

    const handleExternalLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (client.website) {
            window.open(client.website.startsWith('http') ? client.website : `https://${client.website}`, '_blank');
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) onDelete(e);
    };

    return (
        <div
            onClick={handleCardClick}
            className="group bg-white rounded-xl border border-gray-200 p-5 cursor-pointer 
                       transition-all duration-300 hover:shadow-xl hover:border-[#B7EF02] hover:-translate-y-1 relative overflow-hidden"
        >
            {/* Header: Avatar & Status */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#B7EF02] text-black font-['Federo'] font-bold text-lg flex items-center justify-center shadow-sm">
                        {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-['Federo'] text-lg text-gray-900 leading-tight group-hover:text-[#B7EF02] transition-colors">
                            {client.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs text-gray-500 font-medium font-['Barlow']">Active</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions (Top Right) */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {client.website && (
                        <button
                            onClick={handleExternalLink}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Visit Website"
                        >
                            <ExternalLink size={16} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Client"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Body: Stats & Dropdown */}
            <div className="py-2 space-y-2">
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        if (campaigns.length > 0) setIsDropdownOpen(!isDropdownOpen);
                    }}
                    className={`flex items-center gap-2 text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100 transition-colors ${campaigns.length > 0 ? 'hover:bg-[#B7EF02]/10 hover:border-[#B7EF02]/30 cursor-pointer' : 'opacity-70 cursor-default'
                        }`}
                >
                    <FolderOpen size={18} className="text-gray-400 group-hover:text-[#B7EF02] transition-colors" />
                    <span className="font-['Barlow'] text-sm font-medium flex-1">Campaigns</span>

                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 font-['Barlow']">
                            {loading ? (
                                <span className="animate-pulse bg-gray-200 h-4 w-6 rounded block"></span>
                            ) : (
                                campaigns.length
                            )}
                        </span>
                        {campaigns.length > 0 && (
                            <div className="text-gray-400">
                                {isDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                        )}
                    </div>
                </div>

                {/* Campaign Dropdown List */}
                {isDropdownOpen && (
                    <div className="bg-gray-50 rounded-lg border border-gray-100 divide-y divide-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                        {campaigns.map((camp: any) => (
                            <div
                                key={camp.id}
                                onClick={(e) => handleCampaignClick(e, camp.id)}
                                className="px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-[#B7EF02] cursor-pointer flex items-center justify-between transition-colors font-['Barlow']"
                            >
                                <span className="truncate">{camp.name}</span>
                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer: View Action */}
            <div className="mt-2 flex items-center justify-end text-xs font-medium text-gray-400 group-hover:text-[#B7EF02] transition-colors font-['Barlow']">
                <span className="mr-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    View Dashboard
                </span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
            </div>

            {/* Decorative Top Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#B7EF02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
    );
}
