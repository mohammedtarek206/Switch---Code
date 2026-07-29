'use client';

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiCalendar, FiClock, FiMapPin, FiAward, FiTag, FiEye, FiTrash2, FiSearch, FiEdit2, FiX, FiCheck, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Committee {
    _id: string;
    name: string;
}

interface EventQuestion {
    _id?: string;
    question: string;
    description?: string;
    placeholder?: string;
    type: 'text' | 'multiple_choice' | 'checkbox' | 'dropdown' | 'yes_no' | 'number' | 'email' | 'phone' | 'date';
    options: string[];
    required: boolean;
    order: number;
    active: boolean;
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

// ─── Event Card (memoized) ───────────────────────────────────────────────────
const EventCard = memo(function EventCard({
    event,
    onEdit,
    onDelete,
    idx,
}: {
    event: Event;
    onEdit: (event: Event) => void;
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
                    <div className="flex space-x-2">
                        <button
                            onClick={() => onEdit(event)}
                            className="p-2 hover:bg-blue-500/10 rounded-xl text-slate-400 hover:text-blue-400 border border-transparent hover:border-blue-500/30 transition-all"
                        >
                            <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(event._id)}
                            className="p-2 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all"
                        >
                            <FiTrash2 className="w-4 h-4" />
                        </button>
                    </div>
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

            <div className="mt-6 flex gap-2">
                <Link
                    href={`/admin/community/events/${event._id}`}
                    className="flex-1 flex items-center justify-center p-3.5 bg-slate-900 border border-blue-500/20 hover:border-gold/50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group-hover:shadow-glow-gold"
                >
                    <FiEye className="mr-2 text-lg" /> Dashboard &amp; Apps
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
    const [search, setSearch] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [editId, setEditId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');
    const [pointsAwarded, setPointsAwarded] = useState(15);
    const [committeeId, setCommitteeId] = useState('');

    // Questions state
    const [questions, setQuestions] = useState<EventQuestion[]>([]);
    const [qLoading, setQLoading] = useState(false);

    const abortRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async () => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const signal = abortRef.current.signal;

        setLoading(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

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
        return () => abortRef.current?.abort();
    }, [fetchData]);

    const handleEditClick = async (ev: Event) => {
        setEditId(ev._id);
        setTitle(ev.title || '');
        setDescription(ev.description || '');
        setDate(ev.date ? new Date(ev.date).toISOString().slice(0, 16) : '');
        setLocation(ev.location || '');
        setPointsAwarded(ev.pointsAwarded || 0);
        setCommitteeId(ev.committeeId?._id || '');
        setShowModal(true);

        // Fetch questions
        try {
            setQLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/events/${ev._id}/questions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setQuestions(await res.json());
            } else {
                setQuestions([]);
            }
        } catch {
            setQuestions([]);
        } finally {
            setQLoading(false);
        }
    };

    const handleAddNewClick = () => {
        setEditId(null);
        resetForm();
        setShowModal(true);
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { question: '', description: '', placeholder: '', type: 'text', options: ['Option 1'], required: true, order: questions.length, active: true }
        ]);
    };

    const updateQuestion = (idx: number, field: string, value: any) => {
        setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
    };

    const deleteQuestion = (idx: number) => {
        setQuestions(prev => prev.filter((_, i) => i !== idx));
    };

    const swapQuestions = (idx: number, dir: 1 | -1) => {
        if (idx + dir < 0 || idx + dir >= questions.length) return;
        const newQs = [...questions];
        const temp = newQs[idx];
        newQs[idx] = newQs[idx + dir];
        newQs[idx + dir] = temp;
        setQuestions(newQs.map((q, i) => ({ ...q, order: i })));
    };

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
            questions: questions.map((q, i) => ({ ...q, order: i }))
        };

        const method = editId ? 'PUT' : 'POST';
        const url = editId ? `/api/community/events/${editId}` : '/api/community/events';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const updatedEvent: Event = await res.json();
                if (editId) {
                    setEvents(prev => prev.map(ev => ev._id === editId ? updatedEvent : ev));
                } else {
                    setEvents(prev => [updatedEvent, ...prev]);
                }
                setShowModal(false);
                resetForm();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save event');
            }
        } catch {
            alert('Network error');
        } finally {
            setSubmitting(false);
        }
    }, [editId, title, description, date, location, pointsAwarded, committeeId, questions]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        const token = localStorage.getItem('token');

        setEvents(prev => prev.filter(e => e._id !== id));
        try {
            const res = await fetch(`/api/community/events/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) fetchData();
        } catch {
            fetchData();
        }
    }, [fetchData]);

    function resetForm() {
        setTitle(''); setDescription(''); setDate('');
        setLocation(''); setPointsAwarded(15); setCommitteeId('');
        setQuestions([]);
    }

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Events Planner</h1>
                    <p className="text-slate-400 font-medium mt-1">Manage events, track attendance, and assign performance points.</p>
                </div>
                <div className="flex items-center bg-slate-900 border border-blue-500/30 rounded-2xl p-1 overflow-hidden">
                    <button
                        onClick={handleAddNewClick}
                        className="btn-primary-blue px-6 py-2.5 rounded-xl text-sm font-black tracking-widest uppercase transition-all shadow-glow-blue flex items-center"
                    >
                        <FiPlus className="mr-2" /> Schedule Event
                    </button>
                    <div className="relative ml-2 mr-2">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Find events..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-white pl-9 w-40 placeholder:text-slate-600 focus:w-60 transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                    ) : filteredEvents.length === 0 ? (
                        <div key="empty" className="col-span-full py-20 text-center">
                            <span className="text-4xl block mb-4">🏆</span>
                            <h3 className="text-xl font-bold text-slate-300">No events found</h3>
                            <p className="text-slate-500">You haven't scheduled any events yet or the search returned no results.</p>
                        </div>
                    ) : (
                        filteredEvents.map((event, idx) => (
                            <EventCard
                                key={event._id}
                                event={event}
                                onEdit={handleEditClick}
                                onDelete={handleDelete}
                                idx={idx}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/90 backdrop-blur-xl overflow-y-auto"
                        onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 space-y-6 border border-blue-500/30 custom-scrollbar-thin"
                        >
                            <div className="flex justify-between items-center pb-4 border-b border-blue-500/20">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gold mb-1 block">Events Manager</span>
                                    <h2 className="text-2xl font-black text-white tracking-tight">{editId ? 'Edit Event' : 'Schedule New Event'}</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 hover:text-white transition-colors">
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Left Column: Event details */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-blue-400 border-b border-blue-500/20 pb-2">Event Details</h3>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-300">Event Title *</label>
                                            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Git & GitHub Crash Course" className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold font-medium text-sm transition-colors" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-300">Description *</label>
                                            <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this event about?" className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold resize-none font-medium text-sm transition-colors" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black uppercase tracking-wider text-slate-300">Date &amp; Time *</label>
                                                <input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold font-medium text-sm transition-colors" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black uppercase tracking-wider text-slate-300">Location *</label>
                                                <input type="text" required value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Lab 4" className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold font-medium text-sm transition-colors" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black uppercase tracking-wider text-slate-300">Points Awarded</label>
                                                <input type="number" required value={pointsAwarded} onChange={e => setPointsAwarded(Number(e.target.value))} className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold font-medium text-sm transition-colors" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black uppercase tracking-wider text-slate-300">Organizer (Committee)</label>
                                                <select value={committeeId} onChange={e => setCommitteeId(e.target.value)} className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold font-medium text-sm transition-colors">
                                                    <option value="">None / Public Org</option>
                                                    {committees.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Registration Questions */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b border-blue-500/20 pb-2">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-pink-400">Event Registration Questions</h3>
                                            <button type="button" onClick={addQuestion} className="bg-pink-500/20 text-pink-400 hover:bg-pink-500 max-h-8 hover:text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center">
                                                <FiPlus className="mr-1" /> Add Question
                                            </button>
                                        </div>

                                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar-thin">
                                            {qLoading ? (
                                                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div></div>
                                            ) : questions.length === 0 ? (
                                                <p className="text-xs text-slate-500 text-center py-10">No custom questions added yet.<br />Default fields (Name, Email, Phone, Uni, Faculty) are always included.</p>
                                            ) : questions.map((q, qIdx) => (
                                                <div key={qIdx} className="bg-slate-900/50 border border-blue-500/20 p-4 rounded-2xl relative group">
                                                    <div className="flex mb-3 gap-2 mt-1">
                                                        <div className="flex flex-col gap-1 pr-2 border-r border-blue-500/20">
                                                            <button type="button" onClick={() => swapQuestions(qIdx, -1)} disabled={qIdx === 0} className="text-slate-500 hover:text-white disabled:opacity-30"><FiArrowUp className="w-3 h-3" /></button>
                                                            <button type="button" onClick={() => swapQuestions(qIdx, 1)} disabled={qIdx === questions.length - 1} className="text-slate-500 hover:text-white disabled:opacity-30"><FiArrowDown className="w-3 h-3" /></button>
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            <input type="text" value={q.question} onChange={e => updateQuestion(qIdx, 'question', e.target.value)} placeholder="Question Title (e.g. Current OS?)" required className="w-full bg-transparent border-b border-blue-500/30 text-white outline-none focus:border-gold text-sm font-bold pb-1" />
                                                            <input type="text" value={q.description || ''} onChange={e => updateQuestion(qIdx, 'description', e.target.value)} placeholder="Description (Optional)" className="w-full bg-transparent border-b border-blue-500/20 text-slate-400 outline-none focus:border-gold text-xs pb-1" />
                                                        </div>
                                                        <button type="button" onClick={() => deleteQuestion(qIdx)} className="text-slate-500 hover:text-red-400 p-1 self-start"><FiTrash2 className="w-4 h-4 cursor-pointer" /></button>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mb-3 pl-6">
                                                        <select value={q.type} onChange={e => updateQuestion(qIdx, 'type', e.target.value)} className="bg-slate-900 border border-blue-500/30 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-gold">
                                                            <option value="text">Text (Paragraph)</option>
                                                            <option value="multiple_choice">Multiple Choice (Radio)</option>
                                                            <option value="checkbox">Checkbox (Multiple Answers)</option>
                                                            <option value="dropdown">Dropdown List</option>
                                                            <option value="yes_no">Yes / No</option>
                                                            <option value="number">Number</option>
                                                            <option value="email">Email</option>
                                                            <option value="phone">Phone</option>
                                                            <option value="date">Date picker</option>
                                                        </select>

                                                        {['text', 'number', 'email', 'phone'].includes(q.type) && (
                                                            <input type="text" value={q.placeholder || ''} onChange={e => updateQuestion(qIdx, 'placeholder', e.target.value)} placeholder="Input Placeholder..." className="bg-slate-900 border border-blue-500/30 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-gold" />
                                                        )}
                                                    </div>

                                                    {['multiple_choice', 'checkbox', 'dropdown'].includes(q.type) && (
                                                        <div className="pl-6 space-y-2 mb-3">
                                                            {q.options.map((opt, optIdx) => (
                                                                <div key={optIdx} className="flex items-center gap-2">
                                                                    <div className={`w-3 h-3 border border-slate-500 shrink-0 ${q.type === 'multiple_choice' ? 'rounded-full' : 'rounded-sm'}`} />
                                                                    <input type="text" required value={opt} onChange={e => {
                                                                        const newOpts = [...q.options];
                                                                        newOpts[optIdx] = e.target.value;
                                                                        updateQuestion(qIdx, 'options', newOpts);
                                                                    }} className="flex-1 bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-gold" />
                                                                    <button type="button" onClick={() => {
                                                                        const newOpts = q.options.filter((_, i) => i !== optIdx);
                                                                        updateQuestion(qIdx, 'options', newOpts);
                                                                    }} disabled={q.options.length <= 1} className="text-slate-500 hover:text-red-400 disabled:opacity-30"><FiX className="w-3 h-3" /></button>
                                                                </div>
                                                            ))}
                                                            <button type="button" onClick={() => {
                                                                updateQuestion(qIdx, 'options', [...q.options, `Option ${q.options.length + 1}`]);
                                                            }} className="text-[10px] text-blue-400 font-black uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-md hover:bg-blue-500/20">
                                                                + Add Option
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4 border-t border-blue-500/10 pt-3 pl-6">
                                                        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                                            <input type="checkbox" checked={q.required} onChange={e => updateQuestion(qIdx, 'required', e.target.checked)} className="accent-gold w-3.5 h-3.5" />
                                                            Required
                                                        </label>
                                                        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                                            <input type="checkbox" checked={q.active} onChange={e => updateQuestion(qIdx, 'active', e.target.checked)} className="accent-green-500 w-3.5 h-3.5" />
                                                            Active
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 pt-6 border-t border-blue-500/20">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-blue-500/30 text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn-primary-blue px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving…' : (editId ? 'Update Event & Questions' : 'Create Event')}
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
