'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiGrid, FiPlus, FiTrash2, FiEdit2, FiTag } from 'react-icons/fi';
import Link from 'next/link';

interface Committee {
    _id: string;
    name: string;
    description: string;
    type: 'technical' | 'non_technical';
    color: string;
    icon: string;
    isActive: boolean;
}

export default function CommitteesPage() {
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'technical' | 'non_technical'>('technical');
    const [color, setColor] = useState('#0066FF');
    const [icon, setIcon] = useState('FiGrid');

    async function fetchCommittees() {
        try {
            const res = await fetch('/api/community/committees');
            if (res.ok) {
                const data = await res.json();
                setCommittees(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCommittees();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const url = editingId ? `/api/community/committees/${editingId}` : '/api/community/committees';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, description, type, color, icon })
            });

            if (res.ok) {
                setShowModal(false);
                resetForm();
                fetchCommittees();
            } else {
                const errData = await res.json();
                alert(errData.error || 'Operation failed');
            }
        } catch {
            alert('Network Error');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this committee?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/community/committees/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchCommittees();
            }
        } catch (err) {
            console.error(err);
        }
    }

    function handleEdit(c: Committee) {
        setEditingId(c._id);
        setName(c.name);
        setDescription(c.description);
        setType(c.type);
        setColor(c.color);
        setIcon(c.icon);
        setShowModal(true);
    }

    function resetForm() {
        setEditingId(null);
        setName('');
        setDescription('');
        setType('technical');
        setColor('#0066FF');
        setIcon('FiGrid');
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Committees Management</h1>
                    <p className="text-gray-400">Organize and monitor all technical and non-technical committees.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center btn-primary-blue px-5 py-3 rounded-xl font-bold transition-all"
                >
                    <FiPlus className="mr-2" /> Add Committee
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {committees.map((c, idx) => (
                        <motion.div
                            key={c._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-panel rounded-2xl p-6 relative overflow-hidden group flex flex-col justify-between"
                            style={{ borderTop: `4px solid ${c.color}` }}
                        >
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-xl" style={{ backgroundColor: `${c.color}20`, color: c.color }}>
                                        <FiGrid className="w-6 h-6" />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleEdit(c)}
                                            className="p-2 hover:bg-slate-900 border border-blue-500/20 rounded-lg text-gray-400 hover:text-white transition-all"
                                        >
                                            <FiEdit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c._id)}
                                            className="p-2 hover:bg-slate-900 border border-blue-500/20 rounded-lg text-red-400 hover:text-red-500 transition-all"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors">
                                        {c.name}
                                    </h3>
                                    <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                                        {c.description}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-blue-500/20 flex items-center justify-between">
                                <span className="flex items-center text-xs text-gray-400 bg-slate-900 border border-blue-500/20 px-3 py-1 rounded-full">
                                    <FiTag className="mr-1" /> {c.type === 'technical' ? 'Technical' : 'Non Technical'}
                                </span>
                                <Link
                                    href={`/admin/community/committees/${c._id}`}
                                    className="text-xs text-gold font-bold hover:underline"
                                >
                                    View Details &rarr;
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Dynamic Popups/Modals */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-panel w-full max-w-lg rounded-3xl p-8 space-y-6"
                    >
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {editingId ? 'Edit Committee' : 'Add New Committee'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-300">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Technical Department"
                                    className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-300">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Insert committee objectives and descriptions..."
                                    className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-300">Type</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as 'technical' | 'non_technical')}
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold"
                                    >
                                        <option value="technical">Technical</option>
                                        <option value="non_technical">Non Technical</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-300">Theme Color</label>
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="w-full h-[58px] p-2 bg-slate-900 border border-blue-500/30 rounded-xl outline-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 bg-slate-900 border border-blue-500/20 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary-blue px-6 py-3 rounded-xl font-bold"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
