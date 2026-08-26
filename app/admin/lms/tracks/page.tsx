'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight, FiX, FiSearch } from 'react-icons/fi';

interface LMSTrack {
    _id: string;
    name: string;
    description: string;
    thumbnail?: string;
    category: string;
    level: string;
    duration: string;
    status: 'active' | 'inactive';
    sortOrder: number;
    createdAt: string;
}

const emptyForm = { name: '', description: '', thumbnail: '', category: '', level: 'Beginner', duration: '', status: 'active', sortOrder: 0 };

export default function AdminLMSTracks() {
    const [tracks, setTracks] = useState<LMSTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<LMSTrack | null>(null);
    const [formData, setFormData] = useState<any>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchTracks(); }, []);

    const fetchTracks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/lms/tracks/admin', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setTracks(data.tracks || []);
        } catch { }
        finally { setLoading(false); }
    };

    const openCreate = () => { setModalError(null); setEditing(null); setFormData(emptyForm); setShowModal(true); };
    const openEdit = (t: LMSTrack) => { setModalError(null); setEditing(t); setFormData({ name: t.name, description: t.description, thumbnail: t.thumbnail || '', category: t.category, level: t.level, duration: t.duration, status: t.status, sortOrder: t.sortOrder }); setShowModal(true); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setModalError(null);
        try {
            const token = localStorage.getItem('token');
            const url = editing ? `/api/lms/tracks/${editing._id}` : '/api/lms/tracks';
            const method = editing ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                setShowModal(false);
                fetchTracks();
            } else {
                setModalError(data.error || 'Failed to save track. Check permissions or inputs.');
            }
        } catch (err: any) {
            setModalError(err.message || 'Network error occurred');
        }
        finally { setSaving(false); }
    };

    const toggleStatus = async (track: LMSTrack) => {
        const token = localStorage.getItem('token');
        await fetch(`/api/lms/tracks/${track._id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: track.status === 'active' ? 'inactive' : 'active' }),
        });
        fetchTracks();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this track? This will not delete its content.')) return;
        const token = localStorage.getItem('token');
        await fetch(`/api/lms/tracks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        fetchTracks();
    };

    const filtered = tracks.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">LMS Tracks</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage learning tracks for students</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-600/80 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20">
                    <FiPlus className="w-4 h-4" /> Add Track
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search tracks..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm outline-none focus:border-blue-500/30"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Tracks', val: tracks.length },
                    { label: 'Active', val: tracks.filter(t => t.status === 'active').length },
                    { label: 'Inactive', val: tracks.filter(t => t.status === 'inactive').length },
                ].map(s => (
                    <div key={s.label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                        <p className="text-2xl font-extrabold text-white">{s.val}</p>
                        <p className="text-xs text-gray-500 uppercase font-bold mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-[#0B1220] rounded-2xl border border-blue-500/20 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            {['Track Name', 'Category', 'Level', 'Duration', 'Status', 'Actions'].map(h => (
                                <th key={h} className="text-left px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-12 text-gray-500">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-12 text-gray-500">No tracks found</td></tr>
                        ) : (
                            filtered.map(track => (
                                <tr key={track._id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            {track.thumbnail && <img src={track.thumbnail} alt="" className="w-10 h-7 rounded object-cover" />}
                                            <div>
                                                <p className="font-bold text-white text-sm">{track.name}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1">{track.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-300">{track.category}</td>
                                    <td className="px-5 py-4">
                                        <span className="text-xs px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-full font-bold">{track.level}</span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-400">{track.duration}</td>
                                    <td className="px-5 py-4">
                                        <button onClick={() => toggleStatus(track)} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${track.status === 'active' ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'}`}>
                                            {track.status === 'active' ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                                            {track.status === 'active' ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(track)} className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors">
                                                <FiEdit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(track._id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors">
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0B1220] w-full max-w-2xl rounded-3xl p-8 border border-blue-500/30 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">{editing ? 'Edit Track' : 'Add New Track'}</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-gray-400"><FiX className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleSave} className="space-y-4">
                                {modalError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
                                        {modalError}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Track Name *</label>
                                        <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Frontend Development" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Description *</label>
                                        <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="What will students learn?" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30 h-24 resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Category *</label>
                                        <input required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            placeholder="e.g. Web Development" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Level</label>
                                        <select value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30">
                                            {['Beginner', 'Intermediate', 'Advanced'].map(l => <option key={l} value={l} className="bg-gray-900">{l}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Duration</label>
                                        <input value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                            placeholder="e.g. 12 weeks" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Sort Order</label>
                                        <input type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: +e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Status</label>
                                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30">
                                            <option value="active" className="bg-gray-900">Active</option>
                                            <option value="inactive" className="bg-gray-900">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Thumbnail URL</label>
                                        <input value={formData.thumbnail} onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                                            placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30" />
                                    </div>
                                </div>
                                <button type="submit" disabled={saving}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-600/80 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                    {saving ? 'Saving...' : editing ? 'Update Track' : 'Create Track'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
