
import { LayoutDashboard, Settings, Activity } from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', active: true },
        { icon: Activity, label: 'Core Feature', active: false },
        { icon: Settings, label: 'Settings', active: false },
    ];

    return (
        <aside className="w-64 h-screen bg-brand-black text-white flex flex-col fixed left-0 top-0 border-r border-gray-800">
            <div className="p-6">
                <h1 className="font-heading text-2xl text-brand-primary tracking-wider">
                    2H WEB
                </h1>
                <p className="text-xs text-gray-400 font-sans mt-1">Google Ads Assistant</p>
            </div>

            <nav className="flex-1 px-4 mt-4 space-y-2">
                {navItems.map((item, index) => (
                    <button
                        key={index}
                        className={clsx(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-sans",
                            item.active
                                ? "bg-brand-primary text-brand-black font-medium"
                                : "text-gray-400 hover:bg-gray-900 hover:text-white"
                        )}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <div className="text-xs text-gray-500 font-sans">v1.0.0 Stable</div>
            </div>
        </aside>
    );
};
