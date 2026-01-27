import { useN8nTrigger } from '../hooks/useN8nTrigger';
import { Play } from 'lucide-react';

export const TestAutomation = () => {
    const { triggerWorkflow, isLoading, response } = useN8nTrigger();

    // Replace with a real n8n Webhook URL when ready
    const TEST_WEBHOOK = "https://primary.n8n.com/webhook-test/example";

    const handleTest = () => {
        triggerWorkflow(TEST_WEBHOOK, { action: 'ping', message: 'Hello from React' });
    };

    return (
        <div className="p-4 border border-dashed border-gray-300 rounded-lg mt-6">
            <h4 className="font-heading text-sm text-gray-500 mb-2">Automation Debugger</h4>
            <button
                onClick={handleTest}
                disabled={isLoading}
                className="flex items-center gap-2 bg-brand-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50"
            >
                <Play size={16} />
                {isLoading ? 'Running...' : 'Test n8n Connection'}
            </button>
            {response && (
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(response, null, 2)}
                </pre>
            )}
        </div>
    );
};
