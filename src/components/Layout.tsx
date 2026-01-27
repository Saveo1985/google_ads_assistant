import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="flex min-h-screen bg-[#F0F0F3]">
            <Sidebar />
            <div className="ml-64 flex-1 p-8 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
