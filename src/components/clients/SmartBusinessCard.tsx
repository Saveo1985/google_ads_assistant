import { useState, useEffect } from 'react';
import { Brain, Target, Pencil, X, Check, Loader2, Sparkles } from 'lucide-react';
import { updateDoc } from 'firebase/firestore';
import { getAppDoc } from '../../lib/db';
import { refineClientData } from '../../lib/gemini';
import { toast } from 'react-hot-toast';

interface SmartBusinessCardProps {
    client: any; // Using any for flexibility as Client type might need import
}

export default function SmartBusinessCard({ client }: SmartBusinessCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Local State for Form
    const [formData, setFormData] = useState({
        industry: '',
        description: '',
        products: '',
        strategy: ''
    });

    const [aiFeedback, setAiFeedback] = useState('');

    // Sync state with client data on load or cancel
    useEffect(() => {
        if (client?.audit) {
            setFormData({
                industry: client.industry || '',
                description: client.description || '',
                products: client.audit.products || '',
                strategy: client.audit.strategy || ''
            });
        }
    }, [client]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const clientRef = getAppDoc('clients', client.id);
            await updateDoc(clientRef, {
                industry: formData.industry,
                description: formData.description,
                audit: {
                    ...client.audit,
                    products: formData.products,
                    strategy: formData.strategy
                }
            });
            toast.success("Business Profile updated!");
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating client:", error);
            toast.error("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAiFix = async () => {
        if (!aiFeedback.trim()) return;
        setIsGenerating(true);
        try {
            const currentAnalysis = {
                industry: formData.industry,
                description: formData.description,
                key_products: formData.products,
                suggested_strategy: formData.strategy
            };

            const refined = await refineClientData(currentAnalysis, aiFeedback);

            setFormData({
                industry: refined.industry || formData.industry,
                description: refined.description || formData.description,
                products: refined.key_products || formData.products,
                strategy: refined.suggested_strategy || formData.strategy
            });

            setAiFeedback('');
            toast.success("AI Refined the data!");
        } catch (error) {
            console.error(error);
            toast.error("AI could not fix the data.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={`mb-8 bg-white p-6 rounded-xl border transition-all duration-300 shadow-sm ${isEditing ? 'border-yellow-400/50 ring-1 ring-yellow-400/20' : 'border-gray-200'}`}>

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#101010] rounded text-[#B7EF02]">
                        <Brain size={20} />
                    </div>
                    <h2 className="text-xl font-['Federo'] text-gray-900">
                        {isEditing ? "Editing Business Intelligence" : "AI Business Intelligence"}
                    </h2>
                    {!isEditing && client.industry && (
                        <span className="ml-2 px-3 py-1 bg-[#B7EF02]/20 text-black text-xs font-bold uppercase rounded-full font-['Barlow'] tracking-wide">
                            {client.industry}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 bg-[#B7EF02] text-black rounded-lg font-bold hover:bg-[#a4d602] transition-colors disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                <span>Save</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 text-gray-400 hover:text-[#B7EF02] hover:bg-gray-50 rounded-lg transition-colors"
                            title="Edit Intelligence"
                        >
                            <Pencil size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-6">

                {/* Description Section */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Business Description</label>
                    {isEditing ? (
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#B7EF02] font-['Barlow'] text-gray-800 min-h-[80px]"
                            placeholder="Describe the business..."
                        />
                    ) : (
                        <p className="font-['Barlow'] text-gray-600 leading-relaxed max-w-4xl">
                            {client.description || "No description available."}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Key Products/Services */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase mb-3 font-['Barlow'] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-black rounded-full"></span> Key Products
                        </h3>
                        {isEditing ? (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={formData.products}
                                    onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#B7EF02] font-['Barlow'] text-sm"
                                    placeholder="Comma separated (e.g. Shoes, Belts)"
                                />
                                <p className="text-xs text-gray-400">Separate with commas</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {(client.audit?.products || "").split(',').map((prod: string, i: number) => (
                                    prod.trim() && (
                                        <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded text-sm text-gray-700 font-['Barlow']">
                                            {prod.trim()}
                                        </span>
                                    )
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Strategy Section */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase mb-3 font-['Barlow'] flex items-center gap-2">
                            <Target size={14} /> Suggested Strategy
                        </h3>
                        {isEditing ? (
                            <textarea
                                value={formData.strategy}
                                onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#B7EF02] font-['Barlow'] text-gray-800 text-sm min-h-[80px]"
                                placeholder="Marketing strategy..."
                            />
                        ) : (
                            <div className="p-4 bg-gray-50 border-l-4 border-[#B7EF02] text-gray-700 italic font-medium font-['Barlow'] rounded-r-lg">
                                "{client.audit?.strategy || "No strategy defined."}"
                            </div>
                        )}
                    </div>
                </div>

                {/* Industry Field (Edit Only) */}
                {isEditing && (
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Industry</label>
                        <input
                            type="text"
                            value={formData.industry}
                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#B7EF02] font-['Barlow'] text-sm"
                            placeholder="e.g. E-commerce Fashion"
                        />
                    </div>
                )}

                {/* AI Fixer Section */}
                {isEditing && (
                    <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-[#B7EF02] uppercase mb-2">
                            <Sparkles size={14} /> AI Auto-Fix
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={aiFeedback}
                                onChange={(e) => setAiFeedback(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAiFix()}
                                disabled={isGenerating}
                                className="flex-1 p-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#B7EF02] font-['Barlow'] placeholder-gray-500"
                                placeholder='Type your correction (e.g. "This is a luxury brand, not fast fashion")'
                            />
                            <button
                                onClick={handleAiFix}
                                disabled={isGenerating || !aiFeedback.trim()}
                                className="bg-[#B7EF02] text-black px-4 py-2 rounded-lg font-bold hover:bg-[#a4d602] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isGenerating ? <Loader2 size={20} className="animate-spin" /> : "Fix"}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Describe what's wrong, and the AI will rewrite the fields above automatically.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
