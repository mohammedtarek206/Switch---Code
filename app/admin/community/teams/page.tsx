'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiGrid, FiUserCheck, FiShield } from 'react-icons/fi';

export default function TeamsManagementPage() {
    const [teams, setTeams] = useState<any[]>([]);
    const [committees, setCommittees] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        _id: '',
        name: '',
        description: '',
        committeeId: '',
        color: '#00FF88',
        icon: 'FiUsers',
        leaderId: '',
        viceLeaderId: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        const token = localStorage.getItem('token');
        try {
            const [teamRes, commRes, userRes] = await Promise.all([
                fetch('/api/community/teams'),
                fetch('/api/community/committees'),
                fetch('/api/community/accounts', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (teamRes.ok) setTeams(await teamRes.json());
            if (commRes.ok) setCommittees(await commRes.json());
            if (userRes.ok) setUsers(await userRes.json());
        } catch { } finally { setLoading(false); }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const isEditing = !!formData._id;
        const method = isEditing ? 'PUT' : 'POST';

        const payload = isEditing ? { ...formData, id: formData._id } : formData;

        const res = await fetch('/api/community/teams', {
            method,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setIsModalOpen(false);
            fetchData();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to save team');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this team?')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/community/teams?id=${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            fetchData();
        } else {
            alert('Failed to delete team');
        }
    }

    function openNewModal() {
        setFormData({
            _id: '',
            name: '',
            description: '',
            committeeId: committees[0]?._id || '',
            color: '#00FF88',
            icon: 'FiUsers',
            leaderId: '',
            viceLeaderId: '',
        });
        setIsModalOpen(true);
    }

    function openEditModal(t: any) {
        setFormData({
            _id: t._id,
            name: t.name,
            description: t.description || '',
            committeeId: t.committeeId?._id || t.committeeId || '',
            color: t.color || '#00FF88',
            icon: t.icon || 'FiUsers',
            leaderId: t.leaderId?._id || t.leaderId || '',
            viceLeaderId: t.viceLeaderId?._id || t.viceLeaderId || '',
        });
        setIsModalOpen(true);
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Teams Management</h1>
                    <p className="text-gray-400 text-sm">Create and manage sub-teams within committees, assign leaders and custom styling.</p>
                </div>
                <button onClick={openNewModal} className="btn-primary-blue px-6 py-3 rounded-xl hover:scale-105 transition-transform shadow-glow-blue flex items-center gap-2">
                    <FiPlus className="w-5 h-5" /> Create New Team
                </button>
            </div>

            {/* Teams Grid */}
            {loading ? (
                <div className="text-center py-12 text-gold">Loading teams...</div>
            ) : teams.length === 0 ? (
                <div className="glass-panel p-12 text-center text-gray-500 rounded-3xl">No sub-teams created yet. Click above to create one.</div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map(team => (
                        <motion.div key={team._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="glass-panel p-6 rounded-3xl border border-blue-500/20 space-y-4 relative overflow-hidden flex flex-col justify-between"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full pointer-events-none" style={{ backgroundColor: team.color || '#00FF88', opacity: 0.15 }} />

                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 border border-blue-500/20 border border-blue-500/30 text-blue-500">
                                            {team.committeeId?.name || 'Committee'}
                                        </span>
                                        <h3 className="text-xl font-bold text-white mt-1">{team.name}</h3>
                                    </div>
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: `${team.color || '#00FF88'}20`, color: team.color || '#00FF88' }}>
                                        <FiUsers className="w-5 h-5" />
                                    </div>
                                </div>

                                <p className="text-gray-400 text-xs line-clamp-2">{team.description || 'No description provided.'}</p>
                            </div>

                            <div className="space-y-2 border-t border-blue-500/20 pt-3 text-xs">
                                <div className="flex items-center justify-between text-gray-300">
                                    <span className="text-gray-500 flex items-center gap-1"><FiShield className="text-gold" /> Leader:</span>
                                    <span className="font-bold text-white">{team.leaderId?.name || 'Unassigned'}</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-300">
                                    <span className="text-gray-500 flex items-center gap-1"><FiUserCheck className="text-blue-400" /> Vice Leader:</span>
                                    <span className="font-bold text-white">{team.viceLeaderId?.name || 'Unassigned'}</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-blue-500/20">
                                <button onClick={() => openEditModal(team)} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl font-bold text-xs flex items-center gap-1">
                                    <FiEdit2 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button onClick={() => handleDelete(team._id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold text-xs flex items-center gap-1">
                                    <FiTrash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel w-full max-w-lg rounded-3xl p-8 space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-2">{formData._id ? 'Edit Team' : 'Create New Team'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400">Parent Committee *</label>
                                <select required value={formData.committeeId} onChange={e => setFormData({ ...formData, committeeId: e.target.value })}
                                    className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold">
                                    <option value="">Select Committee</option>
                                    {committees.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400">Team Name *</label>
                                <input type="text" required placeholder="e.g. Frontend, AI, Recruitment" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400">Description</label>
                                <textarea rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400">Brand Color</label>
                                    <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        className="w-full h-11 p-1 bg-slate-900 border border-blue-500/30 rounded-xl text-white cursor-pointer" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400">Icon Identifier</label>
                                    <input type="text" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                        className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400">Team Leader</label>
                                    <select value={formData.leaderId} onChange={e => setFormData({ ...formData, leaderId: e.target.value })}
                                        className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold">
                                        <option value="">Unassigned</option>
                                        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.username})</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400">Vice Leader</label>
                                    <select value={formData.viceLeaderId} onChange={e => setFormData({ ...formData, viceLeaderId: e.target.value })}
                                        className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold">
                                        <option value="">Unassigned</option>
                                        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.username})</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-blue-500/30">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-900 border border-blue-500/20 font-bold rounded-xl text-gray-300">Cancel</button>
                                <button type="submit" className="btn-primary-blue px-5 py-2.5 rounded-xl font-bold">Save Team</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
