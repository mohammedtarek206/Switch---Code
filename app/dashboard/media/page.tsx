'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiImage, FiVideo, FiFolder, FiUploadCloud, FiTrash2, FiDownload, FiGrid, FiList } from 'react-icons/fi';
import Link from 'next/link';

interface MediaFile {
    id: string;
    name: string;
    type: 'image' | 'video';
    url: string;
    album: string;
    size: string;
    uploadedAt: string;
}

const MOCK_MEDIA: MediaFile[] = [
    { id: '1', name: 'Hackathon Day 1', type: 'image', url: '', album: 'Hackathon 2026', size: '2.4 MB', uploadedAt: '2026-07-10' },
    { id: '2', name: 'Opening Ceremony', type: 'video', url: '', album: 'Hackathon 2026', size: '58 MB', uploadedAt: '2026-07-10' },
    { id: '3', name: 'Workshop Banner', type: 'image', url: '', album: 'AI Workshop', size: '1.1 MB', uploadedAt: '2026-07-12' },
    { id: '4', name: 'Team Photo', type: 'image', url: '', album: 'General', size: '3.8 MB', uploadedAt: '2026-07-15' },
];

export default function MediaDashboard() {
    const [files, setFiles] = useState<MediaFile[]>(MOCK_MEDIA);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
    const [selectedAlbum, setSelectedAlbum] = useState('all');
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (!['media', 'admin', 'super_admin'].includes(user.role)) {
                window.location.href = '/dashboard';
            }
        }
    }, []);

    const albums = ['all', ...Array.from(new Set(files.map(f => f.album)))];
    const filtered = files.filter(f => {
        const matchType = filterType === 'all' || f.type === filterType;
        const matchAlbum = selectedAlbum === 'all' || f.album === selectedAlbum;
        return matchType && matchAlbum;
    });

    function handleDelete(id: string) {
        setFiles(files.filter(f => f.id !== id));
    }

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
                    onDrop={e => { e.preventDefault(); setDragging(false); /* handle file upload */ }}
                    className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${dragging ? 'border-gold bg-accent/5' : 'border-blue-500/30 hover:border-blue-500/30'
                        }`}
                >
                    <FiUploadCloud className="w-10 h-10 mx-auto text-gray-500 mb-3" />
                    <p className="text-gray-300 font-semibold text-sm">Drag & drop files here, or click to browse</p>
                    <p className="text-gray-500 text-xs mt-1">Supports: JPG, PNG, GIF, MP4, MOV — Max 500MB per file</p>
                    <label className="mt-4 inline-block bg-slate-900 border border-blue-500/20 hover:bg-slate-800 text-white border border-blue-500/30 px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all">
                        Browse Files
                        <input type="file" className="hidden" multiple accept="image/*,video/*" />
                    </label>
                </div>

                {/* Filters & Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Type filter */}
                    <div className="flex bg-slate-900 border border-blue-500/20 border border-blue-500/20 rounded-xl p-1 gap-1">
                        {(['all', 'image', 'video'] as const).map(t => (
                            <button key={t} onClick={() => setFilterType(t)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === t ? 'bg-slate-800 text-white' : 'text-gray-500 hover:text-white'
                                    }`}>
                                {t === 'image' ? <FiImage className="w-3.5 h-3.5" /> : t === 'video' ? <FiVideo className="w-3.5 h-3.5" /> : null}
                                {t === 'all' ? 'All Files' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
                            </button>
                        ))}
                    </div>

                    {/* Album filter */}
                    <select value={selectedAlbum} onChange={e => setSelectedAlbum(e.target.value)}
                        className="bg-[#07111F] border border-blue-500/30 rounded-xl px-4 py-2 text-white text-xs outline-none">
                        {albums.map(a => <option key={a} value={a}>{a === 'all' ? 'All Albums' : a}</option>)}
                    </select>

                    <div className="ml-auto flex gap-1 bg-slate-900 border border-blue-500/20 border border-blue-500/20 rounded-xl p-1">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-gray-500'}`}><FiGrid className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-gray-500'}`}><FiList className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Files display */}
                {viewMode === 'grid' ? (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filtered.map((f, i) => (
                            <motion.div key={f.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                                className="glass-panel border border-blue-500/20 rounded-2xl overflow-hidden group">
                                <div className="aspect-video bg-slate-900 border border-blue-500/20 flex items-center justify-center relative">
                                    {f.type === 'image'
                                        ? <FiImage className="w-10 h-10 text-gray-600" />
                                        : <FiVideo className="w-10 h-10 text-gray-600" />}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                        <button className="p-2 bg-slate-800 rounded-lg text-white"><FiDownload className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(f.id)} className="p-2 bg-red-500/20 rounded-lg text-red-400"><FiTrash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-white text-xs font-bold truncate">{f.name}</p>
                                    <p className="text-gray-500 text-[10px] mt-0.5">{f.album} · {f.size}</p>
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
                                    <th className="p-4">Size</th>
                                    <th className="p-4">Uploaded</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {filtered.map(f => (
                                    <tr key={f.id} className="hover:bg-white/[0.02]">
                                        <td className="p-4 text-white font-medium flex items-center gap-2">
                                            {f.type === 'image' ? <FiImage className="text-pink-400" /> : <FiVideo className="text-blue-400" />}
                                            {f.name}
                                        </td>
                                        <td className="p-4 text-gray-400 text-xs capitalize">{f.type}</td>
                                        <td className="p-4 text-gray-400 text-xs">{f.album}</td>
                                        <td className="p-4 text-gray-500 text-xs">{f.size}</td>
                                        <td className="p-4 text-gray-500 text-xs">{f.uploadedAt}</td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button className="p-1.5 bg-slate-900 border border-blue-500/20 hover:bg-slate-800 rounded-lg text-gray-400"><FiDownload className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleDelete(f.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400"><FiTrash2 className="w-3.5 h-3.5" /></button>
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
