'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff, FiX, FiYoutube } from 'react-icons/fi';
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';

interface Track { _id: string; name: string; }
interface Video {
    _id: string;
    title: string;
    instructor: string;
    videoUrl: string;
    thumbnail?: string;
    duration: string;
    order: number;
    published: boolean;
    trackId: { _id: string; name: string } | string;
    createdAt: string;
}

const emptyForm = { title: '', description: '', trackId: '', instructor: 'Switch Code', videoUrl: '', thumbnail: '', duration: '', order: 0, published: true };

export default function AdminLMSVideos() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Video | null>(null);
    const [formData, setFormData] = useState<any>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [filterTrack, setFilterTrack] = useState('');

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const [vRes, tRes] = await Promise.all([
                fetch('/api/lms/videos/admin', { headers }),
                fetch('/api/lms/tracks/admin', { headers }),
            ]);
            const vData = await vRes.json();
            const tData = await tRes.json();
            setVideos(vData.videos || []);
            setTracks(tData.tracks || []);
        } catch { }
        finally { setLoading(false); }
    };

    const openCreate = () => { setModalError(null); setEditing(null); setFormData(emptyForm); setShowModal(true); };
    const openEdit = (v: Video) => {
        setModalError(null);
        setEditing(v);
        setFormData({ title: v.title, description: '', trackId: v.trackId && typeof v.trackId === 'object' ? v.trackId._id : v.trackId || '', instructor: v.instructor, videoUrl: v.videoUrl, thumbnail: v.thumbnail || '', duration: v.duration, order: v.order, published: v.published });
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setModalError(null);
        try {
            const token = localStorage.getItem('token');
            const url = editing ? `/api/lms/videos/${editing._id}` : '/api/lms/videos';
            const method = editing ? 'PATCH' : 'POST';

            const payload = { ...formData };
            if (payload.videoUrl) {
                const ytId = extractYouTubeId(payload.videoUrl);
                if (ytId) payload.videoUrl = ytId;
            }
            if (!payload.thumbnail && payload.videoUrl) {
                payload.thumbnail = getYouTubeThumbnail(payload.videoUrl);
            }

            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) { setShowModal(false); fetchAll(); }
            else { setModalError(data.error || 'Failed to save video'); }
        } catch (err: any) { setModalError(err.message || 'Network error'); }
        finally { setSaving(false); }
    };

    const togglePublish = async (v: Video) => {
        const token = localStorage.getItem('token');
        await fetch(`/api/lms/videos/${v._id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ published: !v.published }),
        });
        fetchAll();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this video?')) return;
        const token = localStorage.getItem('token');
        await fetch(`/api/lms/videos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        fetchAll();
    };

    const filtered = videos.filter(v => !filterTrack || (v.trackId && typeof v.trackId === 'object' ? v.trackId._id : v.trackId) === filterTrack);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Video Lectures</h1>
                    <p className="text-gray-400 text-sm mt-1">{videos.length} total videos</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-600/80 text-white rounded-xl font-bold text-sm transition-all">
                    <FiPlus className="w-4 h-4" /> Add Video
                </button>
            </div>

            {/* Filter by track */}
            <div className="flex gap-3 flex-wrap">
                <button onClick={() => setFilterTrack('')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!filterTrack ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                    All Tracks
                </button>
                {tracks.map(t => (
                    <button key={t._id} onClick={() => setFilterTrack(t._id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterTrack === t._id ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                        {t.name}
                    </button>
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Videos', val: videos.length },
                    { label: 'Published', val: videos.filter(v => v.published).length },
                    { label: 'Unpublished', val: videos.filter(v => !v.published).length },
                ].map(s => (
                    <div key={s.label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                        <p className="text-2xl font-extrabold text-white">{s.val}</p>
                        <p className="text-xs text-gray-500 uppercase font-bold mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-[#0B1220] rounded-2xl border border-blue-500/20 overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[700px]">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            {['Video', 'Track', 'Instructor', 'Duration', 'Status', 'Actions'].map(h => (
                                <th key={h} className="text-left px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-12 text-gray-500">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-12 text-gray-500">No videos found</td></tr>
                        ) : (
                            filtered.map(v => (
                                <tr key={v._id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-14 h-9 bg-black/40 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                                {v.thumbnail ? <img src={v.thumbnail} alt="" className="w-full h-full object-cover" /> : <FiYoutube className="text-red-400 w-5 h-5" />}
                                            </div>
                                            <p className="font-bold text-white text-sm line-clamp-2 max-w-[200px]">{v.title}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-400">{v.trackId && typeof v.trackId === 'object' ? v.trackId.name : '-'}</td>
                                    <td className="px-5 py-4 text-sm text-gray-400">{v.instructor}</td>
                                    <td className="px-5 py-4 text-sm text-gray-500">{v.duration || '-'}</td>
                                    <td className="px-5 py-4">
                                        <button onClick={() => togglePublish(v)} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${v.published ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                            {v.published ? <FiEye className="w-3.5 h-3.5" /> : <FiEyeOff className="w-3.5 h-3.5" />}
                                            {v.published ? 'Published' : 'Draft'}
                                        </button>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(v)} className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"><FiEdit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(v._id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"><FiTrash2 className="w-4 h-4" /></button>
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
                                <h2 className="text-xl font-bold text-white">{editing ? 'Edit Video' : 'Add Video'}</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-gray-400"><FiX className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleSave} className="space-y-4">
                                {modalError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
                                        {modalError}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Video Title *', key: 'title', required: true, col: 2, placeholder: 'Introduction to HTML & CSS' },
                                        { label: 'YouTube Video ID or Full URL *', key: 'videoUrl', required: true, col: 2, placeholder: 'e.g. dQw4w9WgXcQ or https://youtube.com/watch?v=...' },
                                        { label: 'Custom Thumbnail URL (Optional - Auto generated if left empty)', key: 'thumbnail', col: 2, placeholder: 'https://img.youtube.com/vi/...' },
                                        { label: 'Instructor', key: 'instructor', col: 1, placeholder: 'Switch Code Instructor' },
                                        { label: 'Duration', key: 'duration', col: 1, placeholder: '45 min' },
                                    ].map(f => (
                                        <div key={f.key} className={`col-span-${f.col}`}>
                                            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">{f.label}</label>
                                            <input
                                                required={f.required}
                                                value={formData[f.key]}
                                                onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                                placeholder={f.placeholder}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30"
                                            />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Track *</label>
                                        <select required value={formData.trackId} onChange={e => setFormData({ ...formData, trackId: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30">
                                            <option value="" className="bg-gray-900">Select Track</option>
                                            {tracks.map(t => <option key={t._id} value={t._id} className="bg-gray-900">{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Order</label>
                                        <input type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: +e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Description</label>
                                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Brief description..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none h-20 resize-none" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Published</label>
                                        <button type="button" onClick={() => setFormData({ ...formData, published: !formData.published })}
                                            className={`w-12 h-6 rounded-full transition-all ${formData.published ? 'bg-green-500' : 'bg-gray-600'} relative`}>
                                            <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.published ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" disabled={saving}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-600/80 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                                    {saving ? 'Saving...' : editing ? 'Update Video' : 'Add Video'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
