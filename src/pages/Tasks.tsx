import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Calendar, ArrowRight, Trash2, CheckCircle, Circle, Briefcase } from 'lucide-react';
import { onSnapshot, query, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAppCollection, getAppDoc } from '../lib/db';

export default function Tasks() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Query tasks, ordered by creation time (newest first)
        // In a real app, you might order by 'due_date'
        const q = query(getAppCollection('tasks'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const taskData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTasks(taskData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const toggleStatus = async (taskId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
        try {
            // Direct update to Firestore
            const taskRef = getAppDoc('tasks', taskId);
            await updateDoc(taskRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const deleteTask = async (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation(); // Prevent navigating if we click delete
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                const taskRef = getAppDoc('tasks', taskId);
                await deleteDoc(taskRef);
            } catch (error) {
                console.error("Error deleting task:", error);
            }
        }
    };

    const navigateToContext = (clientId: string, campaignId: string) => {
        if (clientId && campaignId) {
            navigate(`/clients/${clientId}/campaigns/${campaignId}`);
        } else if (clientId) {
            navigate(`/clients/${clientId}`);
        }
    };

    // Filtering State
    const [filterClient, setFilterClient] = useState<string>('all');
    const [filterCampaign, setFilterCampaign] = useState<string>('all');

    // Extract Unique Options from Tasks
    const clients = Array.from(new Set(tasks.map(t => t.clientId).filter(Boolean)));
    const campaigns = Array.from(new Set(tasks.map(t => t.campaignId).filter(Boolean)));

    // Filter Logic
    const filteredTasks = tasks.filter(t => {
        const matchClient = filterClient === 'all' || t.clientId === filterClient;
        const matchCampaign = filterCampaign === 'all' || t.campaignId === filterCampaign;
        return matchClient && matchCampaign;
    });

    // Group tasks for UI
    const pendingTasks = filteredTasks.filter(t => t.status !== 'Completed');
    const completedTasks = filteredTasks.filter(t => t.status === 'Completed');

    return (
        <div className="h-full bg-[#F0F0F3] p-8 -m-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-['Federo'] text-gray-900">Task Manager</h1>
                    <p className="text-gray-500 font-['Barlow']">Track your AI-generated action items</p>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <select
                        value={filterClient}
                        onChange={(e) => setFilterClient(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-['Barlow'] focus:outline-none focus:border-[#B7EF02]"
                    >
                        <option value="all">All Clients</option>
                        {clients.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={filterCampaign}
                        onChange={(e) => setFilterCampaign(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-['Barlow'] focus:outline-none focus:border-[#B7EF02]"
                    >
                        <option value="all">All Campaigns</option>
                        {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading tasks...</div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <CheckSquare className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
                    <p className="text-gray-500 mb-4">
                        {filterClient !== 'all' || filterCampaign !== 'all'
                            ? "Try adjusting your filters."
                            : "Ask the Campaign Assistant to create tasks for you."}
                    </p>
                </div>
            ) : (
                <div className="space-y-8">

                    {/* PENDING TASKS */}
                    <div>
                        <h2 className="text-lg font-['Federo'] text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#B7EF02]"></span>
                            Pending ({pendingTasks.length})
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            {pendingTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group"
                                >
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleStatus(task.id, task.status)}
                                        className="text-gray-300 hover:text-[#B7EF02] transition-colors"
                                    >
                                        <Circle size={24} />
                                    </button>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-['Federo'] text-gray-900">{task.task}</h3>
                                        <p className="text-sm text-gray-500 font-['Barlow'] mb-2">{task.description}</p>

                                        <div className="flex items-center gap-4">
                                            {task.due_date && (
                                                <div className="flex items-center gap-1 text-xs text-orange-500 font-medium bg-orange-50 px-2 py-1 rounded">
                                                    <Calendar size={12} />
                                                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {(task.related_client_id || task.related_campaign_id) && (
                                                <button
                                                    onClick={() => navigateToContext(task.related_client_id, task.related_campaign_id)}
                                                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 hover:underline"
                                                >
                                                    <Briefcase size={12} />
                                                    <span>View Context</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {(task.related_client_id && task.related_campaign_id) && (
                                            <button
                                                onClick={() => navigateToContext(task.related_client_id, task.related_campaign_id)}
                                                className="p-2 text-gray-400 hover:text-[#B7EF02] hover:bg-gray-50 rounded-lg"
                                                title="Go to Campaign"
                                            >
                                                <ArrowRight size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => deleteTask(e, task.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                            title="Delete Task"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {pendingTasks.length === 0 && (
                                <p className="text-sm text-gray-400 font-['Barlow'] italic">All caught up!</p>
                            )}
                        </div>
                    </div>

                    {/* COMPLETED TASKS */}
                    {completedTasks.length > 0 && (
                        <div className="opacity-60">
                            <h2 className="text-lg font-['Federo'] text-gray-600 mb-4">Completed</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {completedTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-4"
                                    >
                                        <button
                                            onClick={() => toggleStatus(task.id, task.status)}
                                            className="text-green-500"
                                        >
                                            <CheckCircle size={24} />
                                        </button>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-['Federo'] text-gray-500 line-through">{task.task}</h3>
                                        </div>
                                        <button
                                            onClick={(e) => deleteTask(e, task.id)}
                                            className="p-2 text-gray-300 hover:text-red-400"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
