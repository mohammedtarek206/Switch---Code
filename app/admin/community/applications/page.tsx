'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiSearch, FiSliders, FiEye, FiClock, FiFileText } from 'react-icons/fi';
import Link from 'next/link';

interface Application {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    status: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected' | 'waiting';
    university?: string;
    faculty?: string;
    committeeId: {
        _id: string;
        name: string;
        color: string;
    };
    createdAt: string;
}

interface Committee {
    _id: string;
    name: string;
}

export default function ApplicationsPage() {
    const [apps, setApps] = useState<Application[]>([]);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [search, setSearch] = useState('');
    const [committeeId, setCommitteeId] = useState('');
    const [status, setStatus] = useState('');
    const [university, setUniversity] = useState('');

    async function fetchApps() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const query = new URLSearchParams();
            if (search) query.append('search', search);
            if (committeeId) query.append('committeeId', committeeId);
            if (status) query.append('status', status);
            if (university) query.append('university', university);

            const [appsRes, commsRes] = await Promise.all([
                fetch(`/api/community/applications?${query.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/community/committees')
            ]);

            if (appsRes.ok) setApps(await appsRes.json());
            if (commsRes.ok) setCommittees(await commsRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchApps();
    }, [committeeId, status, university]);

    // Export to CSV helper
    function exportToCSV() {
        if (apps.length === 0) return;
        const headers = ['Applicant Name', 'Email', 'Phone', 'Committee', 'University', 'Faculty', 'Status', 'Applied Date'];
        const rows = apps.map(a => [
            a.name,
            a.email,
            a.phone || '',
            a.committeeId?.name || '',
            a.university || '',
            a.faculty || '',
            a.status,
            new Date(a.createdAt).toLocaleDateString()
        ]);

        const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Applicant_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Applicants Directory</h1>
                    <p className="text-gray-400">Review, filter, and export volunteer applications across all cycles.</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-xl font-bold transition-all border border-white/10"
                >
                    <FiDownload className="mr-2 text-accent" /> Export Sheet
                </button>
            </div>

            {/* Filter and search Bar */}
            <div className="glass p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                    <FiSearch className="absolute left-4 top-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchApps()}
                        className="w-full pl-10 pr-4 py-3 bg-dark-light border border-white/5 rounded-xl text-white outline-none focus:border-accent text-sm"
                    />
                </div>

                {/* Committees */}
                <div>
                    <select
                        value={committeeId}
                        onChange={(e) => setCommitteeId(e.target.value)}
                        className="w-full p-3 bg-dark-light border border-white/5 rounded-xl text-white outline-none focus:border-accent text-sm cursor-pointer"
                    >
                        <option value="">All Committees</option>
                        {committees.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Status */}
                <div>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full p-3 bg-dark-light border border-white/5 rounded-xl text-white outline-none focus:border-accent text-sm cursor-pointer"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="interview">Interview Scheduling</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="waiting">Waiting List</option>
                    </select>
                </div>

                {/* University */}
                <div>
                    <input
                        type="text"
                        placeholder="University (e.g. Cairo)"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="w-full p-3 bg-dark-light border border-white/5 rounded-xl text-white outline-none focus:border-accent text-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[30vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                </div>
            ) : apps.length === 0 ? (
                <div className="glass p-12 text-center rounded-2xl">
                    <FiSliders className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">No applicants match the filter criteria.</p>
                </div>
            ) : (
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-gray-400 text-xs font-bold uppercase">
                                    <th className="p-5">Applicant</th>
                                    <th className="p-5">Committee</th>
                                    <th className="p-5">University</th>
                                    <th className="p-5">Status</th>
                                    <th className="p-5">Applied Date</th>
                                    <th className="p-5 text-right">View Detail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                                {apps.map((a) => (
                                    <tr key={a._id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs text-primary font-bold">
                                                    {a.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="text-white font-bold block">{a.name}</span>
                                                    <span className="text-gray-500 text-xs">{a.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span
                                                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                                                style={{ backgroundColor: `${a.committeeId?.color || '#0066FF'}20`, color: a.committeeId?.color || '#0066FF' }}
                                            >
                                                {a.committeeId?.name || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span className="block text-white font-semibold">{a.university || 'N/A'}</span>
                                            <span className="text-gray-500 text-xs">{a.faculty || ''}</span>
                                        </td>
                                        <td className="p-5">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${a.status === 'accepted' ? 'bg-green-500/10 text-green-400' :
                                                    a.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                                        a.status === 'interview' ? 'bg-purple-500/10 text-purple-400' : 'bg-yellow-500/10 text-yellow-400'
                                                }`}>
                                                {a.status}
                                            </span>
                                        </td>
                                        <td className="p-5 flex items-center mt-2.5">
                                            <FiClock className="mr-2 text-gray-500" />
                                            <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <Link
                                                href={`/admin/community/applications/${a._id}`}
                                                className="inline-flex p-2 bg-white/5 hover:bg-white/10 rounded-lg text-accent transition-colors"
                                            >
                                                <FiEye className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
