'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiSearch, FiFilter, FiCheckCircle, FiXCircle, FiClock, FiMessageSquare, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';

interface Application {
    _id: string;
    name: string;
    email: string;
    phone: string;
    university: string;
    faculty: string;
    status: 'pending' | 'accepted' | 'rejected' | 'waiting';
    committeeId?: { name: string };
    createdAt: string;
    hrNote?: string;
}

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    accepted: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    waiting: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export default function HRDashboard() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [note, setNote] = useState('');
    const [permissions, setPermissions] = useState<string[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/login'; return; }
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setPermissions(user.permissions || []);
            if (!['hr', 'admin', 'super_admin'].includes(user.role)) {
                window.location.href = '/dashboard';
            }
        }
        fetchApplications();
    }, []);

    async function fetchApplications() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/community/applications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setApplications(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    async function updateStatus(id: string, status: string) {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/community/applications/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        if (res.ok) fetchApplications();
    }

    async function saveNote(id: string) {
        const token = localStorage.getItem('token');
        await fetch(`/api/community/applications/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ hrNote: note })
        });
        setSelectedApp(null);
        setNote('');
        fetchApplications();
    }

    const filtered = applications.filter(a => {
        const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || a.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        accepted: applications.filter(a => a.status === 'accepted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        waiting: applications.filter(a => a.status === 'waiting').length,
    };

    return (
        <div className="min-h-screen bg-dark text-white py-10 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="inline-flex items-center bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold text-blue-400 mb-2">
                            HR Dashboard
                        </div>
                        <h1 className="text-3xl font-extrabold">Recruitment Management</h1>
                        <p className="text-gray-400 text-sm mt-1">Review, evaluate, and manage all applicant submissions.</p>
                    </div>
                    <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white">← Main Dashboard</Link>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Total', val: stats.total, color: 'text-white' },
                        { label: 'Pending', val: stats.pending, color: 'text-yellow-400' },
                        { label: 'Accepted', val: stats.accepted, color: 'text-green-400' },
                        { label: 'Rejected', val: stats.rejected, color: 'text-red-400' },
                        { label: 'Waiting', val: stats.waiting, color: 'text-blue-400' },
                    ].map(s => (
                        <div key={s.label} className="glass p-4 rounded-2xl text-center border border-white/5">
                            <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">{s.label}</span>
                            <span className={`text-2xl font-extrabold ${s.color}`}>{s.val}</span>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-3 text-gray-500" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full pl-9 pr-4 py-2.5 bg-dark border border-white/10 rounded-xl text-white text-sm outline-none focus:border-accent"
                        />
                    </div>
                    <select
                        value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="bg-dark border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="waiting">Waiting List</option>
                    </select>
                </div>

                {/* Applications Table */}
                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-accent"></div></div>
                ) : (
                    <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead className="border-b border-white/5">
                                    <tr className="text-gray-400 text-[10px] font-bold uppercase">
                                        <th className="p-4">Applicant</th>
                                        <th className="p-4">Committee</th>
                                        <th className="p-4">University</th>
                                        <th className="p-4">Applied</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {filtered.map(app => (
                                        <tr key={app._id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4">
                                                <span className="text-white font-bold block">{app.name}</span>
                                                <span className="text-gray-500 text-xs">{app.email}</span>
                                                <span className="text-gray-600 text-xs">{app.phone}</span>
                                            </td>
                                            <td className="p-4 text-gray-400 text-xs">{app.committeeId?.name || '—'}</td>
                                            <td className="p-4 text-gray-400 text-xs">
                                                <span className="block">{app.university}</span>
                                                <span className="text-gray-600">{app.faculty}</span>
                                            </td>
                                            <td className="p-4 text-gray-500 text-xs">{new Date(app.createdAt).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${STATUS_STYLES[app.status]}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                    <button onClick={() => updateStatus(app._id, 'accepted')} className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400" title="Accept"><FiCheckCircle className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => updateStatus(app._id, 'rejected')} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400" title="Reject"><FiXCircle className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => updateStatus(app._id, 'waiting')} className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400" title="Waiting List"><FiClock className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => { setSelectedApp(app); setNote(app.hrNote || ''); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400" title="Add Note"><FiMessageSquare className="w-3.5 h-3.5" /></button>
                                                    <Link href={`/admin/community/applications/${app._id}`} className="p-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-[10px] font-bold px-3">Review</Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-16 text-gray-500 text-sm">No applications match your search criteria.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Note Modal */}
            {selectedApp && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-8 rounded-3xl w-full max-w-md space-y-4 border border-white/10">
                        <h3 className="font-bold text-white">Add HR Note — {selectedApp.name}</h3>
                        <textarea
                            rows={5} value={note} onChange={e => setNote(e.target.value)}
                            placeholder="Internal HR evaluation notes..."
                            className="w-full p-4 bg-dark border border-white/10 rounded-xl text-white text-sm outline-none focus:border-accent resize-none"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => saveNote(selectedApp._id)} className="flex-1 bg-accent text-black py-3 rounded-xl font-bold text-sm">Save Note</button>
                            <button onClick={() => setSelectedApp(null)} className="flex-1 bg-white/5 text-gray-300 py-3 rounded-xl font-bold text-sm">Cancel</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
