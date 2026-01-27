import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Upload, FileSpreadsheet } from 'lucide-react';
import { getAppCollection } from '../lib/db';
import { addDoc, serverTimestamp, doc } from 'firebase/firestore';

interface CampaignAssistantProps {
    clientId: string;
    onClose: () => void;
}

export default function CampaignAssistant({ clientId, onClose }: CampaignAssistantProps) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string | React.ReactNode }>>([
        { role: 'assistant', content: "I'm the Campaign Manager. Are we setting up a **New Campaign** from scratch, or importing an **Existing Campaign** via CSV?" }
    ]);
    const [mode, setMode] = useState<'chat' | 'upload'>('chat');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        // Simple Logic Router
        setTimeout(async () => {
            let aiResponse = "";

            const lowerMsg = userMsg.toLowerCase();

            if (lowerMsg.includes('exist') || lowerMsg.includes('csv') || lowerMsg.includes('import')) {
                aiResponse = "Understood. Please upload the Google Ads Editor CSV file so I can build the memory base.";
                setMode('upload');
            } else if (lowerMsg.includes('new')) {
                aiResponse = "Okay, let's start fresh. What is the goal of this new campaign (e.g., Leads, Sales)?";
                // Here you would continue the chat flow for new campaigns
            } else {
                // Fallback / Continue conversation
                aiResponse = `I've noted: "${userMsg}". Now, do you want to upload data or configure settings?`;
            }

            setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
            setLoading(false);
        }, 800);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: `Uploading: ${file.name}` }]);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const csvContent = e.target?.result as string;

            try {
                // Save Campaign with CSV Memory
                await addDoc(getAppCollection(`clients/${clientId}/campaigns`), {
                    name: file.name.replace('.csv', ''),
                    status: 'Draft',
                    type: 'Imported',
                    memory_base: csvContent, // The "Brain"
                    createdAt: serverTimestamp(),
                    last_check: null
                });

                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "Success! I've analyzed the CSV and created the campaign structure in the database. You can now close this chat and open the campaign to start working."
                }]);
            } catch (err) {
                console.error(err);
                setMessages(prev => [...prev, { role: 'assistant', content: "Error saving campaign data." }]);
            }
            setLoading(false);
            setMode('chat');
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50">
            {/* Header */}
            <div className="p-4 bg-[#101010] text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Bot className="text-[#B7EF02]" size={20} />
                    <h2 className="font-['Federo'] text-lg">Campaign Assistant</h2>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg text-sm font-['Barlow'] ${msg.role === 'user'
                                ? 'bg-[#101010] text-white rounded-br-none'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && <div className="text-xs text-gray-400 ml-2">Processing...</div>}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
                {mode === 'upload' ? (
                    <div className="flex flex-col gap-3">
                        <input
                            type="file"
                            accept=".csv"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-3 border-2 border-dashed border-[#B7EF02] bg-[#f9fceb] text-gray-700 rounded-lg flex items-center justify-center gap-2 hover:bg-[#effad6] transition-colors"
                        >
                            <FileSpreadsheet size={20} className="text-[#8cb800]" />
                            <span className="font-['Barlow'] font-medium">Select Google Ads CSV</span>
                        </button>
                        <button
                            onClick={() => setMode('chat')}
                            className="text-xs text-gray-400 hover:text-gray-600 text-center"
                        >
                            Cancel Upload
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type message..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#B7EF02] font-['Barlow']"
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className="p-2 bg-[#B7EF02] text-black rounded-lg hover:bg-[#a4d602] disabled:opacity-50"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
