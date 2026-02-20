import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, X, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './ui/LanguageSwitcher';

import logo from '../assets/logo.png';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user } = useAuth();
    const auth = getAuth();
    const { t } = useTranslation();

    const navItems = [
        { name: t('nav.dashboard'), icon: LayoutDashboard, path: '/' },
        { name: t('nav.clients'), icon: Users, path: '/clients' },
        { name: t('nav.campaigns'), icon: Users, path: '/campaigns' },
        { name: 'Tasks', icon: CheckSquare, path: '/tasks' }, // Manual text until i18n added for 'tasks'
        { name: t('nav.settings'), icon: Settings, path: '/settings' },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed top-0 left-0 h-screen w-64 bg-[#101010] text-white flex flex-col border-r border-gray-800 z-50 transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-start">
                    <div className="flex flex-col gap-4">
                        <img
                            src={logo}
                            alt="2H Web Solutions"
                            className="h-12 w-auto object-contain self-start"
                        />
                        <div>
                            <h1 className="text-xl font-['Federo'] text-white leading-none">Google Ads</h1>
                            <h1 className="text-xl font-['Federo'] text-[#B7EF02] leading-none">Assistant</h1>
                        </div>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="md:hidden text-gray-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => onClose()} // Close sidebar on navigation (mobile)
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-['Barlow'] ${isActive
                                    ? 'bg-[#B7EF02] text-black font-medium'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer / User */}
                <div className="p-4 border-t border-gray-800 space-y-4">
                    <LanguageSwitcher />

                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                            {user?.email?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm truncate text-gray-300 font-['Barlow']">{user?.email}</p>
                        </div>
                        <button
                            onClick={() => signOut(auth)}
                            className="text-gray-500 hover:text-white transition-colors"
                            title={t('nav.logout')}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
