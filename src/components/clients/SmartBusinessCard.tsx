import { useState, useEffect } from 'react';
import { Brain, Target, Pencil, X, Check, Loader2, Sparkles } from 'lucide-react';
import { analyzeBrand } from '../../lib/gemini';
import { scrapeWebsite } from '../../lib/n8n';
import { toast } from 'react-hot-toast';

interface SmartBusinessCardProps {
    clientData: any;
    onUpdate: (data: any) => Promise<void>;
}

export default function SmartBusinessCard({ clientData, onUpdate }: SmartBusinessCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Local State for Form
    const [formData, setFormData] = useState({
        industry: '',
        description: '',
        products: '',
        strategy: '',
        googleAdsCustomerId: ''
    });

    const [aiFeedback, setAiFeedback] = useState('');

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [pendingData, setPendingData] = useState<any>(null);

    // Sync state with client data on load or cancel
    useEffect(() => {
        if (clientData) {
            setFormData({
                industry: clientData.industry || '',
                description: clientData.description || '',
                products: clientData.audit?.products || '',
                strategy: clientData.audit?.strategy || '',
                googleAdsCustomerId: clientData.googleAdsCustomerId || ''
            });
        }
    }, [clientData]);

    const handleSave = async (dataToSave = formData) => {
        setIsSaving(true);
        try {
            await onUpdate({
                industry: dataToSave.industry,
                description: dataToSave.description,
                googleAdsCustomerId: dataToSave.googleAdsCustomerId,
                audit: {
                    ...clientData.audit,
                    products: dataToSave.products,
                    strategy: dataToSave.strategy
                }
            });
            toast.success("Business Profile updated!");
            setIsEditing(false);
            setShowReviewModal(false);
            setPendingData(null);
        } catch (error) {
            console.error("Error updating client:", error);
            toast.error("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAiFix = async () => {
        // Strict Rule: Inform user if scraping fails, don't just guess.
        setIsGenerating(true);
        try {
            let scrapedContent: string | null = null;
            if (clientData.website) {
                toast("Analysing website (via n8n)...", { icon: "🌐" });
                const scrapeResult = await scrapeWebsite(clientData.website);

                if (scrapeResult.content) {
                    scrapedContent = scrapeResult.content;
                }

                if (scrapeResult.error || !scrapedContent) {
                    toast.error("Website konnte nicht gelesen werden. Bitte Daten manuell prüfen.", { duration: 5000 });
                    // Proceeding allows AI to say "Scraping Failed" if needed.
                }
            }

            const result = await analyzeBrand(clientData.name, clientData.website || '', scrapedContent || undefined, aiFeedback);

            setPendingData({
                industry: result.industry || formData.industry,
                description: result.description || formData.description,
                products: result.key_products || formData.products,
                strategy: result.suggested_strategy || formData.strategy,
                googleAdsCustomerId: formData.googleAdsCustomerId // Keep existing ID
            });
            setShowReviewModal(true);

            setAiFeedback('');
            toast.success("AI Analysis Complete. Please review.");
        } catch (error) {
            console.error(error);
            toast.error("AI Analysis failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
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
                        {!isEditing && clientData.industry && (
                            <span className="ml-2 px-3 py-1 bg-[#B7EF02]/20 text-black text-xs font-bold uppercase rounded-full font-['Barlow'] tracking-wide">
                                {clientData.industry}
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
                                    onClick={() => handleSave(formData)}
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
                                {clientData.description || "No description available."}
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
                                    {(clientData.audit?.products || "").split(',').map((prod: string, i: number) => (
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
                                    "{clientData.audit?.strategy || "No strategy defined."}"
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Industry & Google Ads ID (Edit Only or View Mode) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        {/* Google Ads Customer ID */}
                        <div>
                            {isEditing ? (
                                <>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Google Ads Customer ID</label>
                                    <input
                                        type="text"
                                        value={formData.googleAdsCustomerId}
                                        onChange={(e) => setFormData({ ...formData, googleAdsCustomerId: e.target.value })}
                                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#B7EF02] font-['Barlow'] text-sm"
                                        placeholder="e.g. 123-456-7890"
                                    />
                                </>
                            ) : (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="p-1 bg-gray-100 rounded text-gray-500"><Target size={14} /></span>
                                    <span className="text-xs font-['Barlow'] text-gray-500">
                                        {clientData.googleAdsCustomerId ? `G-Ads ID: ${clientData.googleAdsCustomerId}` : "No Google Ads ID connected"}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

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

            {/* AI Review Modal */}
            {showReviewModal && pendingData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
                            <div>
                                <h3 className="text-xl font-bold font-['Federo'] flex items-center gap-2">
                                    <Sparkles size={20} className="text-[#B7EF02]" />
                                    Review AI Suggestions
                                </h3>
                                <p className="text-sm text-gray-500">Please verify the AI-generated business profile.</p>
                            </div>
                            <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Industry</label>
                                <input
                                    value={pendingData.industry}
                                    onChange={(e) => setPendingData({ ...pendingData, industry: e.target.value })}
                                    className="w-full p-2 border border-gray-200 rounded-lg font-['Barlow']"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
                                <textarea
                                    value={pendingData.description}
                                    onChange={(e) => setPendingData({ ...pendingData, description: e.target.value })}
                                    className="w-full p-2 border border-gray-200 rounded-lg font-['Barlow'] min-h-[80px]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Products</label>
                                <input
                                    value={pendingData.products}
                                    onChange={(e) => setPendingData({ ...pendingData, products: e.target.value })}
                                    className="w-full p-2 border border-gray-200 rounded-lg font-['Barlow']"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Strategy</label>
                                <textarea
                                    value={pendingData.strategy}
                                    onChange={(e) => setPendingData({ ...pendingData, strategy: e.target.value })}
                                    className="w-full p-2 border border-gray-200 rounded-lg font-['Barlow'] min-h-[80px]"
                                />
                            </div>
                            {/* Read-Only Google Ads ID to hint it's preserved */}
                            <div className="opacity-50 pointer-events-none">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Google Ads Customer ID (Preserved)</label>
                                <input
                                    value={pendingData.googleAdsCustomerId}
                                    readOnly
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-['Barlow']"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setFormData(pendingData);
                                    handleSave(pendingData);
                                }}
                                className="px-6 py-2 bg-[#B7EF02] text-black rounded-lg font-bold hover:bg-[#a4d602] transition-colors flex items-center gap-2"
                            >
                                <Check size={18} />
                                Übernehmen & Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
