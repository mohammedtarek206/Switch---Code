'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff, FiX } from 'react-icons/fi';

interface Track { _id: string; name: string; }
interface Material {
    _id: string;
    title: string;
    materialType: string;
    fileUrl: string;
    order: number;
    published: boolean;
    allowDownload: boolean;
    trackId: { _id: string; name: string } | string;
}

const emptyForm = { title: '', description: '', trackId: '', materialType: 'pdf', fileUrl: '', thumbnail: '', order: 0, published: true, allowDownload: true };

export default function AdminLMSMaterials() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Material | null>(null);
    const [formData, setFormData] = useState<any>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const [mRes, tRes] = await Promise.all([
                fetch('/api/lms/materials/admin', { headers }),
                fetch('/api/lms/tracks/admin', { headers }),
            ]);
            const mData = await mRes.json();
            const tData = await tRes.json();
            setMaterials(mData.materials || []);
            setTracks(tData.tracks || []);
        } catch { }
        finally { setLoading(false); }
    };

    const openCreate = () => { setModalError(null); setEditing(null); setFormData(emptyForm); setShowModal(true); };
    const openEdit = (m: Material) => {
        setModalError(null);
        setEditing(m);
        setFormData({ title: m.title, description: '', trackId: typeof m.trackId === 'object' ? m.trackId._id : m.trackId, materialType: m.materialType, fileUrl: m.fileUrl, thumbnail: '', order: m.order, published: m.published, allowDownload: m.allowDownload });
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setModalError(null);
        try {
            const token = localStorage.getItem('token');
            const url = editing ? `/api/lms/materials/${editing._id}` : '/api/lms/materials';
            const method = editing ? 'PATCH' : 'POST';
            const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const data = await res.json();
            if (res.ok) { setShowModal(false); fetchAll(); }
            else { setModalError(data.error || 'Failed to save material'); }
        } catch (err: any) { setModalError(err.message || 'Network error'); }
        finally { setSaving(false); }
    };

    const togglePublish = async (m: Material) => {
        const token = localStorage.getItem('token');
        await fetch(`/api/lms/materials/${m._id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !m.published }) });
        fetchAll();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this material?')) return;
        const token = localStorage.getItem('token');
        await fetch(`/api/lms/materials/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        fetchAll();
    };

    const typeColors: Record<string, string> = { pdf: 'text-red-400 bg-red-500/10', document: 'text-blue-400 bg-blue-500/10', presentation: 'text-orange-400 bg-orange-500/10', link: 'text-purple-400 bg-purple-500/10', other: 'text-gray-400 bg-gray-500/10' };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Reading Materials</h1>
                    <p className="text-gray-400 text-sm mt-1">{materials.length} total materials</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-600/80 text-white rounded-xl font-bold text-sm">
                    <FiPlus className="w-4 h-4" /> Add Material
                </button>
            </div>

            <div className="bg-[#0B1220] rounded-2xl border border-blue-500/20 overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            {['Title', 'Track', 'Type', 'Status', 'Actions'].map(h => (
                                <th key={h} className="text-left px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-12 text-gray-500">Loading...</td></tr>
                        ) : materials.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-12 text-gray-500">No materials found</td></tr>
                        ) : (
                            materials.map(m => (
                                <tr key={m._id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-4">
                                        <p className="font-bold text-white text-sm line-clamp-1">{m.title}</p>
                                        <a href={m.fileUrl} target="_blank" className="text-xs text-blue-400 hover:underline line-clamp-1 mt-0.5">{m.fileUrl}</a>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-400">{typeof m.trackId === 'object' ? m.trackId.name : '-'}</td>
                                    <td className="px-5 py-4">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${typeColors[m.materialType] || typeColors.other}`}>{m.materialType}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button onClick={() => togglePublish(m)} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${m.published ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                            {m.published ? <FiEye className="w-3.5 h-3.5" /> : <FiEyeOff className="w-3.5 h-3.5" />}
                                            {m.published ? 'Published' : 'Draft'}
                                        </button>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(m)} className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg"><FiEdit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(m._id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"><FiTrash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0B1220] w-full max-w-2xl rounded-3xl p-8 border border-blue-500/30 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">{editing ? 'Edit Material' : 'Add Material'}</h2>
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
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Title *</label>
                                        <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Material title" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">File / Link URL *</label>
                                        <input required value={formData.fileUrl} onChange={e => setFormData({ ...formData, fileUrl: e.target.value })} placeholder="https://drive.google.com/... or PDF URL" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Track *</label>
                                        <select required value={formData.trackId} onChange={e => setFormData({ ...formData, trackId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30">
                                            <option value="" className="bg-gray-900">Select Track</option>
                                            {tracks.map(t => <option key={t._id} value={t._id} className="bg-gray-900">{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Type</label>
                                        <select value={formData.materialType} onChange={e => setFormData({ ...formData, materialType: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30">
                                            {['pdf', 'document', 'presentation', 'link', 'other'].map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Order</label>
                                        <input type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: +e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Description</label>
                                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none h-20 resize-none" />
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 font-bold uppercase">Published</span>
                                            <button type="button" onClick={() => setFormData({ ...formData, published: !formData.published })} className={`w-10 h-5 rounded-full relative transition-all ${formData.published ? 'bg-green-500' : 'bg-gray-600'}`}>
                                                <span className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${formData.published ? 'left-6' : 'left-1'}`} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 font-bold uppercase">Allow Download</span>
                                            <button type="button" onClick={() => setFormData({ ...formData, allowDownload: !formData.allowDownload })} className={`w-10 h-5 rounded-full relative transition-all ${formData.allowDownload ? 'bg-blue-500' : 'bg-gray-600'}`}>
                                                <span className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${formData.allowDownload ? 'left-6' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" disabled={saving} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                                    {saving ? 'Saving...' : editing ? 'Update' : 'Add Material'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
