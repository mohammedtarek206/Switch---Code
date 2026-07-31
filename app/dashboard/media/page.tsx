'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiImage, FiVideo, FiUploadCloud, FiTrash2, FiDownload, FiGrid, FiList, FiFolder } from 'react-icons/fi';
import Link from 'next/link';

export default function MediaDashboard() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
    const [selectedAlbum, setSelectedAlbum] = useState('all');
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (!['media', 'admin', 'super_admin', 'committee_leader', 'vice_committee_leader'].includes(user.role)) {
                window.location.href = '/dashboard';
            }
        }
        fetchMedia();
    }, []);

    async function fetchMedia() {
        const token = localStorage.getItem('token');
        const timeoutId = setTimeout(() => setLoading(false), 1500);
        try {
            // Fetch projects as media gallery items (the platform's project gallery)
            const res = await fetch('/api/admin/projects', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Transform projects that have images into media-like records
                const mediaItems = (Array.isArray(data) ? data : data.projects || [])
                    .filter((p: any) => p.image || p.imageUrl || p.thumbnail)
                    .map((p: any) => ({
                        id: p._id,
                        name: p.title || p.name,
                        type: 'image',
                        url: p.image || p.imageUrl || p.thumbnail || '',
                        album: p.category || p.committeeId?.name || 'General',
                        size: '—',
                        uploadedAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'
                    }));
                setFiles(mediaItems);
            }
        } catch (err) {
            console.error('Failed to fetch media', err);
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    }

    const albums = ['all', ...Array.from(new Set(files.map((f: any) => f.album)))];
    const filtered = files.filter((f: any) => {
        const matchType = filterType === 'all' || f.type === filterType;
        const matchAlbum = selectedAlbum === 'all' || f.album === selectedAlbum;
        return matchType && matchAlbum;
    });

    return (
        <div className="min-h-screen bg-[#07111F] text-white py-10 px-4 md:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="inline-flex items-center bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full text-xs font-bold text-pink-400 mb-2">
                            Media Dashboard
                        </div>
                        <h1 className="text-3xl font-extrabold">Media Library</h1>
                        <p className="text-gray-400 text-sm mt-1">Manage photos, videos, albums, and event galleries.</p>
                    </div>
                    <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white">← Main Dashboard</Link>
                </div>

                {/* Upload Zone */}
                <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); }}
                    className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${dragging ? 'border-gold bg-amber-500/5' : 'border-blue-500/30 hover:border-blue-500/50'}`}
                >
                    <FiUploadCloud className="w-10 h-10 mx-auto text-gray-500 mb-3" />
                    <p className="text-gray-300 font-semibold text-sm">Drag & drop files here, or click to browse</p>
                    <p className="text-gray-500 text-xs mt-1">Supports: JPG, PNG, GIF, MP4, MOV — Max 500MB per file</p>
                    <label className="mt-4 inline-block bg-slate-900 border border-blue-500/20 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all">
                        Browse Files
                        <input type="file" className="hidden" multiple accept="image/*,video/*" />
                    </label>
                </div>

                {/* Filters & Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-900 border border-blue-500/20 rounded-xl p-1 gap-1">
                        {(['all', 'image', 'video'] as const).map(t => (
                            <button key={t} onClick={() => setFilterType(t)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === t ? 'bg-slate-800 text-white' : 'text-gray-500 hover:text-white'}`}>
                                {t === 'image' ? <FiImage className="w-3.5 h-3.5" /> : t === 'video' ? <FiVideo className="w-3.5 h-3.5" /> : null}
                                {t === 'all' ? 'All Files' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
                            </button>
                        ))}
                    </div>

                    <select value={selectedAlbum} onChange={e => setSelectedAlbum(e.target.value)}
                        className="bg-[#07111F] border border-blue-500/30 rounded-xl px-4 py-2 text-white text-xs outline-none">
                        {albums.map(a => <option key={a} value={a}>{a === 'all' ? 'All Albums' : a}</option>)}
                    </select>

                    <div className="ml-auto flex gap-1 bg-slate-900 border border-blue-500/20 rounded-xl p-1">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-gray-500'}`}><FiGrid className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-gray-500'}`}><FiList className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Files display */}
                {loading ? (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="glass-panel border border-blue-500/20 rounded-2xl overflow-hidden animate-pulse">
                                <div className="aspect-video bg-slate-900" />
                                <div className="p-3 space-y-2">
                                    <div className="h-3 w-24 bg-slate-800 rounded" />
                                    <div className="h-2 w-16 bg-slate-800 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="glass-panel p-16 rounded-3xl border border-blue-500/20 text-center space-y-3">
                        <FiFolder className="w-12 h-12 text-gray-600 mx-auto" />
                        <p className="text-gray-400 font-semibold">No media files found</p>
                        <p className="text-gray-600 text-sm">Upload images or videos using the upload zone above.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filtered.map((f: any, i: number) => (
                            <motion.div key={f.id || i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                                className="glass-panel border border-blue-500/20 rounded-2xl overflow-hidden group">
                                <div className="aspect-video bg-slate-900 border-b border-blue-500/20 flex items-center justify-center relative overflow-hidden">
                                    {f.url ? (
                                        <img src={f.url} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : f.type === 'image' ? (
                                        <FiImage className="w-10 h-10 text-gray-600" />
                                    ) : (
                                        <FiVideo className="w-10 h-10 text-gray-600" />
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                        <a href={f.url} target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-lg text-white"><FiDownload className="w-4 h-4" /></a>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-white text-xs font-bold truncate">{f.name}</p>
                                    <p className="text-gray-500 text-[10px] mt-0.5">{f.album} · {f.uploadedAt}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel rounded-3xl border border-blue-500/20 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="border-b border-blue-500/20">
                                <tr className="text-gray-400 text-[10px] font-bold uppercase">
                                    <th className="p-4">File Name</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Album</th>
                                    <th className="p-4">Uploaded</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {filtered.map((f: any, i: number) => (
                                    <tr key={f.id || i} className="hover:bg-white/[0.02]">
                                        <td className="p-4 text-white font-medium flex items-center gap-2">
                                            {f.type === 'image' ? <FiImage className="text-pink-400" /> : <FiVideo className="text-blue-400" />}
                                            {f.name}
                                        </td>
                                        <td className="p-4 text-gray-400 text-xs capitalize">{f.type}</td>
                                        <td className="p-4 text-gray-400 text-xs">{f.album}</td>
                                        <td className="p-4 text-gray-500 text-xs">{f.uploadedAt}</td>
                                        <td className="p-4 text-right">
                                            {f.url && (
                                                <a href={f.url} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-900 border border-blue-500/20 hover:bg-slate-800 rounded-lg text-gray-400 inline-flex">
                                                    <FiDownload className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
