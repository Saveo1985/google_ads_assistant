import { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, signIn } = useAuth();

  // Auto-login for development/demo purposes
  useEffect(() => {
    if (!user) {
      signIn();
    }
  }, [user, signIn]);

  return (
    <Layout>
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-heading text-3xl text-brand-black">Dashboard</h2>
            <p className="text-gray-600 mt-2">Welcome to the Google Ads Assistant Hub.</p>
          </div>
          <div className="text-xs font-mono bg-white px-3 py-1 rounded border border-gray-200 text-gray-400">
            UID: {user?.uid || 'Connecting...'}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-heading text-lg mb-2">Active Campaigns</h3>
          <p className="text-3xl font-bold text-brand-primary text-shadow-sm">0</p>
        </div>
      </div>
    </Layout>
  );
}

export default App;
