import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Brain, Check, MessageSquare, ArrowRight, Loader } from 'lucide-react';
import Papa from 'papaparse';
import { addDoc, serverTimestamp, collection, onSnapshot, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getAppDoc } from '../../lib/db';
import { getGeminiResponse } from '../../lib/gemini';

interface CreateCampaignModalProps {
    clientId: string;
    onClose: () => void;
}

type WizardStep = 'data' | 'strategy' | 'review';

export default function CreateCampaignModal({ clientId, onClose }: CreateCampaignModalProps) {
    const navigate = useNavigate();
    const [step, setStep] = useState<WizardStep>('data');
    const [loading, setLoading] = useState(false);
    const [client, setClient] = useState<any>(null);

    // Fetch Client Data
    useEffect(() => {
        if (!clientId) return;
        const unsub = onSnapshot(getAppDoc('clients', clientId), (doc) => {
            if (doc.exists()) {
                setClient({ id: doc.id, ...doc.data() });
            }
        });
        return () => unsub();
    }, [clientId]);

    // Data State
    const [basicInfo, setBasicInfo] = useState({ name: '', budget: '' });
    const [files, setFiles] = useState<File[]>([]);

    // Strategy State
    const [strategyInput, setStrategyInput] = useState('');
    const [aiQuestions, setAiQuestions] = useState('');
    const [userAnswers, setUserAnswers] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- STEP 1: DATA INGESTION ---
    const MAX_FILE_SIZE = 950000; // ~950KB for Firestore Safety

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files!);
            const validFiles: File[] = [];

            selectedFiles.forEach(file => {
                if (file.size > MAX_FILE_SIZE) {
                    alert(`File "${file.name}" is too large (>${Math.round(MAX_FILE_SIZE / 1000)}KB). Please split it.`);
                } else {
                    validFiles.push(file);
                }
            });

            if (validFiles.length > 0) {
                setFiles(prev => [...prev, ...validFiles]);
            }
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // --- STEP 2: AI STRATEGY ---
    const consultAiAgent = async () => {
        if (!strategyInput.trim()) return;
        setIsAnalyzing(true);

        const fileNames = files.map(f => f.name).join(', ');

        const clientContext = client ? `
            Client Name: ${client.name}
            Industry: ${client.industry || "Unknown"}
            Description: ${client.description || "N/A"}
        ` : "No specific client context available.";

        const prompt = `
            CONTEXT: User is creating a Google Ads Campaign for a specific client.
            
            CLIENT CONTEXT:
            ${clientContext}

            CAMPAIGN GOAL: ${strategyInput}
            DATA FILES: ${fileNames || "None provided"}
            
            TASK: Based on the Client's industry/background and the specific campaign goal, ask 3 critical, specific questions to refine the strategy.
            Do not ask generic questions. Make them tailored to this business.
            Format as a numbered list. Keep it concise.
        `;

        try {
            const response = await getGeminiResponse(prompt, 'CAMPAIGN_CREATOR');
            setAiQuestions(response);
        } catch (error) {
            console.error(error);
            setAiQuestions("Could not connect to AI Agent. Please proceed manually.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- STEP 3: CREATION LOGIC ---
    const handleInitializeCampaign = async () => {
        if (!basicInfo.name) return;
        setLoading(true);

        try {
            // 1. Create Campaign Document (Custom ID)
            const generateCampaignId = (name: string) => {
                return name.toLowerCase()
                    .replace(/ä/g, 'ae')
                    .replace(/ö/g, 'oe')
                    .replace(/ü/g, 'ue')
                    .replace(/ß/g, 'ss')
                    .replace(/[^a-z0-9]+/g, '-') // Replace special chars & spaces with hyphen
                    .replace(/^-+|-+$/g, '');    // Remove leading/trailing hyphens
            };

            const campaignId = generateCampaignId(basicInfo.name);
            const campRef = getAppDoc(`clients/${clientId}/campaigns`, campaignId);

            await setDoc(campRef, {
                name: basicInfo.name,
                budget: basicInfo.budget,
                status: 'Draft',
                type: 'AI-Powered',
                goal: strategyInput,
                createdAt: serverTimestamp()
            });

            const kbCollection = collection(campRef, 'knowledge_base');

            // 2. Process & Upload CSVs
            for (const file of files) {
                const text = await file.text();
                // Simple parsing to ensure valid CSV structure (optional validation could verify columns)
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true, // Clean up empty rows
                    complete: async (results) => {
                        // Save as 'csv' type memory
                        await addDoc(kbCollection, {
                            type: 'csv',
                            fileName: file.name,
                            content: JSON.stringify(results.data), // Store FULL data now (verified by size check)
                            raw_content: text, // Store full raw text (verified by size check)
                            rowCount: results.data.length,
                            createdAt: serverTimestamp()
                        });
                    }
                });
            }

            // 3. Save Strategy Brief
            await addDoc(kbCollection, {
                type: 'strategy_brief',
                title: 'Initial Strategy Interview',
                content: `GOAL: ${strategyInput}\n\nAI QUESTIONS:\n${aiQuestions}\n\nUSER ANSWERS:\n${userAnswers}`,
                createdAt: serverTimestamp()
            });

            onClose();
            // Navigate to new Campaign Workspace
            navigate(`/clients/${clientId}/campaigns/${campaignId}`);

        } catch (error) {
            console.error("Creation Error:", error);
            alert("Failed to create campaign.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#101010] w-full max-w-2xl rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <div>
                        <h2 className="font-['Federo'] text-2xl text-white">New Smart Campaign</h2>
                        <p className="text-gray-400 text-sm font-['Barlow']">AI-Guided Setup Wizard</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="flex border-b border-gray-800">
                    <div className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-medium ${step === 'data' ? 'text-[#B7EF02] bg-[#B7EF02]/10' : 'text-gray-500'}`}>
                        <FileText size={16} /> Data
                    </div>
                    <div className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-medium ${step === 'strategy' ? 'text-[#B7EF02] bg-[#B7EF02]/10' : 'text-gray-500'}`}>
                        <Brain size={16} /> Strategy
                    </div>
                    <div className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-medium ${step === 'review' ? 'text-[#B7EF02] bg-[#B7EF02]/10' : 'text-gray-500'}`}>
                        <Check size={16} /> Review
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 font-['Barlow']">

                    {/* STEP 1: DATA */}
                    {step === 'data' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-xs uppercase mb-2">Campaign Name</label>
                                    <input
                                        type="text"
                                        value={basicInfo.name}
                                        onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#B7EF02] focus:outline-none"
                                        placeholder="e.g. Summer Sale 2024"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs uppercase mb-2">Daily Budget (€)</label>
                                    <input
                                        type="number"
                                        value={basicInfo.budget}
                                        onChange={e => setBasicInfo({ ...basicInfo, budget: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#B7EF02] focus:outline-none"
                                        placeholder="50"
                                    />
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 hover:border-[#B7EF02] hover:bg-gray-900/50 transition-all cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={32} className="mb-2" />
                                <p>Drop Google Ads Editor CSVs here</p>
                                <p className="text-xs text-gray-600 mt-1">or click to browse</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    multiple
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                />
                            </div>

                            {files.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500 uppercase">Selected Files</p>
                                    {files.map((f, i) => (
                                        <div key={i} className="flex justify-between items-center bg-gray-800 p-3 rounded-lg text-sm text-gray-200">
                                            <div className="flex items-center gap-2">
                                                <FileText size={14} className="text-[#B7EF02]" />
                                                {f.name}
                                            </div>
                                            <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-500"><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: STRATEGY */}
                    {step === 'strategy' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-gray-400 text-xs uppercase mb-2">Main Goal / Strategy</label>
                                <textarea
                                    value={strategyInput}
                                    onChange={e => setStrategyInput(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-[#B7EF02] focus:outline-none h-24 resize-none"
                                    placeholder="e.g. Maximize leads for our new consulting package. Target high net-worth individuals in Vienna."
                                />
                            </div>

                            {/* AI Interaction Area */}
                            <div className="border border-[#B7EF02]/30 bg-[#B7EF02]/5 rounded-xl p-4 relative">
                                <div className="absolute -top-3 left-4 bg-[#101010] px-2 text-[#B7EF02] text-xs font-bold flex items-center gap-1">
                                    <Brain size={12} /> AI CONSULTANT
                                </div>

                                {!aiQuestions ? (
                                    <div className="text-center py-4">
                                        <p className="text-gray-400 text-sm mb-4">I can analyze your data and goal to ask the right clarifying questions.</p>
                                        <button
                                            onClick={consultAiAgent}
                                            disabled={!strategyInput.trim() || isAnalyzing}
                                            className="bg-[#B7EF02] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#a4d602] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                                        >
                                            {isAnalyzing ? <Loader size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                                            {isAnalyzing ? "Analyzing..." : "Review Strategy with AI"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                                            {aiQuestions}
                                        </div>
                                        <div className="pt-2 border-t border-gray-700/50">
                                            <label className="block text-[#B7EF02] text-xs uppercase mb-2">Your Answers</label>
                                            <textarea
                                                value={userAnswers}
                                                onChange={e => setUserAnswers(e.target.value)}
                                                className="w-full bg-[#101010] border border-gray-700 rounded-lg p-3 text-white focus:border-[#B7EF02] focus:outline-none h-32"
                                                placeholder="Answer the AI's questions here to give specific context..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: REVIEW */}
                    {step === 'review' && (
                        <div className="space-y-4">
                            <div className="bg-gray-900 p-4 rounded-xl space-y-2">
                                <h3 className="text-white font-bold">{basicInfo.name}</h3>
                                <div className="text-sm text-gray-400 grid grid-cols-2 gap-2">
                                    <span>Budget: <span className="text-white">€{basicInfo.budget}/day</span></span>
                                    <span>Files: <span className="text-white">{files.length}</span></span>
                                </div>
                            </div>

                            <div className="bg-gray-900 p-4 rounded-xl border-l-4 border-[#B7EF02]">
                                <h4 className="text-[#B7EF02] text-xs font-bold uppercase mb-1">Strategy Context</h4>
                                <p className="text-gray-300 text-sm line-clamp-3">{strategyInput}</p>
                            </div>

                            <p className="text-center text-gray-500 text-sm mt-4">
                                Ready to initialize? The AI will process <br /> your CSVs and Answers in the background.
                            </p>
                        </div>
                    )}

                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-between">
                    {step === 'data' ? (
                        <div /> // Spacer
                    ) : (
                        <button
                            onClick={() => setStep(step === 'review' ? 'strategy' : 'data')}
                            className="text-gray-400 hover:text-white"
                        >
                            Back
                        </button>
                    )}

                    {step === 'data' && (
                        <button
                            onClick={() => setStep('strategy')}
                            disabled={!basicInfo.name}
                            className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
                        >
                            Next <ArrowRight size={16} />
                        </button>
                    )}

                    {step === 'strategy' && (
                        <button
                            onClick={() => setStep('review')}
                            className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2"
                        >
                            Review & Create <ArrowRight size={16} />
                        </button>
                    )}

                    {step === 'review' && (
                        <button
                            onClick={handleInitializeCampaign}
                            disabled={loading}
                            className="bg-[#B7EF02] text-black px-8 py-2 rounded-lg font-bold hover:bg-[#a4d602] disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
                            {loading ? "Initializing..." : "Launch Campaign"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
