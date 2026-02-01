import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X } from 'lucide-react';
import { getAppCollection } from '../lib/db';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { analyzeBrand } from '../lib/gemini';

interface ClientAssistantProps {
    onClose: () => void;
}

export default function ClientAssistant({ onClose }: ClientAssistantProps) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
        { role: 'assistant', content: "Hello! I'm your Client Onboarding Assistant. What is the name of the new client you'd like to add?" }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

        // TODO: CONNECT TO N8N WEBHOOK HERE
        // For now, we simulate a simple flow to demonstrate UI
        // We use setTimeout to decouple state updates slightly, but async/await is main driver
        setTimeout(async () => {
            let aiResponse = "I'm processing that...";

            // 1. User provided Name
            if (messages.length === 1) {
                aiResponse = `Great. I'll set up ${userMsg}. What is their website URL? I'll scan it for context.`;
            }
            // 2. User provided Website -> TRIGGER ANALYSIS
            else if (messages.length === 3) {
                const clientName = messages[1].content;
                const clientUrl = userMsg;

                aiResponse = `Scanning ${clientUrl} for ${clientName}... This might take a few seconds...`;
                setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

                try {
                    // A. AI Analysis
                    const analysis = await analyzeBrand(clientName, clientUrl);

                    // B. Save to Database
                    await addDoc(getAppCollection('clients'), {
                        name: clientName,
                        website: clientUrl,
                        industry: analysis.industry,
                        description: analysis.description,
                        audit: {
                            products: analysis.key_products,
                            strategy: analysis.suggested_strategy,
                            lastScanned: serverTimestamp()
                        },
                        createdAt: serverTimestamp(),
                        status: 'active'
                    });

                    aiResponse = `Done! I've created the profile for **${clientName}**.\n\n**Industry:** ${analysis.industry}\n**Strategy:** ${analysis.suggested_strategy}\n\nYou can now close this chat.`;
                } catch (e) {
                    console.error(e);
                    aiResponse = "I created the client, but the AI analysis failed. Please check the details manually.";
                    // Fallback creation if AI fails totally
                    await addDoc(getAppCollection('clients'), {
                        name: clientName,
                        website: clientUrl,
                        createdAt: serverTimestamp(),
                        status: 'active',
                        description: "Manual creation (AI failed)"
                    });
                }
            }

            setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
            setLoading(false);
        }, 100);
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50 transform transition-transform">
            {/* Header */}
            <div className="p-4 bg-[#101010] text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Bot className="text-[#B7EF02]" size={20} />
                    <h2 className="font-['Federo'] text-lg">New Client Assistant</h2>
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
                {loading && <div className="text-xs text-gray-400 ml-2">Assistant is thinking...</div>}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
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
            </div>
        </div>
    );
}
