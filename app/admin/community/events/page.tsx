'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiCalendar, FiClock, FiMapPin, FiAward, FiTag, FiEye, FiTrash2 } from 'react-icons/fi';
import Link from 'next/link';

interface Committee {
    _id: string;
    name: string;
}

interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    pointsAwarded: number;
    committeeId?: Committee;
    isActive: boolean;
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');
    const [pointsAwarded, setPointsAwarded] = useState(15);
    const [committeeId, setCommitteeId] = useState('');

    async function fetchEvents() {
        try {
            const token = localStorage.getItem('token');
            const [eventsRes, commsRes] = await Promise.all([
                fetch('/api/community/events', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/community/committees')
            ]);

            if (eventsRes.ok) setEvents(await eventsRes.json());
            if (commsRes.ok) setCommittees(await commsRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchEvents();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const payload = {
            title,
            description,
            date: new Date(date).toISOString(),
            location,
            pointsAwarded: Number(pointsAwarded),
            committeeId: committeeId || undefined
        };

        try {
            const res = await fetch('/api/community/events', {
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
                fetchEvents();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create event');
            }
        } catch {
            alert('Network error');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this event?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/community/events/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchEvents();
        } catch (err) {
            console.error(err);
        }
    }

    function resetForm() {
        setTitle('');
        setDescription('');
        setDate('');
        setLocation('');
        setPointsAwarded(15);
        setCommitteeId('');
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Events Board</h1>
                    <p className="text-slate-400 font-medium tracking-wide">Schedule training sessions, seminars, or community meetups.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center btn-primary-blue px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-glow-blue"
                >
                    <FiPlus className="mr-2" /> Schedule Event
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((e, idx) => (
                        <motion.div
                            key={e._id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-card p-6 rounded-3xl flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="flex items-center text-[10px] uppercase text-gold bg-gold/10 border border-gold/30 px-3 py-1.5 rounded-full font-black tracking-widest shadow-lg">
                                        <FiAward className="mr-1.5" /> {e.pointsAwarded} pts
                                    </span>
                                    <button
                                        onClick={() => handleDelete(e._id)}
                                        className="p-2 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <h3 className="text-xl font-black text-white mb-2 group-hover:text-gold transition-colors">{e.title}</h3>
                                <p className="text-slate-400 text-xs line-clamp-3 mb-5 leading-relaxed font-medium">{e.description}</p>

                                <div className="space-y-3 text-xs text-slate-400 pt-5 border-t border-blue-500/20 font-semibold">
                                    <div className="flex items-center">
                                        <FiCalendar className="mr-3 text-blue-500" />
                                        <span>{new Date(e.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FiClock className="mr-3 text-blue-500" />
                                        <span>{new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FiMapPin className="mr-3 text-blue-500" />
                                        <span className="truncate">{e.location}</span>
                                    </div>
                                    {e.committeeId && (
                                        <div className="flex items-center">
                                            <FiTag className="mr-3 text-blue-500" />
                                            <span>{e.committeeId.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6">
                                <Link
                                    href={`/admin/community/events/${e._id}`}
                                    className="w-full flex items-center justify-center p-3.5 bg-slate-900 border border-blue-500/20 hover:border-gold/50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all group-hover:shadow-glow-gold"
                                >
                                    <FiEye className="mr-2" /> Attendance & Scanners
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Schedule Event Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/90 backdrop-blur-xl">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-panel w-full max-w-lg rounded-[2.5rem] p-8 space-y-6 border border-blue-500/30"
                    >
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gold mb-1 block">Events Manager</span>
                            <h2 className="text-2xl font-black text-white tracking-tight">Schedule New Event</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-wider text-slate-300">Event Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Git & GitHub Crash Course"
                                    className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold font-medium text-sm transition-colors"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-wider text-slate-300">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What is this event about?"
                                    className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold resize-none font-medium text-sm transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-300">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold font-medium text-sm transition-colors"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-300">Location / Meet link</label>
                                    <input
                                        type="text"
                                        required
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g. Lab 4"
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold font-medium text-sm transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-300">Performance Points</label>
                                    <input
                                        type="number"
                                        required
                                        value={pointsAwarded}
                                        onChange={(e) => setPointsAwarded(Number(e.target.value))}
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold font-medium text-sm transition-colors"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-300">Organizer (Committee)</label>
                                    <select
                                        value={committeeId}
                                        onChange={(e) => setCommitteeId(e.target.value)}
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold font-medium text-sm transition-colors"
                                    >
                                        <option value="">None / Public Org</option>
                                        {committees.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3.5 bg-slate-900 hover:bg-red-500/10 border border-blue-500/30 hover:border-red-500/30 text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary-blue px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest"
                                >
                                    Save Event
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
