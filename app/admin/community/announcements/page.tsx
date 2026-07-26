'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiAlertCircle, FiTrash2, FiTag, FiClock, FiUser } from 'react-icons/fi';

interface Committee {
    _id: string;
    name: string;
}

interface Announcement {
    _id: string;
    title: string;
    content: string;
    tag: string;
    targetCommitteeId?: Committee;
    authorId: {
        name: string;
    };
    createdAt: string;
}

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form States
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tag, setTag] = useState('general');
    const [targetCommitteeId, setTargetCommitteeId] = useState('');

    async function fetchAnnouncements() {
        try {
            const token = localStorage.getItem('token');
            const [annRes, comRes] = await Promise.all([
                fetch('/api/community/announcements', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/community/committees')
            ]);

            if (annRes.ok) setAnnouncements(await annRes.json());
            if (comRes.ok) setCommittees(await comRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const payload = {
            title,
            content,
            tag,
            targetCommitteeId: targetCommitteeId || undefined
        };

        try {
            const res = await fetch('/api/community/announcements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowModal(false);
                resetForm();
                fetchAnnouncements();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to submit announcement');
            }
        } catch {
            alert('Error');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/community/announcements', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id })
            });
            if (res.ok) fetchAnnouncements();
        } catch (err) {
            console.error(err);
        }
    }

    function resetForm() {
        setTitle('');
        setContent('');
        setTag('general');
        setTargetCommitteeId('');
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Announcements Hub</h1>
                    <p className="text-gray-400">Post global broadcasts, updates, or committee-specific notices.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center btn-primary-blue px-5 py-3 rounded-xl font-bold"
                >
                    <FiPlus className="mr-2" /> Write Announcement
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
                </div>
            ) : announcements.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl">
                    <FiAlertCircle className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                    <p className="text-gray-400">No announcements posted yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {announcements.map((a, idx) => (
                        <motion.div
                            key={a._id}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-panel p-6 rounded-2xl border border-blue-500/20 relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                        {a.tag}
                                    </span>
                                    {a.targetCommitteeId && (
                                        <span className="bg-gold/20 text-gold px-2.5 py-0.5 rounded-full text-xs font-bold">
                                            {a.targetCommitteeId.name}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(a._id)}
                                    className="p-1 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{a.title}</h3>
                            <p className="text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap">{a.content}</p>

                            <div className="flex items-center space-x-6 text-xs text-gray-500 border-t border-blue-500/20 pt-4">
                                <span className="flex items-center">
                                    <FiUser className="mr-1.5" /> Post By: {a.authorId?.name || 'Admin'}
                                </span>
                                <span className="flex items-center">
                                    <FiClock className="mr-1.5" /> {new Date(a.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Broadcast Announcement Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-panel w-full max-w-lg rounded-3xl p-8 space-y-6"
                    >
                        <h2 className="text-2xl font-bold text-white mb-2">Publish Announcement</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-300">Topic Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Schedule for Mid-term Evaluation meetings"
                                    className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-300">Bulletin Content</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Write clear announcements..."
                                    className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold resize-none text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-300">Section Tag</label>
                                    <select
                                        value={tag}
                                        onChange={(e) => setTag(e.target.value)}
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold text-sm"
                                    >
                                        <option value="general">General</option>
                                        <option value="important">Important bulletin</option>
                                        <option value="event">Event broadcast</option>
                                        <option value="meeting">Team Meeting</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-300">Target Committee</label>
                                    <select
                                        value={targetCommitteeId}
                                        onChange={(e) => setTargetCommitteeId(e.target.value)}
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold text-sm"
                                    >
                                        <option value="">Public / All Committees</option>
                                        {committees.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
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
                                    Broadcast Notice
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
