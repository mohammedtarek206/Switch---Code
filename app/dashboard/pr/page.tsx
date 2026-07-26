'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiEdit3, FiImage, FiLink, FiMic, FiBell, FiGlobe, FiPlus, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import Link from 'next/link';

interface Announcement {
    _id: string;
    title: string;
    content: string;
    targetAudience: string;
    createdAt: string;
}

export default function PRDashboard() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [target, setTarget] = useState('all');
    const [tab, setTab] = useState<'announcements' | 'gallery' | 'social'>('announcements');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (!['pr', 'admin', 'super_admin'].includes(user.role)) {
                window.location.href = '/dashboard';
            }
        }
        fetchAnnouncements();
    }, []);

    async function fetchAnnouncements() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/community/announcements', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setAnnouncements(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    async function handleCreate() {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/community/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title, content, targetAudience: target })
        });
        if (res.ok) {
            setShowForm(false); setTitle(''); setContent(''); setTarget('all');
            fetchAnnouncements();
        }
    }

    async function handleDelete(id: string) {
        const token = localStorage.getItem('token');
        await fetch(`/api/community/announcements`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id })
        });
        fetchAnnouncements();
    }

    const tabs = [
        { key: 'announcements', label: 'Announcements', icon: FiBell },
        { key: 'gallery', label: 'Media Gallery', icon: FiImage },
        { key: 'social', label: 'Social Links', icon: FiGlobe },
    ] as const;

    return (
        <div className="min-h-screen bg-[#07111F] text-white py-10 px-4 md:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="inline-flex items-center bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold text-purple-400 mb-2">
                            PR Dashboard
                        </div>
                        <h1 className="text-3xl font-extrabold">Public Relations Hub</h1>
                        <p className="text-gray-400 text-sm mt-1">Manage announcements, media, and social presence.</p>
                    </div>
                    <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white">← Main Dashboard</Link>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Published', val: announcements.length, color: 'text-purple-400' },
                        { label: 'Targeted All', val: announcements.filter(a => a.targetAudience === 'all').length, color: 'text-white' },
                        { label: 'This Week', val: announcements.filter(a => new Date(a.createdAt) > new Date(Date.now() - 7 * 86400000)).length, color: 'text-gold' },
                    ].map(s => (
                        <div key={s.label} className="glass-panel p-4 rounded-2xl text-center border border-blue-500/20">
                            <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">{s.label}</span>
                            <span className={`text-2xl font-extrabold ${s.color}`}>{s.val}</span>
                        </div>
                    ))}
                </div>

                {/* Tab nav */}
                <div className="flex space-x-2 bg-slate-900 border border-blue-500/20 p-1.5 rounded-2xl w-fit border border-blue-500/20">
                    {tabs.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === key ? 'bg-slate-800 text-white shadow' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </div>

                {/* Announcements tab */}
                {tab === 'announcements' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-white">Published Announcements</h3>
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white transition-colors hover:bg-blue-600 hover:bg-blue-500 text-white transition-colors-dark text-black px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                            >
                                <FiPlus /> New Announcement
                            </button>
                        </div>

                        {showForm && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl border border-blue-500/20 space-y-4">
                                <input
                                    value={title} onChange={e => setTitle(e.target.value)}
                                    placeholder="Announcement title"
                                    className="w-full p-3 bg-[#07111F] border border-blue-500/30 rounded-xl text-white text-sm outline-none focus:border-gold"
                                />
                                <textarea
                                    rows={4} value={content} onChange={e => setContent(e.target.value)}
                                    placeholder="Announcement body content..."
                                    className="w-full p-3 bg-[#07111F] border border-blue-500/30 rounded-xl text-white text-sm outline-none focus:border-gold resize-none"
                                />
                                <div className="flex gap-3">
                                    <select value={target} onChange={e => setTarget(e.target.value)} className="bg-[#07111F] border border-blue-500/30 rounded-xl px-4 py-2.5 text-white text-sm outline-none flex-1">
                                        <option value="all">Everyone</option>
                                        <option value="members">Members Only</option>
                                        <option value="leaders">Leaders</option>
                                        <option value="technical">Technical Committee</option>
                                    </select>
                                    <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white transition-colors text-black px-6 py-2.5 rounded-xl font-bold text-sm flex-1">Publish</button>
                                </div>
                            </motion.div>
                        )}

                        {loading ? (
                            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>
                        ) : (
                            <div className="space-y-3">
                                {announcements.map((a, idx) => (
                                    <motion.div key={a._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                                        className="glass-panel p-5 rounded-2xl border border-blue-500/20 flex justify-between items-start gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-white text-sm">{a.title}</h4>
                                                <span className="text-[9px] font-bold uppercase bg-slate-900 border border-blue-500/20 text-gray-400 px-2 py-0.5 rounded-full">{a.targetAudience}</span>
                                            </div>
                                            <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{a.content}</p>
                                            <span className="text-[10px] text-gray-600 mt-2 block">{new Date(a.createdAt).toLocaleString()}</span>
                                        </div>
                                        <button onClick={() => handleDelete(a._id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg"><FiTrash2 className="w-4 h-4" /></button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Gallery tab */}
                {tab === 'gallery' && (
                    <div className="glass-panel p-8 rounded-3xl text-center space-y-4 border border-blue-500/20">
                        <FiUploadCloud className="w-12 h-12 mx-auto text-gray-500" />
                        <h3 className="font-bold text-white">Media Library</h3>
                        <p className="text-gray-500 text-sm">Upload and manage community event photos, banners, and visual assets.</p>
                        <Link href="/admin/community/media" className="inline-block bg-blue-600 hover:bg-blue-500 text-white transition-colors text-black px-6 py-3 rounded-xl font-bold text-sm">Open Media Library</Link>
                    </div>
                )}

                {/* Social Links tab */}
                {tab === 'social' && (
                    <div className="glass-panel p-8 rounded-3xl space-y-4 border border-blue-500/20">
                        <h3 className="font-bold text-white mb-4">Social Media Links Manager</h3>
                        {['LinkedIn', 'Twitter / X', 'Instagram', 'Facebook', 'YouTube', 'Discord'].map(platform => (
                            <div key={platform} className="flex items-center gap-3">
                                <span className="text-gray-400 text-sm font-medium w-32">{platform}</span>
                                <div className="relative flex-1">
                                    <FiLink className="absolute left-3 top-3 text-gray-500" />
                                    <input type="url" placeholder={`https://...`} className="w-full pl-9 pr-4 py-2.5 bg-[#07111F] border border-blue-500/30 rounded-xl text-white text-sm outline-none focus:border-gold" />
                                </div>
                            </div>
                        ))}
                        <button className="bg-blue-600 hover:bg-blue-500 text-white transition-colors text-black px-6 py-3 rounded-xl font-bold text-sm mt-2">Save Social Links</button>
                    </div>
                )}
            </div>
        </div>
    );
}
