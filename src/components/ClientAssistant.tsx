import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X } from 'lucide-react';
import { serverTimestamp, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getAppDoc } from '../lib/db';
import { analyzeBrand, getExpertResponse } from '../lib/gemini';
import { scrapeWebsite } from '../lib/n8n';
import { FormattedMessage } from './chat/FormattedMessage';

interface ClientAssistantProps {
    onClose: () => void;
}

export default function ClientAssistant({ onClose }: ClientAssistantProps) {
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
        { role: 'assistant', content: "Hello! I'm your Google Ads Expert & Client Assistant. How can I help?" }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const formatMessage = (content: string) => {
        // Split by triple backticks
        const parts = content.split(/```/g);
        const handleSend = async () => {
            if (!input.trim()) return;

            const userMsg = input;
            setInput('');
            setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
            setLoading(true);

            try {
                // 0. RESET COMMAND
                if (userMsg.toLowerCase() === 'reset' || userMsg.toLowerCase() === 'neu') {
                    setMessages([{ role: 'assistant', content: "Google Ads Expert ready. How can I help?" }]);
                    setLoading(false);
                    return;
                }

                // HEURISTIC: Check context
                const lastAiMsg = [...messages].reverse().find(m => m.role === 'assistant')?.content || "";

                // ---------------------------------------------------------
                // SCENARIO A: ONBOARDING FLOW
                // ---------------------------------------------------------
                // Trigger onboarding if user asks to "start new client" or similar, 
                // OR if the AI just asked for details.
                // For now, we rely on the specific questions from the AI to maintain state.

                // NOTE: To start onboarding, the USER or AI must initiate it. 
                // If the user says "New Client", the Expert Brain (via RAG) might ask for the name.
                // We need to catch that. 
                // But simpler: If we see specific questions, we act.

                const isOnboardingName = lastAiMsg.includes("What is the name of the new client") || lastAiMsg.includes("Wie heißt der neue Kunde");
                const isOnboardingUrl = lastAiMsg.includes("What is their website URL") || lastAiMsg.includes("Wie lautet die Website");

                if (isOnboardingName) {
                    const aiResponse = `Great. I'll set up **${userMsg}**. What is their website URL?`;
                    setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
                    setLoading(false);
                    return;
                }

                if (isOnboardingUrl) {
                    // Heuristic: Client name was likely the user message BEFORE the URL request.
                    // History: [User: "New Client"], [AI: "Name?"], [User: "Nike"], [AI: "URL?"], [User: "nike.com"]
                    // Index:   0                    1              2               3             4 (current)
                    // We need message at index 2.
                    const clientName = messages[messages.length - 2].content;
                    const clientUrl = userMsg;

                    setMessages(prev => [...prev, { role: 'assistant', content: `Scanning ${clientUrl} for ${clientName}...` }]);

                    // --- CREATION LOGIC ---
                    const generateClientId = (name: string) => {
                        return name.toLowerCase()
                            .replace(/\s+/g, '_')
                            .replace(/[^a-z0-9_]/g, '');
                    };

                    const newClientId = generateClientId(clientName);

                    // A. Scrape Website Content
                    let scrapedContent = undefined;
                    try {
                        const scrapeResult = await scrapeWebsite(clientUrl);
                        if (scrapeResult && scrapeResult.content) {
                            scrapedContent = scrapeResult.content;
                        }
                    } catch (scrapeErr) {
                        console.warn("Scraping failed:", scrapeErr);
                    }

                    // B. AI Analysis
                    const analysis = await analyzeBrand(clientName, clientUrl, scrapedContent);

                    // C. Save to Database
                    await setDoc(getAppDoc('clients', newClientId), {
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

                    const successMsg = `Done! I've created the profile for **${clientName}** (ID: ${newClientId}).\n\n**Industry:** ${analysis.industry}\n**Strategy:** ${analysis.suggested_strategy}\n\nHere is a summary you can copy:\n\`\`\`\nClient: ${clientName}\nWebsite: ${clientUrl}\nIndustry: ${analysis.industry}\nStrategy: ${analysis.suggested_strategy}\n\`\`\`\n\nRedirecting you to the client dashboard...`;

                    setMessages(prev => [...prev, { role: 'assistant', content: successMsg }]);

                    // Navigate after a short delay
                    setTimeout(() => {
                        navigate(`/clients/${newClientId}`);
                        onClose();
                    }, 5000);

                    setLoading(false);
                    return;
                }

                // ---------------------------------------------------------
                // SCENARIO B: EXPERT CHAT (Default)
                // ---------------------------------------------------------

                // Build conversation history for context
                const history = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
                const response = await getExpertResponse(userMsg, `HISTORY:\n${history}`);

                setMessages(prev => [...prev, { role: 'assistant', content: response }]);

            } catch (error) {
                console.error(error);
                setMessages(prev => [...prev, { role: 'assistant', content: "System Error: Could not reach the Brain." }]);
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50 transform transition-transform">
                {/* Header */}
                <div className="p-4 bg-[#101010] text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Bot className="text-[#B7EF02]" size={20} />
                        <h2 className="font-['Federo'] text-lg">Google Ads Expert</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`p-3 rounded-lg text-sm max-w-[85%] ${msg.role === 'user'
                                    ? 'bg-[#B7EF02] text-black rounded-tr-none'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                                    }`}
                            >
                                <FormattedMessage text={msg.content} />
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
                            placeholder="Ask me anything..."
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
