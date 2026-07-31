'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch, FiFilter, FiDownload, FiEye, FiCheckCircle, FiXCircle,
    FiClock, FiUser, FiCalendar, FiMapPin, FiExternalLink, FiFileText,
    FiX, FiSave, FiLayers, FiPrinter, FiBriefcase, FiAward, FiGlobe
} from 'react-icons/fi';

interface Application {
    _id: string;
    eventId: {
        _id: string;
        title: string;
        date: string;
        location?: string;
    };
    userId?: string;
    name: string;
    email: string;
    phone?: string;
    university?: string;
    faculty?: string;
    academicYear?: string;
    department?: string;
    governorate?: string;
    gender?: string;
    age?: number | string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    cv?: string;
    status: 'registered' | 'accepted' | 'rejected' | 'waitlist' | 'pending';
    adminNotes?: string;
    answers?: Array<{
        questionId: string;
        question: string;
        type: string;
        answer: any;
    }>;
    createdAt: string;
    updatedAt: string;
}

export default function AdminEventApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        today: 0
    });
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        pages: 1
    });

    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [selectedEvent, setSelectedEvent] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [university, setUniversity] = useState('');
    const [governorate, setGovernorate] = useState('');

    // Detail Modal State
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [modalAdminNotes, setModalAdminNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const fetchApplications = useCallback(async (pageNum = 1) => {
        setLoading(true);
        const token = localStorage.getItem('token');

        const timeoutTimer = setTimeout(() => {
            setLoading(false);
        }, 1500);

        try {
            const query = new URLSearchParams();
            query.append('page', pageNum.toString());
            query.append('limit', '20');
            if (search) query.append('search', search);
            if (selectedEvent) query.append('eventId', selectedEvent);
            if (selectedStatus) query.append('status', selectedStatus);
            if (university) query.append('university', university);
            if (governorate) query.append('governorate', governorate);

            const res = await fetch(`/api/admin/events/applications?${query.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setApplications(data.applications || []);
                setStats(data.stats || { total: 0, pending: 0, accepted: 0, rejected: 0, today: 0 });
                setPagination(data.pagination || { total: 0, page: 1, limit: 20, pages: 1 });
                setEvents(data.events || []);
            }
        } catch (err) {
            console.error('Failed to load event applications', err);
        } finally {
            clearTimeout(timeoutTimer);
            setLoading(false);
        }
    }, [search, selectedEvent, selectedStatus, university, governorate]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchApplications(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchApplications]);

    async function handleStatusChange(appId: string, newStatus: string) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/events/applications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ registrationId: appId, status: newStatus })
            });

            if (res.ok) {
                if (selectedApp && selectedApp._id === appId) {
                    setSelectedApp(prev => prev ? { ...prev, status: newStatus as any } : null);
                }
                fetchApplications(pagination.page);
            }
        } catch (err) {
            console.error('Failed to update status', err);
        }
    }

    async function handleSaveAdminNotes() {
        if (!selectedApp) return;
        setSavingNotes(true);
        setSaveMessage('');
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/events/applications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    registrationId: selectedApp._id,
                    adminNotes: modalAdminNotes
                })
            });

            if (res.ok) {
                setSaveMessage('Admin notes saved!');
                setSelectedApp(prev => prev ? { ...prev, adminNotes: modalAdminNotes } : null);
                fetchApplications(pagination.page);
                setTimeout(() => setSaveMessage(''), 3000);
            }
        } catch (err) {
            console.error('Failed to save notes', err);
        } finally {
            setSavingNotes(false);
        }
    }

    function exportToCSV() {
        if (!applications.length) return;

        // Dynamic questions extraction
        const questionTitles = new Set<string>();
        applications.forEach(a => {
            if (a.answers) {
                a.answers.forEach(q => questionTitles.add(q.question));
            }
        });
        const dynamicQuestions = Array.from(questionTitles);

        const headers = [
            'Applicant Name', 'Email', 'Phone', 'Event Title', 'Status',
            'University', 'Faculty', 'Academic Year', 'Department', 'Governorate',
            'Gender', 'Age', 'LinkedIn', 'GitHub / Portfolio', 'CV', 'Applied Date', 'Admin Notes',
            ...dynamicQuestions
        ];

        const rows = applications.map(a => {
            const baseRow = [
                `"${a.name}"`,
                `"${a.email}"`,
                `"${a.phone || ''}"`,
                `"${a.eventId?.title || ''}"`,
                `"${a.status}"`,
                `"${a.university || ''}"`,
                `"${a.faculty || ''}"`,
                `"${a.academicYear || ''}"`,
                `"${a.department || ''}"`,
                `"${a.governorate || ''}"`,
                `"${a.gender || ''}"`,
                `"${a.age || ''}"`,
                `"${a.linkedin || ''}"`,
                `"${a.github || a.portfolio || ''}"`,
                `"${a.cv || ''}"`,
                `"${new Date(a.createdAt).toLocaleString()}"`,
                `"${(a.adminNotes || '').replace(/"/g, '""')}"`
            ];

            dynamicQuestions.forEach(qTitle => {
                const qAns = (a.answers || []).find(ans => ans.question === qTitle);
                if (qAns) {
                    const strVal = Array.isArray(qAns.answer) ? qAns.answer.join(', ') : String(qAns.answer);
                    baseRow.push(`"${strVal.replace(/"/g, '""')}"`);
                } else {
                    baseRow.push('""');
                }
            });

            return baseRow;
        });

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Event_Applications_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function printPDF() {
        window.print();
    }

    return (
        <div className="space-y-8 pb-24 max-w-7xl mx-auto p-4 md:p-8 text-white">
            {/* Header */}
            <div className="glass-panel p-8 rounded-3xl border border-blue-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-gold/10 border border-gold/20 px-3 py-1 rounded-full mb-2 inline-block">
                        Events CMS Portal
                    </span>
                    <h1 className="text-3xl font-black">Event Applications Manager</h1>
                    <p className="text-gray-400 text-sm mt-1">Review, manage, and process all event attendee submissions in real-time.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-5 py-3 rounded-2xl transition-all shadow-lg text-sm"
                    >
                        <FiDownload /> Export Excel (CSV)
                    </button>
                    <button
                        onClick={printPDF}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-blue-500/30 font-bold px-4 py-3 rounded-2xl transition-all text-sm"
                    >
                        <FiPrinter /> Print / PDF
                    </button>
                </div>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="glass-panel p-6 rounded-2xl border border-blue-500/20">
                    <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Total Applications</span>
                    <p className="text-3xl font-black text-white">{stats.total}</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
                    <span className="text-xs font-bold text-yellow-400 uppercase block mb-1">Pending Review</span>
                    <p className="text-3xl font-black text-yellow-300">{stats.pending}</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-green-500/20 bg-green-500/5">
                    <span className="text-xs font-bold text-green-400 uppercase block mb-1">Accepted</span>
                    <p className="text-3xl font-black text-green-300">{stats.accepted}</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
                    <span className="text-xs font-bold text-red-400 uppercase block mb-1">Rejected</span>
                    <p className="text-3xl font-black text-red-300">{stats.rejected}</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-gold/20 bg-gold/5 col-span-2 md:col-span-1">
                    <span className="text-xs font-bold text-gold uppercase block mb-1">Today's New</span>
                    <p className="text-3xl font-black text-gold">{stats.today}</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="glass-panel p-6 rounded-3xl border border-blue-500/20 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-gold">
                    <FiFilter /> Search & Criteria Filters
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-4 top-3.5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search name, email, phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-blue-500/20 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold"
                        />
                    </div>

                    {/* Event Filter */}
                    <div>
                        <select
                            value={selectedEvent}
                            onChange={(e) => setSelectedEvent(e.target.value)}
                            className="w-full bg-slate-900 border border-blue-500/20 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold"
                        >
                            <option value="">All Events</option>
                            {events.map((ev) => (
                                <option key={ev._id} value={ev._id}>{ev.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full bg-slate-900 border border-blue-500/20 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="registered">Registered</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="waitlist">Waitlist</option>
                        </select>
                    </div>

                    {/* University Filter */}
                    <div>
                        <input
                            type="text"
                            placeholder="Filter by University..."
                            value={university}
                            onChange={(e) => setUniversity(e.target.value)}
                            className="w-full bg-slate-900 border border-blue-500/20 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold"
                        />
                    </div>

                    {/* Governorate Filter */}
                    <div>
                        <input
                            type="text"
                            placeholder="Filter by Governorate..."
                            value={governorate}
                            onChange={(e) => setGovernorate(e.target.value)}
                            className="w-full bg-slate-900 border border-blue-500/20 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold"
                        />
                    </div>
                </div>
            </div>

            {/* Applications Data Table */}
            {loading ? (
                <div className="glass-panel p-12 rounded-3xl space-y-4">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className="h-14 bg-slate-900/60 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : applications.length === 0 ? (
                <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
                    <FiLayers className="w-12 h-12 text-gray-500 mx-auto" />
                    <h3 className="text-lg font-bold text-gray-300">No event applications found</h3>
                    <p className="text-xs text-gray-500">Try refining your search terms or filter selections.</p>
                </div>
            ) : (
                <div className="glass-panel rounded-3xl overflow-hidden border border-blue-500/20">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-blue-500/20 text-gray-400 text-xs font-bold uppercase bg-slate-900/40">
                                    <th className="p-5">Applicant</th>
                                    <th className="p-5">Event</th>
                                    <th className="p-5">University / Faculty</th>
                                    <th className="p-5">Applied Date</th>
                                    <th className="p-5">Status</th>
                                    <th className="p-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                                {applications.map((app) => (
                                    <tr key={app._id} className="hover:bg-slate-900/60 transition-colors">
                                        <td className="p-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400">
                                                    {app.name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <span className="text-white font-bold block">{app.name}</span>
                                                    <span className="text-gray-400 text-xs">{app.email} • {app.phone || 'No phone'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="text-white font-semibold block">{app.eventId?.title || 'Unknown Event'}</span>
                                            {app.eventId?.date && (
                                                <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                    <FiCalendar /> {new Date(app.eventId.date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            <span className="text-white font-medium block">{app.university || 'N/A'}</span>
                                            <span className="text-xs text-gray-400">{app.faculty || 'N/A'}</span>
                                        </td>
                                        <td className="p-5">
                                            <span className="text-gray-300 flex items-center gap-1 text-xs font-medium">
                                                <FiClock className="text-gray-500" />
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${app.status === 'accepted' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                app.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                    app.status === 'waitlist' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedApp(app);
                                                    setModalAdminNotes(app.adminNotes || '');
                                                }}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all"
                                            >
                                                <FiEye /> View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="p-4 border-t border-blue-500/20 flex justify-between items-center bg-slate-900/40">
                            <span className="text-xs text-gray-400">
                                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={pagination.page <= 1}
                                    onClick={() => fetchApplications(pagination.page - 1)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-blue-500/20 text-xs font-bold text-gray-300 disabled:opacity-30 hover:bg-slate-800"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={pagination.page >= pagination.pages}
                                    onClick={() => fetchApplications(pagination.page + 1)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-blue-500/20 text-xs font-bold text-gray-300 disabled:opacity-30 hover:bg-slate-800"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Applicant Details Modal */}
            <AnimatePresence>
                {selectedApp && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={(e) => { if (e.target === e.currentTarget) setSelectedApp(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 space-y-6 border border-blue-500/30 custom-scrollbar-thin bg-[#091527]"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-start border-b border-blue-500/20 pb-4">
                                <div>
                                    <span className="text-xs font-bold uppercase text-gold bg-gold/10 px-3 py-1 rounded-full mb-2 inline-block">
                                        Event Application Detail
                                    </span>
                                    <h2 className="text-2xl font-black text-white">{selectedApp.name}</h2>
                                    <p className="text-gray-400 text-xs mt-1">
                                        Applied for <span className="text-blue-400 font-bold">{selectedApp.eventId?.title}</span> on {new Date(selectedApp.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedApp(null)}
                                    className="p-2 rounded-full bg-slate-800 text-gray-400 hover:text-white transition-colors"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Status Control Panel */}
                            <div className="bg-slate-900/80 p-4 rounded-2xl border border-blue-500/20 space-y-3">
                                <span className="text-xs font-bold text-gray-400 uppercase block">Application Status Control</span>
                                <div className="flex flex-wrap gap-2">
                                    {['registered', 'pending', 'accepted', 'waitlist', 'rejected'].map((st) => (
                                        <button
                                            key={st}
                                            onClick={() => handleStatusChange(selectedApp._id, st)}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${selectedApp.status === st
                                                ? 'bg-gold text-black shadow-lg shadow-gold/20 scale-105'
                                                : 'bg-slate-800 text-gray-400 hover:text-white border border-blue-500/20'
                                                }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Personal & Contact Info Grid */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gold uppercase flex items-center gap-2">
                                    <FiUser /> Candidate Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-900/50 p-5 rounded-2xl border border-blue-500/20 text-xs">
                                    <div><span className="text-gray-500 block">Full Name:</span><span className="text-white font-bold">{selectedApp.name}</span></div>
                                    <div><span className="text-gray-500 block">Email:</span><span className="text-white font-bold">{selectedApp.email}</span></div>
                                    <div><span className="text-gray-500 block">Phone:</span><span className="text-white font-bold">{selectedApp.phone || 'N/A'}</span></div>
                                    <div><span className="text-gray-500 block">University:</span><span className="text-white font-bold">{selectedApp.university || 'N/A'}</span></div>
                                    <div><span className="text-gray-500 block">Faculty:</span><span className="text-white font-bold">{selectedApp.faculty || 'N/A'}</span></div>
                                    <div><span className="text-gray-500 block">Academic Year:</span><span className="text-white font-bold">{selectedApp.academicYear || 'N/A'}</span></div>
                                    <div><span className="text-gray-500 block">Department:</span><span className="text-white font-bold">{selectedApp.department || 'N/A'}</span></div>
                                    <div><span className="text-gray-500 block">Governorate:</span><span className="text-white font-bold">{selectedApp.governorate || 'N/A'}</span></div>
                                    <div><span className="text-gray-500 block">Gender / Age:</span><span className="text-white font-bold">{selectedApp.gender || 'N/A'} {selectedApp.age ? `(${selectedApp.age} yrs)` : ''}</span></div>
                                </div>
                            </div>

                            {/* Links & CV Section */}
                            {(selectedApp.linkedin || selectedApp.github || selectedApp.portfolio || selectedApp.cv) && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-blue-400 uppercase flex items-center gap-2">
                                        <FiGlobe /> Links & Portfolio
                                    </h3>
                                    <div className="flex flex-wrap gap-3 bg-slate-900/50 p-4 rounded-2xl border border-blue-500/20">
                                        {selectedApp.linkedin && (
                                            <a href={selectedApp.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold hover:underline">
                                                <FiExternalLink /> LinkedIn
                                            </a>
                                        )}
                                        {selectedApp.github && (
                                            <a href={selectedApp.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 text-xs font-bold hover:underline">
                                                <FiExternalLink /> GitHub
                                            </a>
                                        )}
                                        {selectedApp.portfolio && (
                                            <a href={selectedApp.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:underline">
                                                <FiExternalLink /> Portfolio
                                            </a>
                                        )}
                                        {selectedApp.cv && (
                                            <a href={selectedApp.cv} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/20 text-gold border border-gold/30 text-xs font-bold hover:underline">
                                                <FiFileText /> View CV
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Dynamic Event Questions & Answers Display */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-green-400 uppercase flex items-center gap-2">
                                    <FiCheckCircle /> Event Application Responses
                                </h3>
                                {selectedApp.answers && selectedApp.answers.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedApp.answers.map((ans, idx) => (
                                            <div key={idx} className="bg-slate-900/60 p-4 rounded-2xl border border-blue-500/20 space-y-2">
                                                <p className="text-xs font-bold text-gray-400">{ans.question}</p>
                                                <div className="text-sm text-white font-semibold">
                                                    {Array.isArray(ans.answer) ? (
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            {ans.answer.map((item: string, i: number) => (
                                                                <span key={i} className="bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1 rounded-xl text-xs flex items-center gap-1">
                                                                    ✓ {item}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="bg-slate-950 p-3 rounded-xl border border-blue-500/20 text-gray-200 text-xs leading-relaxed whitespace-pre-wrap">
                                                            {String(ans.answer)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-900/40 p-4 rounded-2xl text-center text-xs text-gray-500">
                                        No dynamic questions were answered for this application.
                                    </div>
                                )}
                            </div>

                            {/* Admin Notes Section */}
                            <div className="space-y-3 pt-2">
                                <h3 className="text-sm font-bold text-yellow-400 uppercase flex items-center gap-2">
                                    <FiFileText /> Internal Admin Notes
                                </h3>
                                <textarea
                                    value={modalAdminNotes}
                                    onChange={(e) => setModalAdminNotes(e.target.value)}
                                    placeholder="Write admin review comments, internal notes, or interview feedback..."
                                    className="w-full bg-slate-900 border border-blue-500/30 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-gold"
                                    rows={3}
                                />
                                <div className="flex items-center justify-between">
                                    {saveMessage ? (
                                        <span className="text-xs text-green-400 font-bold">{saveMessage}</span>
                                    ) : <span />}
                                    <button
                                        onClick={handleSaveAdminNotes}
                                        disabled={savingNotes}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all disabled:opacity-50"
                                    >
                                        <FiSave /> {savingNotes ? 'Saving...' : 'Save Notes'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
