import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckSquare, Brain, Clock, MoreVertical } from 'lucide-react';
import { onSnapshot, doc, collection, addDoc, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { getAppDoc, getAppCollection } from '../lib/db';

export default function CampaignWorkspace() {
    const { clientId, campaignId } = useParams();
    const navigate = useNavigate();

    // State
    const [campaign, setCampaign] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMemory, setShowMemory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Load Campaign Data (The Memory Base)
    useEffect(() => {
        if (!clientId || !campaignId) return;
        const unsub = onSnapshot(getAppDoc(`clients/${clientId}/campaigns`, campaignId), (doc) => {
            if (doc.exists()) setCampaign({ id: doc.id, ...doc.data() });
        });
        return () => unsub();
    }, [clientId, campaignId]);

    // 2. Load Smart Archive (Chat History)
    useEffect(() => {
        if (!clientId || !campaignId) return;
        const q = query(
            getAppCollection(`clients/${clientId}/campaigns/${campaignId}/chat_history`),
            orderBy('createdAt', 'asc')
        );
        const unsub = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            // Scroll to bottom on new message
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
        return () => unsub();
    }, [clientId, campaignId]);

    // 3. Handle Sending Messages & Task Logic
    const handleSend = async () => {
        if (!input.trim() || !clientId || !campaignId) return;

        const userText = input;
        setInput('');
        setLoading(true);

        try {
            // A. Save User Message to Archive
            await addDoc(getAppCollection(`clients/${clientId}/campaigns/${campaignId}/chat_history`), {
                role: 'user',
                content: userText,
                createdAt: serverTimestamp()
            });

            // B. Simulate AI Processing (This is where n8n would take over)
            // We will implement a client-side "Task Detector" for immediate feedback
            setTimeout(async () => {
                let aiResponse = "I've updated the campaign context.";
                const lowerText = userText.toLowerCase();

                // TASK DETECTION LOGIC
                if (lowerText.includes('task') || lowerText.includes('remind') || lowerText.includes('check')) {
                    // Create Task in Global Collection
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + 14); // Default 2 weeks

                    await addDoc(getAppCollection('tasks'), {
                        task: `Check Campaign: ${campaign.name}`,
                        description: `Triggered by chat: "${userText}"`,
                        related_client_id: clientId,
                        related_campaign_id: campaignId,
                        due_date: dueDate.toISOString(),
                        status: 'Pending',
                        createdAt: serverTimestamp()
                    });

                    aiResponse = "I've created a task for you to check this campaign in 2 weeks. You can see it in the Tasks sidebar.";
                }
                else if (lowerText.includes('summary') && campaign.memory_base) {
                    aiResponse = `Based on the CSV memory, this campaign has ${campaign.memory_base.length} bytes of data. It focuses on imported keywords.`;
                }

                // C. Save AI Response to Archive
                await addDoc(getAppCollection(`clients/${clientId}/campaigns/${campaignId}/chat_history`), {
                    role: 'assistant',
                    content: aiResponse,
                    createdAt: serverTimestamp()
                });

                setLoading(false);
            }, 1000);

        } catch (error) {
            console.error("Error sending message:", error);
            setLoading(false);
        }
    };

    if (!campaign) return <div className="p-8">Loading Workspace...</div>;

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-6">
            {/* LEFT: Main Chat Workspace */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(`/clients/${clientId}`)} className="text-gray-400 hover:text-gray-900">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="font-['Federo'] text-xl text-gray-900">{campaign.name}</h1>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-['Barlow']">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span>Active Assistant</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowMemory(!showMemory)}
                            className={`p-2 rounded-lg transition-colors ${showMemory ? 'bg-[#B7EF02] text-black' : 'hover:bg-gray-200 text-gray-500'}`}
                            title="View Memory Base"
                        >
                            <Brain size={20} />
                        </button>
                    </div>
                </div>

                {/* Chat History (Smart Archive) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9FAFB]">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-400 mt-10 font-['Barlow']">
                            <p>This is the start of the campaign memory.</p>
                            <p className="text-sm">Uploads and tasks are tracked here.</p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-4 text-sm font-['Barlow'] leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-[#101010] text-white rounded-br-none'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && <div className="text-xs text-gray-400 ml-4 animate-pulse">Assistant is working...</div>}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex gap-2 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask about strategy, create tasks, or analyze data..."
                            className="flex-1 pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#B7EF02] focus:bg-white transition-all font-['Barlow']"
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className="absolute right-2 top-2 p-1.5 bg-[#B7EF02] text-black rounded-lg hover:bg-[#a4d602] disabled:opacity-50 transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center font-['Barlow']">
                        Tip: Type "Create a task to check this in 2 weeks" to test the agent.
                    </p>
                </div>
            </div>

            {/* RIGHT: Memory & Context Panel (Collapsible) */}
            {showMemory && (
                <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-['Federo'] text-gray-900">Memory Base</h3>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Source Data</h4>
                            <div className="p-3 bg-gray-50 rounded border border-gray-100 text-xs font-mono text-gray-600 break-all">
                                {campaign.memory_base ? campaign.memory_base.substring(0, 200) + '...' : 'No CSV Data Loaded'}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Campaign Stats</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Status</span>
                                    <span className="font-medium">{campaign.status}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Created</span>
                                    <span className="font-medium">{campaign.createdAt?.toDate().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
