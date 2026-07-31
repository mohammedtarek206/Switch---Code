'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    FiCalendar, FiUsers, FiCheckCircle, FiXCircle, FiClock,
    FiDownload, FiSearch, FiFilter, FiMail, FiCheckSquare, FiLogOut, FiEye, FiX
} from 'react-icons/fi';
import { AnimatePresence } from 'framer-motion';

export default function EventApplicationsDashboard() {
    const params = useParams();
    const eventId = params?.id as string;

    const [event, setEvent] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedApplicant, setSelectedApplicant] = useState<any>(null);

    useEffect(() => {
        if (eventId) fetchApplications();
    }, [eventId]);

    async function fetchApplications() {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/admin/events/${eventId}/applications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEvent(data.event);
                setApplications(data.applications);
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Failed to load event applications', err);
        } finally {
            setLoading(false);
        }
    }

    async function updateStatus(registrationId: string, status?: string, action?: string) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/admin/events/${eventId}/applications`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ registrationId, status, action })
            });
            if (res.ok) fetchApplications();
        } catch (err) {
            console.error('Failed to update applicant', err);
        }
    }

    function exportCSV() {
        if (!applications.length) return;

        // Find all unique custom questions across all applications
        const customQuestionHeaders = new Set<string>();
        applications.forEach(app => {
            if (app.answers) {
                app.answers.forEach((ans: any) => customQuestionHeaders.add(ans.question));
            }
        });
        const customQuestionsArray = Array.from(customQuestionHeaders);

        const headers = ['Name', 'Email', 'Phone', 'University', 'Faculty', 'Status', 'Attended', 'Date', ...customQuestionsArray];

        const rows = applications.map(a => {
            const row = [
                `"${a.name}"`,
                `"${a.email}"`,
                `"${a.phone || ''}"`,
                `"${a.university || ''}"`,
                `"${a.faculty || ''}"`,
                `"${a.status}"`,
                `"${a.attended ? 'Yes' : 'No'}"`,
                `"${new Date(a.createdAt).toLocaleDateString()}"`
            ];

            // Add custom answers in order
            customQuestionsArray.forEach(qTitle => {
                const ans = (a.answers || []).find((ans: any) => ans.question === qTitle);
                if (ans) {
                    row.push(`"${Array.isArray(ans.answer) ? ans.answer.join(', ') : String(ans.answer)}"`);
                } else {
                    row.push('""');
                }
            });

            return row;
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${event?.title || 'event'}_registrations.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const filtered = applications.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            {/* Event Header */}
            <div className="glass-panel p-8 rounded-[2.5rem] border border-blue-500/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-glow-blue">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-3xl rounded-full pointer-events-none"></div>
                <div className="relative z-10">
                    <span className="text-[10px] uppercase font-black text-gold tracking-widest mb-2 inline-block">
                        Event Management Dashboard
                    </span>
                    <h1 className="text-3xl font-black text-white">{event?.title}</h1>
                    <p className="text-slate-400 text-sm font-semibold mt-2">
                        📅 {new Date(event?.date).toLocaleDateString()} | 📍 {event?.location || 'Online'} | 👥 Seats: {event?.seats || 'Unlimited'}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 relative z-10">
                    <button onClick={exportCSV} className="flex items-center gap-2 bg-blue-900/30 hover:bg-blue-600/30 text-blue-400 font-black tracking-widest uppercase px-6 py-3.5 rounded-2xl text-xs border border-blue-500/30 transition-all shadow-md">
                        <FiDownload className="w-4 h-4" /> Export Excel
                    </button>
                    <button onClick={() => {
                        const link = `${window.location.origin}/events/${eventId}`;
                        navigator.clipboard.writeText(link);
                        alert('Application link copied to clipboard!');
                    }} className="flex items-center gap-2 bg-blue-900/30 hover:bg-blue-600/30 text-gold font-black tracking-widest uppercase px-6 py-3.5 rounded-2xl text-xs border border-gold/30 hover:border-gold transition-all shadow-md">
                        🔗 Copy Apply Link
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-blue-500/20 hover:border-gold/50 font-black tracking-widest uppercase px-6 py-3.5 rounded-2xl text-xs transition-all shadow-md">
                        🖨️ Print Report
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[
                    { label: 'Total', value: stats?.total || 0, color: 'text-white' },
                    { label: 'Accepted', value: stats?.accepted || 0, color: 'text-green-400' },
                    { label: 'Waitlist', value: stats?.waitlist || 0, color: 'text-yellow-400' },
                    { label: 'Rejected', value: stats?.rejected || 0, color: 'text-red-400' },
                    { label: 'Registered', value: stats?.registered || 0, color: 'text-blue-500' },
                    { label: 'Check-In', value: stats?.checkedIn || 0, color: 'text-gold' },
                    { label: 'Check-Out', value: stats?.checkedOut || 0, color: 'text-purple-400' },
                ].map((s, i) => (
                    <div key={i} className="glass-card p-5 rounded-2xl border border-blue-500/20 text-center shadow-md">
                        <span className={`text-3xl font-black block ${s.color}`}>{s.value}</span>
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-1 block">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Filter and Search */}
            <div className="glass-panel p-5 rounded-3xl border border-blue-500/20 flex flex-col md:flex-row gap-5 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <FiSearch className="absolute left-4 top-3.5 text-blue-500" />
                    <input
                        type="text"
                        placeholder="Search applicant name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-blue-500/30 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-gold font-medium transition-colors"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {['all', 'registered', 'accepted', 'waitlist', 'rejected'].map(st => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all shrink-0 ${filterStatus === st ? 'bg-gold/10 text-gold border-gold/40 shadow-glow-gold' : 'bg-slate-900 text-slate-400 border-blue-500/20 hover:border-gold/30 hover:text-gold'}`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Applicants Table */}
            <div className="glass-panel rounded-3xl border border-blue-500/20 overflow-hidden shadow-lg shadow-blue-900/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap min-w-[900px]">
                        <thead className="bg-slate-900/70 border-b border-blue-500/20 text-[10px] uppercase font-black tracking-widest text-slate-400">
                            <tr>
                                <th className="p-5">Applicant</th>
                                <th className="p-5">Contact</th>
                                <th className="p-5">Education</th>
                                <th className="p-5">Status</th>
                                <th className="p-5">Check-In / Out</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-500/10 text-sm text-slate-300">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-12 text-slate-500 font-medium">No applicants found for this event.</td>
                                </tr>
                            ) : null}
                            {filtered.map(app => (
                                <tr key={app._id} className="hover:bg-blue-950/20 transition-colors">
                                    <td className="p-5 font-black text-white">
                                        {app.name}
                                    </td>
                                    <td className="p-5 text-xs font-medium space-y-1">
                                        <span className="text-gold block">{app.email}</span>
                                        <span className="text-slate-400 block">{app.phone || 'N/A'}</span>
                                    </td>
                                    <td className="p-5 text-xs font-medium space-y-1">
                                        <span className="text-white block">{app.university || 'Not specified'}</span>
                                        <span className="text-slate-500 block">{app.faculty || ''}</span>
                                    </td>
                                    <td className="p-5">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${app.status === 'accepted' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                            app.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                                app.status === 'waitlist' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                                                    'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="p-5 text-xs font-bold">
                                        {app.checkIn ? (
                                            <span className="text-green-400 block mb-1">✓ In: {new Date(app.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        ) : (
                                            <button onClick={() => updateStatus(app._id, undefined, 'checkin')} className="text-[10px] uppercase tracking-wider bg-slate-900 border border-blue-500/20 hover:border-gold hover:text-gold px-3 py-1.5 rounded-lg text-slate-400 transition-all block mb-1">Check In</button>
                                        )}
                                        {app.checkOut ? (
                                            <span className="text-purple-400 block">✓ Out: {new Date(app.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        ) : app.checkIn ? (
                                            <button onClick={() => updateStatus(app._id, undefined, 'checkout')} className="text-[10px] uppercase tracking-wider bg-slate-900 border border-blue-500/20 hover:border-purple-400 hover:text-purple-400 px-3 py-1.5 rounded-lg text-slate-400 transition-all block">Check Out</button>
                                        ) : null}
                                    </td>
                                    <td className="p-5 text-right space-x-2">
                                        <button onClick={() => setSelectedApplicant(app)} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl transition-colors mr-2">
                                            <FiEye className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => updateStatus(app._id, 'accepted')} className="px-3 py-1.5 text-[10px] uppercase font-black tracking-widest bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl transition-colors">Accept</button>
                                        <button onClick={() => updateStatus(app._id, 'waitlist')} className="px-3 py-1.5 text-[10px] uppercase font-black tracking-widest bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl transition-colors">Waitlist</button>
                                        <button onClick={() => updateStatus(app._id, 'rejected')} className="px-3 py-1.5 text-[10px] uppercase font-black tracking-widest bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-colors">Reject</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {selectedApplicant && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/90 backdrop-blur-xl"
                        onClick={e => { if (e.target === e.currentTarget) setSelectedApplicant(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[2.5rem] p-8 space-y-6 border border-blue-500/30 custom-scrollbar-thin"
                        >
                            <div className="flex justify-between items-start border-b border-blue-500/20 pb-4">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gold mb-1 block">Applicant Profile</span>
                                    <h2 className="text-2xl font-black text-white">{selectedApplicant.name}</h2>
                                    <p className="text-slate-400 text-sm mt-1">{selectedApplicant.email} • {selectedApplicant.phone || 'No Phone'}</p>
                                </div>
                                <button onClick={() => setSelectedApplicant(null)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 transition-colors">
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-gold mb-2">Applicant Profile Details</h3>
                                    <div className="grid grid-cols-2 gap-3 bg-slate-900/50 p-4 rounded-2xl border border-blue-500/20 text-xs">
                                        <p><span className="text-slate-500">University:</span> <span className="text-white font-medium block">{selectedApplicant.university || 'N/A'}</span></p>
                                        <p><span className="text-slate-500">Faculty/Major:</span> <span className="text-white font-medium block">{selectedApplicant.faculty || 'N/A'}</span></p>
                                        <p><span className="text-slate-500">Academic Year:</span> <span className="text-white font-medium block">{selectedApplicant.academicYear || 'N/A'}</span></p>
                                        <p><span className="text-slate-500">Department:</span> <span className="text-white font-medium block">{selectedApplicant.department || 'N/A'}</span></p>
                                        <p><span className="text-slate-500">Governorate:</span> <span className="text-white font-medium block">{selectedApplicant.governorate || 'N/A'}</span></p>
                                        <p><span className="text-slate-500">Gender / Age:</span> <span className="text-white font-medium block">{selectedApplicant.gender || 'N/A'} {selectedApplicant.age ? `(${selectedApplicant.age})` : ''}</span></p>
                                    </div>
                                </div>

                                {(selectedApplicant.linkedin || selectedApplicant.github || selectedApplicant.portfolio || selectedApplicant.cv) && (
                                    <div>
                                        <h3 className="text-xs font-bold uppercase text-blue-400 mb-2">Links & Links</h3>
                                        <div className="flex flex-wrap gap-2 bg-slate-900/50 p-4 rounded-2xl border border-blue-500/20 text-xs">
                                            {selectedApplicant.linkedin && <a href={selectedApplicant.linkedin} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-xl">LinkedIn ↗</a>}
                                            {selectedApplicant.github && <a href={selectedApplicant.github} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-xl">GitHub ↗</a>}
                                            {selectedApplicant.portfolio && <a href={selectedApplicant.portfolio} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">Portfolio ↗</a>}
                                            {selectedApplicant.cv && <a href={selectedApplicant.cv} target="_blank" rel="noreferrer" className="text-gold hover:underline bg-gold/10 border border-gold/30 px-3 py-1 rounded-xl">CV Document ↗</a>}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-xs font-bold uppercase text-green-400 mb-2">Registration Questions & Answers</h3>
                                    {selectedApplicant.answers && selectedApplicant.answers.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedApplicant.answers.map((ans: any, idx: number) => (
                                                <div key={idx} className="bg-slate-900/50 p-4 rounded-2xl border border-blue-500/20">
                                                    <p className="text-xs text-slate-400 font-bold mb-1">{ans.question}</p>
                                                    <div className="text-sm text-white font-medium">
                                                        {Array.isArray(ans.answer) ? (
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {ans.answer.map((item: string, i: number) => (
                                                                    <span key={i} className="bg-green-500/10 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded-lg text-xs">
                                                                        ✔ {item}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-200">{String(ans.answer)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-blue-500/20 text-center text-slate-500 text-sm">
                                            No custom questions answered by this applicant.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
