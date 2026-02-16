import React, { useState } from 'react';
import { FolderOpen, Calendar, Trash2, Check, BarChart2 } from 'lucide-react';
import { CampaignPerformanceModal } from './CampaignPerformanceModal';
import { GoogleAdsSyncButton } from './GoogleAdsSyncButton';

// Using types from previous context or defining locally if needed
type CampaignStatus = 'active' | 'paused' | 'archived';

interface Campaign {
    id: string;
    name: string;
    status: CampaignStatus;
    type?: string;
    createdAt?: any; // Firestore Timestamp
    stats?: any;
}

interface CampaignCardProps {
    campaign: Campaign;
    onNavigate: (id: string) => void;
    onDelete: (e: React.MouseEvent, campaign: Campaign) => void;
    onChangeStatus: (e: React.MouseEvent, id: string, status: CampaignStatus) => void;
    statusConfig: Record<string, { label: string, color: string, icon: any, bg: string }>;
    onClick?: (e: React.MouseEvent) => void;
    clientId: string;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onNavigate, onDelete, onChangeStatus, statusConfig, clientId }) => {
    const [showPerformance, setShowPerformance] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const status = campaign.status || 'active';
    const config = statusConfig[status] || statusConfig['active'];
    const isArchived = status === 'archived';

    const handleStatusClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const handleStatusChange = (e: React.MouseEvent, newStatus: CampaignStatus) => {
        onChangeStatus(e, campaign.id, newStatus);
        setIsMenuOpen(false);
    };

    const handleInsightsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowPerformance(true);
    };

    return (
        <>
            <div
                onClick={() => onNavigate(campaign.id)}
                className={`bg-white p-6 rounded-xl border border-gray-200 transition-all cursor-pointer group relative ${isArchived ? 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0' : 'hover:border-[#B7EF02]'}`}
            >
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg transition-colors ${isArchived ? 'bg-gray-100 text-gray-400' : 'bg-[#F0F0F3] text-gray-600 group-hover:bg-[#f9fceb] group-hover:text-[#8cb800]'}`}>
                            <FolderOpen size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-['Federo'] text-gray-900">{campaign.name}</h3>

                            {/* Status Dropdown */}
                            <div className="flex items-center gap-3 mt-1 relative">
                                <div
                                    onClick={handleStatusClick}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer hover:ring-1 hover:ring-opacity-20 hover:ring-current ${config.bg} ${config.color}`}
                                >
                                    <config.icon size={12} />
                                    <span className="text-xs font-bold uppercase">{config.label}</span>
                                </div>

                                {isMenuOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                        {(['active', 'paused', 'archived'] as CampaignStatus[]).map((s) => (
                                            <button
                                                key={s}
                                                onClick={(e) => handleStatusChange(e, s)}
                                                className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-gray-50 text-left ${s === status ? 'text-[#B7EF02]' : 'text-gray-700'}`}
                                            >
                                                {s === status && <Check size={12} />}
                                                <span className={s !== status ? 'ml-5' : ''}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <span className="text-xs text-gray-400 font-['Barlow'] border-l border-gray-200 pl-3">{campaign.type || 'Search'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1 justify-end">
                            <Calendar size={12} />
                            <span>Created {campaign.createdAt?.toDate ? campaign.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-2">
                            {/* Sync Button */}
                            <GoogleAdsSyncButton clientId={clientId} campaignId={campaign.id} />

                            {/* Insights Button */}
                            <button
                                onClick={handleInsightsClick}
                                className="text-gray-400 hover:text-[#B7EF02] transition-colors flex items-center gap-1 text-xs font-medium"
                                title="View Performance Insights"
                            >
                                <BarChart2 size={16} />
                                <span>Insights</span>
                            </button>

                            <button
                                onClick={(e) => onDelete(e, campaign)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete Campaign"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Modal */}
            <CampaignPerformanceModal
                isOpen={showPerformance}
                onClose={() => setShowPerformance(false)}
                campaign={campaign}
            />
        </>
    );
};
