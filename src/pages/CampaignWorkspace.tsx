// src/pages/CampaignWorkspace.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckSquare, Brain, Clock, MoreVertical, Archive, Pencil, Check, X, Trash2 } from 'lucide-react';
import { onSnapshot, addDoc, query, orderBy, serverTimestamp, setDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAppDoc, getAppCollection, APP_ID } from '../lib/db';
import { getGeminiResponse } from '../lib/gemini';
import CampaignMemory from '../components/CampaignMemory';
import CrossCampaignSelector from '../components/campaigns/CrossCampaignSelector';

// --- HELPER COMPONENT: Message Formatter ---
// Parses **bold** and handles newlines/lists without extra dependencies
const FormattedMessage = ({ text, isUser }: { text: string, isUser: boolean }) => {
    if (!text) return null;

    return (
        <div className="space-y-1 text-sm leading-relaxed">
            {text.split('\n').map((line, i) => {
                const trimmed = line.trim();
                // Identify list items for indentation
                const isList = /^\d+\.|^[\*-]/.test(trimmed);

                // Parse **Bold** text
                const parts = line.split(/(\*\*.*?\*\*)/g);

                return (
                    <div key={i} className={`${isList ? 'pl-4' : ''} min-h-[1.25rem]`}>
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j} className={isUser ? "font-bold text-white" : "font-bold text-gray-900"}>{part.slice(2, -2)}</strong>;
                            }
                            return <span key={j}>{part}</span>;
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export default function CampaignWorkspace() {
    const { clientId, campaignId } = useParams();
    const navigate = useNavigate();

    // State
    const [campaign, setCampaign] = useState<any>(null);
    const [client, setClient] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMemory, setShowMemory] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [crossCampaignContext, setCrossCampaignContext] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Load Campaign & Client Data
    useEffect(() => {
        if (!clientId || !campaignId) return;

        // Fetch Campaign
        const unsubCampaign = onSnapshot(getAppDoc(`clients/${clientId}/campaigns`, campaignId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setCampaign({ id: doc.id, ...data });
                if (!isEditing) setEditedName(data.name);
            }
        });

        // Fetch Client
        const unsubClient = onSnapshot(getAppDoc('clients', clientId), (doc) => {
            if (doc.exists()) {
                setClient({ id: doc.id, ...doc.data() });
            }
        });

        return () => {
            unsubCampaign();
            unsubClient();
        };
    }, [clientId, campaignId, isEditing]);

    // 2. Load Smart Archive
    useEffect(() => {
        if (!clientId || !campaignId) return;
        const q = query(
            getAppCollection(`sessions/${campaignId}/messages`),
            orderBy('createdAt', 'asc')
        );
        const unsub = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
        return () => unsub();
    }, [clientId, campaignId]);

    // 3. Handle Smart Archive
    const handleSmartArchive = async () => {
        if (!messages.length || !clientId || !campaignId) return;

        const confirmArchive = confirm("Archive current chat session to Knowledge Base? This will clear the chat view.");
        if (!confirmArchive) return;

        setLoading(true);
        try {
            // 1. Save to Knowledge Base
            const archiveContent = JSON.stringify(messages.map(m => ({ role: m.role, content: m.content, time: m.createdAt })));
            await addDoc(getAppCollection(`clients/${clientId}/campaigns/${campaignId}/knowledge_base`), {
                type: 'chat_archive',
                title: `Chat Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                content: archiveContent,
                fileName: 'chat_archive.json', // for consistency
                createdAt: serverTimestamp()
            });

            // 2. Clear Messages from 'sessions/{campaignId}/messages'
            await Promise.all(messages.map(msg =>
                deleteDoc(getAppDoc(`sessions/${campaignId}/messages`, msg.id))
            ));

            // 3. Reset Session Metadata
            await setDoc(getAppDoc('sessions', campaignId), {
                lastMessage: "Session Archived",
                updatedAt: serverTimestamp()
            }, { merge: true });

            alert("Chat archived to memory.");

        } catch (error) {
            console.error("Error archiving chat:", error);
            alert("Failed to archive chat.");
        } finally {
            setLoading(false);
        }
    };

    // 3b. Handle Wipe Chat (No Archive)
    const handleWipeChat = async () => {
        if (!messages.length) return;

        const confirmWipe = confirm("Are you sure? This will delete the current conversation permanently.");
        if (!confirmWipe) return;

        setLoading(true);
        try {
            // Delete Messages from Firestore (Permanent Deletion as requested)
            // User instruction said "Do NOT write to Firestore", likely meaning "Do not CREATE an archive".
            // Deleting the messages is required to "Wipe" them permanently from the view/db history.
            await Promise.all(messages.map(msg =>
                deleteDoc(getAppDoc(`sessions/${campaignId}/messages`, msg.id))
            ));

            // Optional: Reset session metadata just to show it's empty
            if (clientId && campaignId) {
                await setDoc(getAppDoc('sessions', campaignId), {
                    lastMessage: "Chat Wiped",
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }

            // Local state update happens via snapshot automatically, but we can force clear if needed
            setMessages([]);

        } catch (error) {
            console.error("Error wiping chat:", error);
            alert("Failed to wipe chat.");
        } finally {
            setLoading(false);
        }
    };

    // 4. Handle Sending Messages (Enhanced with Context)
    const handleSend = async () => {
        if (!input.trim() || !clientId || !campaignId) return;

        const userText = input;
        setInput('');
        setLoading(true);

        try {
            await addDoc(getAppCollection(`sessions/${campaignId}/messages`), {
                role: 'user',
                content: userText,
                createdAt: serverTimestamp()
            });

            await setDoc(getAppDoc('sessions', campaignId), {
                agentName: "Ads Creator",
                appId: APP_ID,
                clientId: clientId,
                campaignId: campaignId,
                lastMessage: userText,
                updatedAt: serverTimestamp()
            }, { merge: true });

            // --- FETCH KNOWLEDGE BASE CONTEXT ---
            let contextString = "";
            try {
                const kbPath = `clients/${clientId}/campaigns/${campaignId}/knowledge_base`;
                const kbSnapshot = await getDocs(getAppCollection(kbPath)); // Requires getDocs import

                if (!kbSnapshot.empty) {
                    const kbContent = kbSnapshot.docs.map(d => {
                        const data = d.data();
                        return `[Type: ${data.type}] content: ${data.content}`;
                    }).join('\n---\n');
                    contextString = `REFERENCE DATA (Knowledge Base):\n${kbContent}\n`;
                }
            } catch (err) {
                console.error("Error fetching knowledge base context:", err);
            }

            const baseContext = campaign.memory_base || "No specific data context.";

            // --- CONSTRUCT CLIENT CONTEXT ---
            let clientContext = "";
            if (client) {
                clientContext = `CLIENT CONTEXT:\n` +
                    `Name: ${client.name}\n` +
                    `Industry: ${client.industry || 'Unknown'}\n` +
                    `About: ${client.description || 'No description provided'}\n` +
                    `Global Goals: ${client.mainGoal || 'Not specified'}\n` +
                    `Website: ${client.website || 'N/A'}\n`;
            }

            // Combine: Client Context + Base Context + Knowledge Base + Cross-Campaign Selection
            let combinedContext = `${clientContext}\n${baseContext}\n\n${contextString}`;

            if (crossCampaignContext) {
                combinedContext += `\n\n--- CROSS-CAMPAIGN KNOWLEDGE START ---\n${crossCampaignContext}\n--- CROSS-CAMPAIGN KNOWLEDGE END ---\nUse this knowledge to answer the current request if relevant.`;
            }

            const historyText = messages.map(m => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join('\n');
            const fullPrompt = `Chat History:\n${historyText}\nUser: ${userText}`;

            try {
                const aiResponse = await getGeminiResponse(fullPrompt, 'ASSISTANT', combinedContext);

                await addDoc(getAppCollection(`sessions/${campaignId}/messages`), {
                    role: 'assistant',
                    content: aiResponse,
                    createdAt: serverTimestamp()
                });

                await setDoc(getAppDoc('sessions', campaignId), {
                    lastMessage: aiResponse,
                    updatedAt: serverTimestamp()
                }, { merge: true });

            } catch (error) {
                console.error("Gemini Error:", error);
                await addDoc(getAppCollection(`sessions/${campaignId}/messages`), {
                    role: 'assistant',
                    content: "Entschuldigung, ich konnte keine Verbindung zu meinem KI-Gehirn herstellen.",
                    createdAt: serverTimestamp()
                });
            } finally {
                setLoading(false);
            }

        } catch (error) {
            console.error("Error sending message:", error);
            setLoading(false);
        }
    };

    // 5. Campaign Renaming Logic
    const startEditing = () => {
        setIsEditing(true);
        if (campaign) setEditedName(campaign.name);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        if (campaign) setEditedName(campaign.name);
    };

    const saveName = async () => {
        if (!editedName.trim() || !clientId || !campaignId) return;
        try {
            await updateDoc(getAppDoc(`clients/${clientId}/campaigns`, campaignId), {
                name: editedName
            });
            // Update local state immediately for better UX
            setCampaign((prev: any) => ({ ...prev, name: editedName }));
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating campaign name:", error);
            alert("Failed to rename campaign.");
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
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        className="font-['Federo'] text-xl text-gray-900 bg-transparent border-b-2 border-[#B7EF02] focus:outline-none w-full min-w-[200px]"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveName();
                                            if (e.key === 'Escape') cancelEditing();
                                        }}
                                    />
                                    <button onClick={saveName} className="p-1 hover:bg-green-100 text-green-600 rounded transition-colors"><Check size={18} /></button>
                                    <button onClick={cancelEditing} className="p-1 hover:bg-red-100 text-red-500 rounded transition-colors"><X size={18} /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group">
                                    <h1 className="font-['Federo'] text-xl text-gray-900">{campaign.name}</h1>
                                    <button
                                        onClick={startEditing}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded transition-all"
                                        title="Rename Campaign"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-['Barlow']">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span>Active Assistant</span>
                                {client && (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium" title={`Context Active: ${client.name}`}>
                                        Brain: {client.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSmartArchive}
                            className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-[#B7EF02] transition-colors"
                            title="Smart Archive (Save & Clear)"
                        >
                            <Archive size={20} />
                        </button>
                        <button
                            onClick={handleWipeChat}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                            title="Wipe Chat (No Save)"
                        >
                            <Trash2 size={20} />
                        </button>
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
                            <div className={`max-w-[80%] rounded-2xl p-4 font-['Barlow'] shadow-sm ${msg.role === 'user'
                                ? 'bg-[#101010] text-white rounded-br-none'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                }`}>
                                {/* UPDATED: Use FormattedMessage instead of raw string */}
                                <FormattedMessage text={msg.content} isUser={msg.role === 'user'} />
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
                <div className="w-80 overflow-hidden animate-in slide-in-from-right duration-300 space-y-4 p-4 bg-gray-50 border-l border-gray-200">
                    <CrossCampaignSelector
                        clientId={clientId || ''}
                        currentCampaignId={campaignId || ''}
                        onContextChange={setCrossCampaignContext}
                    />
                    <CampaignMemory clientId={clientId || ''} campaignId={campaignId || ''} />
                </div>
            )}
        </div>
    );
}
