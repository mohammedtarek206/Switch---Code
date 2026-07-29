'use client';

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiCalendar, FiClock, FiMapPin, FiAward, FiTag, FiEye, FiTrash2, FiSearch } from 'react-icons/fi';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────
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

// ─── Skeleton Card ──────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="glass-card p-6 rounded-3xl flex flex-col gap-4 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="h-6 w-20 bg-slate-700/60 rounded-full" />
                <div className="h-8 w-8 bg-slate-700/60 rounded-xl" />
            </div>
            <div className="h-5 w-3/4 bg-slate-700/60 rounded-lg" />
            <div className="space-y-2">
                <div className="h-3 w-full bg-slate-700/40 rounded" />
                <div className="h-3 w-5/6 bg-slate-700/40 rounded" />
            </div>
            <div className="pt-4 border-t border-blue-500/10 space-y-3">
                <div className="h-3 w-2/3 bg-slate-700/40 rounded" />
                <div className="h-3 w-1/2 bg-slate-700/40 rounded" />
                <div className="h-3 w-2/3 bg-slate-700/40 rounded" />
            </div>
            <div className="h-11 w-full bg-slate-700/40 rounded-xl mt-2" />
        </div>
    );
}

// ─── Event Card (memoized to prevent unnecessary re-renders) ─────────────────
const EventCard = memo(function EventCard({
    event,
    onDelete,
    idx,
}: {
    event: Event;
    onDelete: (id: string) => void;
    idx: number;
}) {
    return (
        <motion.div
            key={event._id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.04, duration: 0.25 }}
            className="glass-card p-6 rounded-3xl flex flex-col justify-between group"
        >
            <div>
                <div className="flex justify-between items-center mb-4">
                    <span className="flex items-center text-[10px] uppercase text-gold bg-gold/10 border border-gold/30 px-3 py-1.5 rounded-full font-black tracking-widest shadow-lg">
                        <FiAward className="mr-1.5" /> {event.pointsAwarded} pts
                    </span>
                    <button
                        onClick={() => onDelete(event._id)}
                        className="p-2 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all"
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </button>
                </div>

                <h3 className="text-xl font-black text-white mb-2 group-hover:text-gold transition-colors">
                    {event.title}
                </h3>
                <p className="text-slate-400 text-xs line-clamp-3 mb-5 leading-relaxed font-medium">
                    {event.description}
                </p>

                <div className="space-y-3 text-xs text-slate-400 pt-5 border-t border-blue-500/20 font-semibold">
                    <div className="flex items-center">
                        <FiCalendar className="mr-3 text-blue-500" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                        <FiClock className="mr-3 text-blue-500" />
                        <span>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center">
                        <FiMapPin className="mr-3 text-blue-500" />
                        <span className="truncate">{event.location}</span>
                    </div>
                    {event.committeeId && (
                        <div className="flex items-center">
                            <FiTag className="mr-3 text-blue-500" />
                            <span>{event.committeeId.name}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <Link
                    href={`/admin/community/events/${event._id}`}
                    className="w-full flex items-center justify-center p-3.5 bg-slate-900 border border-blue-500/20 hover:border-gold/50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all group-hover:shadow-glow-gold"
                >
                    <FiEye className="mr-2" /> Attendance &amp; Scanners
                </Link>
            </div>
        </motion.div>
    );
});

// ─── Page ───────────────────────────────────────────────────────────────────
export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');
    const [pointsAwarded, setPointsAwarded] = useState(15);
    const [committeeId, setCommitteeId] = useState('');

    // AbortController ref to cancel in-flight requests on unmount
    const abortRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async () => {
        // Cancel any previous request
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const signal = abortRef.current.signal;

        setLoading(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Parallel fetch — events + committees at the same time
            const [eventsRes, commsRes] = await Promise.all([
                fetch('/api/community/events', { headers, signal }),
                fetch('/api/community/committees', { signal }),
            ]);

            if (!signal.aborted) {
                if (eventsRes.ok) setEvents(await eventsRes.json());
                if (commsRes.ok) setCommittees(await commsRes.json());
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') console.error('Events fetch error:', err);
        } finally {
            if (!abortRef.current?.signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        return () => abortRef.current?.abort();  // cleanup on unmount
    }, [fetchData]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const token = localStorage.getItem('token');
        const payload = {
            title, description,
            date: new Date(date).toISOString(),
            location,
            pointsAwarded: Number(pointsAwarded),
            committeeId: committeeId || undefined,
        };

        try {
            const res = await fetch('/api/community/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const newEvent: Event = await res.json();
                // Optimistic insert → no full re-fetch needed
                setEvents(prev => [newEvent, ...prev]);
                setShowModal(false);
                resetForm();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create event');
            }
        } catch {
            alert('Network error');
        } finally {
            setSubmitting(false);
        }
    }, [title, description, date, location, pointsAwarded, committeeId]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        const token = localStorage.getItem('token');

        // Optimistic remove
        setEvents(prev => prev.filter(e => e._id !== id));

        try {
            const res = await fetch(`/api/community/events/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                // Revert if API failed
                fetchData();
            }
        } catch {
            fetchData();
        }
    }, [fetchData]);

    function resetForm() {
        setTitle(''); setDescription(''); setDate('');
        setLocation(''); setPointsAwarded(15); setCommitteeId('');
    }

    // Client-side instant search filter
    const filteredEvents = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return events;
        return events.filter(e =>
            e.title.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            e.location?.toLowerCase().includes(q) ||
            e.committeeId?.name.toLowerCase().includes(q)
        );
    }, [events, search]);

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Events Board</h1>
                    <p className="text-slate-400 font-medium tracking-wide">
                        Schedule training sessions, seminars, or community meetups.
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center btn-primary-blue px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-glow-blue"
                >
                    <FiPlus className="mr-2" /> Schedule Event
                </button>
            </div>

            {/* Search bar */}
            <div className="relative max-w-sm">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search events…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold text-sm transition-colors"
                />
            </div>

            {/* Skeleton or grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[30vh] text-slate-500 gap-3">
                    <FiCalendar className="w-12 h-12 opacity-30" />
                    <p className="font-semibold text-sm">{search ? 'No events match your search.' : 'No events yet. Schedule your first one!'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredEvents.map((e, idx) => (
                            <EventCard key={e._id} event={e} onDelete={handleDelete} idx={idx} />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Create Event Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/90 backdrop-blur-xl"
                        onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
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
                                        type="text" required value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g. Git & GitHub Crash Course"
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold font-medium text-sm transition-colors"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-300">Description</label>
                                    <textarea
                                        required rows={3} value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="What is this event about?"
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold resize-none font-medium text-sm transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-300">Date &amp; Time</label>
                                        <input
                                            type="datetime-local" required value={date}
                                            onChange={e => setDate(e.target.value)}
                                            className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold font-medium text-sm transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-300">Location / Meet link</label>
                                        <input
                                            type="text" required value={location}
                                            onChange={e => setLocation(e.target.value)}
                                            placeholder="e.g. Lab 4"
                                            className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold font-medium text-sm transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-300">Performance Points</label>
                                        <input
                                            type="number" required value={pointsAwarded}
                                            onChange={e => setPointsAwarded(Number(e.target.value))}
                                            className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold font-medium text-sm transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-300">Organizer (Committee)</label>
                                        <select
                                            value={committeeId}
                                            onChange={e => setCommitteeId(e.target.value)}
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
                                        disabled={submitting}
                                        className="btn-primary-blue px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Saving…' : 'Save Event'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
