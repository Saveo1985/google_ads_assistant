import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';

const Sidebar = () => {
    const { user } = useAuth();
    const auth = getAuth();

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Clients', icon: Users, path: '/clients' },
        { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
        { name: 'Settings', icon: Settings, path: '/settings' },
    ];

    return (
        <div className="h-screen w-64 bg-[#101010] text-white flex flex-col fixed left-0 top-0 border-r border-gray-800 z-50">
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
                <img
                    src="/assets/logo.png"
                    alt="2H Web Solutions"
                    className="h-10 w-auto object-contain"
                />
                <p className="text-xs text-gray-500 font-['Barlow'] mt-2">Workspace v1.0</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
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
            <div className="p-4 border-t border-gray-800">
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
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
