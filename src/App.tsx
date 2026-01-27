import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import CampaignWorkspace from './pages/CampaignWorkspace';
import Tasks from './pages/Tasks';

// Login Component
const Login = () => {
  const { loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return (
    <div className="h-screen flex items-center justify-center bg-[#101010]">
      <div className="text-center">
        <h1 className="text-4xl font-['Federo'] text-[#B7EF02] mb-4">2H ADS</h1>
        <p className="text-gray-400 font-['Barlow']">Please sign in via Firebase to continue.</p>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10">Loading App...</div>;
  if (!user) return <Login />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:clientId" element={<ClientDetails />} />
          <Route path="clients/:clientId/campaigns/:campaignId" element={<CampaignWorkspace />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="settings" element={<div>Settings Page</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
