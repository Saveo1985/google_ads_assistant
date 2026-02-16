import React, { useState, useEffect } from 'react';
import { Calculator, Save, TrendingUp, DollarSign, Percent, RefreshCw, Plus, Trash2, Layers } from 'lucide-react';
import { updateDoc } from 'firebase/firestore';
import { getAppDoc, type UnitEconomics, type ServiceLineEconomics } from '../../lib/db';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';

interface ClientEconomicsSimulatorProps {
    clientId: string;
    initialData?: UnitEconomics; // Legacy support
    initialServiceLines?: ServiceLineEconomics[]; // New support
}

export default function ClientEconomicsSimulator({ clientId, initialData, initialServiceLines }: ClientEconomicsSimulatorProps) {
    const { t } = useTranslation();
    // State
    const [serviceLines, setServiceLines] = useState<ServiceLineEconomics[]>([]);
    const [activeServiceId, setActiveServiceId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Initialization Logic
    useEffect(() => {
        if (initialServiceLines && initialServiceLines.length > 0) {
            setServiceLines(initialServiceLines);
            setActiveServiceId(initialServiceLines[0].id);
        } else {
            // Migration / Default
            const defaultService: ServiceLineEconomics = {
                id: uuidv4(),
                name: 'Service',
                currency: 'EUR',
                aov: initialData?.aov || 500,
                targetRoas: initialData?.targetRoas || 4.0,
                taxRate: initialData?.taxRate || 19,
                returnRate: initialData?.returnRate || 0,
                margin: initialData?.cogs ? (100 - initialData.cogs) : 50, // Best effort migration if cogs existed
            };
            setServiceLines([defaultService]);
            setActiveServiceId(defaultService.id);
        }
    }, []); // Only run once on mount

    const activeService = serviceLines.find(s => s.id === activeServiceId) || serviceLines[0];

    // Derived Metrics Logic (Calculated on the fly from activeService)
    const metrics = React.useMemo(() => {
        if (!activeService) return { netRevenue: 0, grossProfit: 0, adSpend: 0, netProfit: 0, breakEvenRoas: 0, breakEvenCpa: 0 };

        const { aov, targetRoas, margin } = activeService;

        // Service Business Logic:
        // Gross Profit = AOV * Margin %
        const grossProfit = aov * (margin / 100);

        const adSpend = targetRoas > 0 ? aov / targetRoas : 0;
        const netProfit = grossProfit - adSpend;

        // Break Even ROAS = AOV / Gross Profit
        // Simplified: 1 / (Margin / 100)
        const breakEvenRoas = grossProfit > 0 ? aov / grossProfit : 999;
        const breakEvenCpa = grossProfit;

        return { netRevenue: aov, grossProfit, adSpend, netProfit, breakEvenRoas, breakEvenCpa };
    }, [activeService]);


    const handleChange = (field: keyof ServiceLineEconomics, value: string) => {
        if (!activeService) return;

        const updatedLines = serviceLines.map(line => {
            if (line.id === activeServiceId) {
                return { ...line, [field]: parseFloat(value) || 0 };
            }
            return line;
        });
        setServiceLines(updatedLines);
    };

    const handleAddService = () => {
        const name = prompt(`${t('economics.service_line')} Name (e.g. 'Lasertag'):`);
        if (!name) return;

        const newService: ServiceLineEconomics = {
            id: uuidv4(),
            name,
            currency: 'EUR',
            aov: 500,
            targetRoas: 4.0,
            taxRate: 19,
            returnRate: 0,
            margin: 50,
        };

        setServiceLines([...serviceLines, newService]);
        setActiveServiceId(newService.id);
        toast.success(`${t('economics.add_service')}: '${name}'`);
    };

    const handleDeleteService = () => {
        if (serviceLines.length <= 1) {
            toast.error("Cannot delete the last service line.");
            return;
        }
        if (!window.confirm(`${t('economics.delete_service')} '${activeService?.name}'?`)) return;

        const filtered = serviceLines.filter(s => s.id !== activeServiceId);
        setServiceLines(filtered);
        setActiveServiceId(filtered[0].id);
        toast.success(t('economics.delete_service'));
    };


    const saveEconomics = async () => {
        if (!clientId) return;
        setIsSaving(true);
        try {
            await updateDoc(getAppDoc('clients', clientId), {
                serviceLines: serviceLines
            });
            toast.success(t('economics.saved_toast'));
        } catch (error) {
            console.error("Error saving economics:", error);
            toast.error("Failed to save data.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!activeService) return <div className="p-4">{t('common.loading')}</div>;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2 text-gray-800">
                    <div className="bg-[#B7EF02]/20 p-2 rounded-lg text-[#8cb800]">
                        <Calculator size={20} />
                    </div>
                    <div>
                        <h3 className="font-['Federo'] text-lg leading-none">{t('economics.title')}</h3>
                        <p className="font-['Barlow'] text-xs text-gray-500">Manage Profit Centers & Service Lines</p>
                    </div>
                </div>

                <button
                    onClick={saveEconomics}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-[#101010] text-[#B7EF02] px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-70 self-end md:self-center"
                >
                    {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {t('economics.save')}
                </button>
            </div>

            {/* Service Line Selector */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 overflow-x-auto bg-white no-scrollbar">
                <div className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
                    <Layers size={14} /> {t('economics.service_line')}:
                </div>
                {serviceLines.map(service => (
                    <button
                        key={service.id}
                        onClick={() => setActiveServiceId(service.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${activeServiceId === service.id
                            ? 'bg-[#B7EF02] text-black shadow-sm ring-1 ring-[#a4d602]'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {service.name}
                    </button>
                ))}
                <button
                    onClick={handleAddService}
                    className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                    title={t('economics.add_service')}
                >
                    <Plus size={14} />
                </button>
            </div>


            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {/* LEFT: Inputs */}
                <div className="p-6 md:w-1/2 space-y-5 bg-white font-['Barlow'] relative">
                    <div className="flex justify-end absolute top-4 right-4">
                        <button
                            onClick={handleDeleteService}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                            title={t('economics.delete_service')}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Revenue & Goals ({activeService.name})</label>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup
                                label={t('economics.inputs.aov')}
                                icon={<DollarSign size={14} />}
                                value={activeService.aov}
                                onChange={(v) => handleChange('aov', v)}
                                suffix="€"
                            />
                            <InputGroup
                                label={t('economics.inputs.target_roas')}
                                icon={<TrendingUp size={14} />}
                                value={activeService.targetRoas}
                                onChange={(v) => handleChange('targetRoas', v)}
                                step={0.1}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Deductions</label>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup
                                label={t('economics.inputs.tax')}
                                icon={<Percent size={14} />}
                                value={activeService.taxRate}
                                onChange={(v) => handleChange('taxRate', v)}
                                suffix="%"
                            />
                            <InputGroup
                                label={t('economics.inputs.returns')}
                                icon={<Percent size={14} />}
                                value={activeService.returnRate}
                                onChange={(v) => handleChange('returnRate', v)}
                                suffix="%"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Profit Structure</label>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup
                                label={t('economics.inputs.margin')}
                                icon={<Percent size={14} />}
                                value={activeService.margin}
                                onChange={(v) => handleChange('margin', v)}
                                suffix="%"
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: KPIs */}
                <div className="p-6 md:w-1/2 bg-[#F9FAFB] flex flex-col justify-center font-['Barlow']">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <KPICard
                            label={t('economics.kpis.break_even_roas')}
                            value={metrics.breakEvenRoas.toFixed(2)}
                            subtext="Min. ROAS to not lose money"
                            highlight={activeService.targetRoas < metrics.breakEvenRoas}
                            color={activeService.targetRoas < metrics.breakEvenRoas ? "text-red-600" : "text-gray-900"}
                        />
                        <KPICard
                            label={t('economics.kpis.max_cpa')}
                            value={`€${metrics.breakEvenCpa.toFixed(2)}`}
                            subtext="Max Ad Spend per Order"
                        />
                    </div>

                    <div className="bg-[#101010] rounded-xl p-5 text-white shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign size={80} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-gray-400 text-sm uppercase font-bold tracking-wider mb-1">{t('economics.kpis.net_profit')}</p>
                            <div className={`text-4xl font-['Federo'] mb-2 ${metrics.netProfit < 0 ? 'text-red-400' : 'text-[#B7EF02]'}`}>
                                €{metrics.netProfit.toFixed(2)}
                            </div>
                            <div className="flex gap-4 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-800">
                                <div>
                                    <span className="block text-gray-400">Revenue</span>
                                    €{metrics.netRevenue.toFixed(2)}
                                </div>
                                <div>
                                    <span className="block text-gray-400">Margin</span>
                                    €{metrics.grossProfit.toFixed(2)}
                                </div>
                                <div>
                                    <span className="block text-gray-400">Spend</span>
                                    €{metrics.adSpend.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Sub-components ---

interface InputGroupProps {
    label: string;
    icon: React.ReactNode;
    value: number;
    onChange: (value: string) => void;
    suffix?: string;
    step?: number;
}

const InputGroup = ({ label, icon, value, onChange, suffix, step = 1 }: InputGroupProps) => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 px-3 focus-within:border-[#B7EF02] focus-within:ring-1 focus-within:ring-[#B7EF02] transition-all">
        <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1 mb-1">
            {icon} {label}
        </label>
        <div className="flex items-center">
            <input
                type="number"
                step={step}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-transparent text-gray-900 font-bold focus:outline-none"
            />
            {suffix && <span className="text-sm text-gray-400 font-medium ml-1">{suffix}</span>}
        </div>
    </div>
);

interface KPICardProps {
    label: string;
    value: string | number;
    subtext?: string;
    highlight?: boolean;
    color?: string;
}

const KPICard = ({ label, value, subtext, highlight, color = "text-gray-900" }: KPICardProps) => (
    <div className={`bg-white border rounded-xl p-4 shadow-sm ${highlight ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
        <p className="text-xs text-gray-500 uppercase font-bold mb-1">{label}</p>
        <div className={`text-2xl font-['Federo'] ${color}`}>{value}</div>
        {subtext && <p className="text-[10px] text-gray-400 mt-1">{subtext}</p>}
    </div>
);
