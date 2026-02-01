// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Users, Megaphone, TrendingUp, Activity, ArrowRight } from 'lucide-react';
import { getDocs } from 'firebase/firestore';
import { getAppCollection } from '../lib/db';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        clients: 0,
        campaigns: 0,
        loading: true
    });

    useEffect(() => {
        async function fetchStats() {
            try {
                // 1. Hole alle Clients
                const clientsSnapshot = await getDocs(getAppCollection('clients'));
                const clientCount = clientsSnapshot.size;

                // 2. Hole Kampagnen (Iteriere durch Clients für V1 Struktur)
                // Hinweis: Bei sehr vielen Daten sollte dies auf "Collection Group Queries" umgestellt werden.
                const campaignPromises = clientsSnapshot.docs.map(doc =>
                    getDocs(getAppCollection(`clients/${doc.id}/campaigns`))
                );

                const campaignSnapshots = await Promise.all(campaignPromises);
                const campaignCount = campaignSnapshots.reduce((acc, snap) => acc + snap.size, 0);

                setStats({
                    clients: clientCount,
                    campaigns: campaignCount,
                    loading: false
                });

            } catch (error) {
                console.error("Error loading dashboard stats:", error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        }

        fetchStats();
    }, []);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="font-['Federo'] text-3xl text-gray-900">Dashboard</h1>
                <p className="font-['Barlow'] text-gray-500 mt-1">Overview of your Google Ads ecosystem.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Metric 1: Clients */}
                <div
                    onClick={() => navigate('/clients')}
                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-[#B7EF02] transition-colors">
                            <Users size={24} className="text-gray-700 group-hover:text-black" />
                        </div>
                        {stats.loading ? (
                            <div className="h-4 w-12 bg-gray-100 animate-pulse rounded"></div>
                        ) : (
                            <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <TrendingUp size={12} className="mr-1" /> Active
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="font-['Barlow'] text-sm text-gray-500 font-medium">Total Clients</p>
                        {stats.loading ? (
                            <div className="h-8 w-16 bg-gray-100 animate-pulse rounded mt-1"></div>
                        ) : (
                            <h3 className="font-['Federo'] text-3xl text-gray-900">{stats.clients}</h3>
                        )}
                    </div>
                </div>

                {/* Metric 2: Campaigns */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <Megaphone size={24} className="text-gray-700" />
                        </div>
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                            Global
                        </span>
                    </div>
                    <div>
                        <p className="font-['Barlow'] text-sm text-gray-500 font-medium">Active Campaigns</p>
                        {stats.loading ? (
                            <div className="h-8 w-16 bg-gray-100 animate-pulse rounded mt-1"></div>
                        ) : (
                            <h3 className="font-['Federo'] text-3xl text-gray-900">{stats.campaigns}</h3>
                        )}
                    </div>
                </div>

                {/* Placeholder Metrics */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm opacity-60">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <Activity size={24} className="text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <p className="font-['Barlow'] text-sm text-gray-400 font-medium">Pending Tasks</p>
                        <h3 className="font-['Federo'] text-3xl text-gray-300">--</h3>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Welcome Area */}
            <div className="bg-[#101010] rounded-xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#B7EF02] opacity-10 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2"></div>

                <div className="relative z-10 max-w-2xl">
                    <h2 className="font-['Federo'] text-2xl mb-3">Ready to optimize?</h2>
                    <p className="font-['Barlow'] text-gray-400 mb-6 leading-relaxed">
                        Select a client to start analyzing campaigns, uploading data, or assigning tasks to the AI assistant.
                    </p>
                    <button
                        onClick={() => navigate('/clients')}
                        className="flex items-center gap-2 bg-[#B7EF02] text-black px-5 py-3 rounded-lg font-medium hover:bg-[#a4d602] transition-colors"
                    >
                        View Clients <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
