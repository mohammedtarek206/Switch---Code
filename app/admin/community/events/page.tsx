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
                    <h1 className="text-3xl font-bold text-white mb-2">Events Board</h1>
                    <p className="text-gray-400">Schedule training sessions, seminars, or community meetups.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center bg-accent hover:bg-accent-dark text-black px-5 py-3 rounded-xl font-bold transition-all"
                >
                    <FiPlus className="mr-2" /> Schedule Event
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((e, idx) => (
                        <motion.div
                            key={e._id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass p-6 rounded-2xl flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="flex items-center text-xs text-accent bg-accent/15 px-3 py-1 rounded-full font-bold">
                                        <FiAward className="mr-1" /> {e.pointsAwarded} pts
                                    </span>
                                    <button
                                        onClick={() => handleDelete(e._id)}
                                        className="p-1 hover:bg-white/5 rounded text-red-400 hover:text-red-500"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-2">{e.title}</h3>
                                <p className="text-gray-400 text-sm line-clamp-3 mb-4">{e.description}</p>

                                <div className="space-y-2 text-xs text-gray-500 pt-4 border-t border-white/5">
                                    <div className="flex items-center">
                                        <FiCalendar className="mr-2 text-primary" />
                                        <span>{new Date(e.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FiClock className="mr-2 text-primary" />
                                        <span>{new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FiMapPin className="mr-2 text-primary" />
                                        <span className="truncate">{e.location}</span>
                                    </div>
                                    {e.committeeId && (
                                        <div className="flex items-center">
                                            <FiTag className="mr-2 text-primary" />
                                            <span>{e.committeeId.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6">
                                <Link
                                    href={`/admin/community/events/${e._id}`}
                                    className="w-full flex items-center justify-center p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/5"
                                >
                                    <FiEye className="mr-2" /> Attendance & QR Scanners
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Schedule Event Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass w-full max-w-lg rounded-3xl p-8 space-y-6"
                    >
                        <h2 className="text-2xl font-bold text-white mb-2">Schedule New Event</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-300">Event Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Git & GitHub Crash Course"
                                    className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-300">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What is this event about?"
                                    className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-300">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-300">Location / Meet link</label>
                                    <input
                                        type="text"
                                        required
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g. Lab 4 or Google Meet link"
                                        className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-300">Performance Points</label>
                                    <input
                                        type="number"
                                        required
                                        value={pointsAwarded}
                                        onChange={(e) => setPointsAwarded(Number(e.target.value))}
                                        className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-300">Organizer (Committee)</label>
                                    <select
                                        value={committeeId}
                                        onChange={(e) => setCommitteeId(e.target.value)}
                                        className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                                    >
                                        <option value="">None / Public Org</option>
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
                                    className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-accent hover:bg-accent-dark text-black rounded-xl transition-all font-bold"
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
