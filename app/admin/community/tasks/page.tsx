'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiCalendar, FiUser, FiCheckSquare, FiMessageSquare, FiFlag, FiSliders } from 'react-icons/fi';

interface User {
    _id: string;
    name: string;
}

interface Committee {
    _id: string;
    name: string;
}

interface Comment {
    _id: string;
    authorId: {
        name: string;
    };
    content: string;
    createdAt: string;
}

interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'to_do' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    assigneeId?: User;
    committeeId?: Committee;
    comments?: Comment[];
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [members, setMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals Toggles
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Creation form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [dueDate, setDueDate] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [committeeId, setCommitteeId] = useState('');

    // Comment input
    const [commentContent, setCommentContent] = useState('');

    async function fetchTasks() {
        try {
            const token = localStorage.getItem('token');
            const [tasksRes, commsRes, membersRes] = await Promise.all([
                fetch('/api/community/tasks', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/community/committees'),
                fetch('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (tasksRes.ok) setTasks(await tasksRes.json());
            if (commsRes.ok) setCommittees(await commsRes.json());
            if (membersRes.ok) setMembers(await membersRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTasks();
    }, []);

    async function handleCreateTask(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const payload = {
            title,
            description,
            priority,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            assigneeId: assigneeId || undefined,
            committeeId: committeeId || undefined
        };

        try {
            const res = await fetch('/api/community/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowCreateModal(false);
                resetForm();
                fetchTasks();
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handleStatusChange(taskId: string, newStatus: Task['status']) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/community/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) fetchTasks();
        } catch (err) {
            console.error(err);
        }
    }

    async function handleAddComment(e: React.FormEvent) {
        e.preventDefault();
        if (!commentContent.trim() || !selectedTask) return;
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`/api/community/tasks/${selectedTask._id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: commentContent })
            });

            if (res.ok) {
                setCommentContent('');
                const updatedTask = await res.json();
                // Update local status
                setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t));
                setSelectedTask(updatedTask);
            }
        } catch (err) {
            console.error(err);
        }
    }

    function resetForm() {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setAssigneeId('');
        setCommitteeId('');
    }

    const columns: Array<{ id: Task['status']; label: string; color: string }> = [
        { id: 'to_do', label: 'To Do', color: 'border-blue-500' },
        { id: 'in_progress', label: 'In Progress', color: 'border-yellow-500' },
        { id: 'review', label: 'In Review', color: 'border-purple-500' },
        { id: 'done', label: 'Completed', color: 'border-green-500' }
    ];

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Tasks & Operations</h1>
                    <p className="text-gray-400">Distribute milestones, manage task sprints, and monitor progress tags.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowCreateModal(true); }}
                    className="flex items-center bg-accent hover:bg-accent-dark text-black px-5 py-3 rounded-xl font-bold transition-all"
                >
                    <FiPlus className="mr-2" /> Assign Task
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                    {columns.map((col) => {
                        const columnTasks = tasks.filter(t => t.status === col.id);
                        return (
                            <div key={col.id} className="glass rounded-2xl p-4 flex flex-col space-y-4 min-h-[500px]">
                                <div className={`border-l-4 ${col.color} pl-3 py-1 flex justify-between items-center`}>
                                    <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">{col.label}</h3>
                                    <span className="bg-white/5 text-gray-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                        {columnTasks.length}
                                    </span>
                                </div>

                                <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
                                    {columnTasks.map((task) => (
                                        <motion.div
                                            layoutId={task._id}
                                            key={task._id}
                                            onClick={() => setSelectedTask(task)}
                                            className="bg-white/5 hover:bg-white/10 p-5 rounded-xl border border-white/5 cursor-pointer relative group transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${task.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                                                        task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
                                                    }`}>
                                                    {task.priority}
                                                </span>

                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                                    {col.id !== 'done' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const nextMap: Record<string, Task['status']> = {
                                                                    to_do: 'in_progress',
                                                                    in_progress: 'review',
                                                                    review: 'done'
                                                                };
                                                                handleStatusChange(task._id, nextMap[col.id]);
                                                            }}
                                                            className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded"
                                                        >
                                                            &rarr; Move
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <h4 className="text-white font-bold text-sm mb-1 leading-snug group-hover:text-accent transition-colors">
                                                {task.title}
                                            </h4>
                                            <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed mb-4">{task.description}</p>

                                            <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-white/5 pt-3">
                                                <div className="flex items-center">
                                                    <FiUser className="mr-1 text-primary" />
                                                    <span className="truncate max-w-[80px]">{task.assigneeId?.name || 'Unassigned'}</span>
                                                </div>
                                                {task.dueDate && (
                                                    <div className="flex items-center">
                                                        <FiCalendar className="mr-1 text-primary" />
                                                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Task Details / Commenting Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass w-full max-w-xl rounded-3xl p-8 space-y-6">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-accent/10 border border-accent/20 text-accent text-xs px-3 py-1 rounded-full font-bold uppercase">
                                    {selectedTask.status.replace('_', ' ')}
                                </span>
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="text-gray-400 hover:text-white font-bold"
                                >
                                    Close
                                </button>
                            </div>
                            <h2 className="text-2xl font-bold text-white leading-tight">{selectedTask.title}</h2>
                            <p className="text-gray-400 text-sm mt-3 leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
                        </div>

                        {/* Task assignment details metrics */}
                        <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl text-xs text-gray-300">
                            <div>
                                <span className="text-gray-500 block mb-1">Assignee</span>
                                <span className="font-bold text-white flex items-center">
                                    <FiUser className="mr-1.5 text-primary" /> {selectedTask.assigneeId?.name || 'Unassigned'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 block mb-1">Deadline</span>
                                <span className="font-bold text-white flex items-center">
                                    <FiCalendar className="mr-1.5 text-accent" /> {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No Limit'}
                                </span>
                            </div>
                        </div>

                        {/* Comment Section feed */}
                        <div className="space-y-4 border-t border-white/5 pt-4">
                            <h3 className="font-bold text-white text-sm flex items-center">
                                <FiMessageSquare className="mr-2 text-primary" /> Task Discussion
                            </h3>

                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar-thin">
                                {selectedTask.comments?.length === 0 ? (
                                    <p className="text-gray-500 text-xs italic text-center py-4">No comments posted yet.</p>
                                ) : (
                                    selectedTask.comments?.map((c) => (
                                        <div key={c._id} className="p-3 bg-white/5 rounded-xl text-xs">
                                            <div className="flex justify-between text-gray-500 mb-1">
                                                <span className="font-bold text-white">{c.authorId?.name}</span>
                                                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-gray-300">{c.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleAddComment} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Post comment..."
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    className="flex-1 p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none text-xs"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-3 bg-accent hover:bg-accent-dark text-black rounded-xl text-xs font-bold transition-all"
                                >
                                    Send
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Creation Modal form */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass w-full max-w-lg rounded-3xl p-8 space-y-6"
                    >
                        <h2 className="text-2xl font-bold text-white">Assign Task</h2>

                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-300">Task Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Design newsletter layouts"
                                    className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-300">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Details of deliverables..."
                                    className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-300">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as Task['priority'])}
                                        className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-300">Due Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-300">Assign To</label>
                                    <select
                                        value={assigneeId}
                                        onChange={(e) => setAssigneeId(e.target.value)}
                                        className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                                    >
                                        <option value="">Search assignee...</option>
                                        {members.map(m => (
                                            <option key={m._id} value={m._id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-300">Target Committee</label>
                                    <select
                                        value={committeeId}
                                        onChange={(e) => setCommitteeId(e.target.value)}
                                        className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none"
                                    >
                                        <option value="">Unassigned to a specific comm</option>
                                        {committees.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-accent hover:bg-accent-dark text-black rounded-xl transition-all font-bold"
                                >
                                    Assign Task
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
