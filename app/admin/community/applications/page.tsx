'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiDownload, FiSearch, FiEye, FiClock, FiTrash2, FiRefreshCw,
    FiCheck, FiX, FiUser, FiAlertCircle, FiFilter, FiCode
} from 'react-icons/fi';
import Link from 'next/link';

interface Application {
    _id: string;
    applicationCode: string;
    name: string;
    email: string;
    phone?: string;
    status: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected' | 'waiting';
    university?: string;
    faculty?: string;
    committeeId: { _id: string; name: string; color: string };
    createdAt: string;
    updatedAt: string;
}

interface Committee { _id: string; name: string; }

interface PaginationInfo {
    total: number;
    page: number;
    totalPages: number;
}

const STATUS_CONFIG = {
    pending: { label: 'Pending', ar: 'قيد المراجعة', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    reviewing: { label: 'Reviewing', ar: 'تحت المراجعة', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    interview: { label: 'Interview', ar: 'مرحلة المقابلة', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    accepted: { label: 'Accepted', ar: 'مقبول', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
    rejected: { label: 'Rejected', ar: 'غير مقبول', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    waiting: { label: 'Waiting', ar: 'قائمة الانتظار', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

export default function ApplicationsPage() {
    const [apps, setApps] = useState<Application[]>([]);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [committeeId, setCommitteeId] = useState('');
    const [status, setStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const abortControllerRef = useRef<AbortController | null>(null);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchApps = useCallback(async (page = 1) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const query = new URLSearchParams({ page: String(page), limit: '20' });
            if (search) query.append('search', search);
            if (committeeId) query.append('committeeId', committeeId);
            if (status) query.append('status', status);

            const [appsRes, commsRes] = await Promise.all([
                fetch(`/api/community/applications?${query}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store',
                    signal: abortController.signal
                }),
                fetch('/api/community/committees', {
                    cache: 'no-store',
                    signal: abortController.signal
                }),
            ]);

            if (appsRes.ok) {
                const data = await appsRes.json();
                setApps(data.applications || data);
                if (data.total !== undefined) {
                    setPagination({ total: data.total, page: data.page, totalPages: data.totalPages });
                }
            } else {
                throw new Error('Failed to fetch applications');
            }
            if (commsRes.ok) setCommittees(await commsRes.json());
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error(err);
            setError('حدث خطأ أثناء تحميل طلبات التقديم');
            showToast('Failed to load applications', 'error');
        } finally {
            if (!abortController.signal.aborted) {
                setLoading(false);
            }
        }
    }, [search, committeeId, status]);

    useEffect(() => {
        fetchApps(currentPage);
    }, [committeeId, status, currentPage]);

    useEffect(() => {
        const onFocus = () => fetchApps(currentPage);
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchApps, currentPage]);

    async function handleStatusChange(id: string, newStatus: string) {
        setActionLoading(id + newStatus);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/community/applications/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setApps(prev => prev.map(a => a._id === id ? { ...a, status: newStatus as Application['status'] } : a));
                showToast('Status updated successfully', 'success');
            } else {
                showToast('Failed to update status', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleDelete(id: string) {
        setActionLoading(id + 'delete');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/community/applications/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setApps(prev => prev.filter(a => a._id !== id));
                setPagination(p => ({ ...p, total: p.total - 1 }));
                showToast('Application deleted', 'success');
            } else {
                showToast('Failed to delete', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        } finally {
            setActionLoading(null);
            setDeleteConfirm(null);
        }
    }

    function exportToCSV() {
        if (apps.length === 0) return;
        const headers = ['Code', 'Applicant', 'Email', 'Phone', 'Committee', 'University', 'Faculty', 'Status', 'Applied Date'];
        const rows = apps.map(a => [
            a.applicationCode,
            a.name,
            a.email,
            a.phone || '',
            a.committeeId?.name || '',
            a.university || '',
            a.faculty || '',
            a.status,
            new Date(a.createdAt).toLocaleDateString()
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Applications_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    const statusKeys = Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>;
    const counts = statusKeys.reduce<Record<string, number>>((acc, k) => {
        acc[k] = apps.filter(a => a.status === k).length;
        return acc;
    }, {});

    return (
        <div className="space-y-8 pb-12">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl ${toast.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Applications</h1>
                    <p className="text-gray-400 text-sm">
                        Total: <span className="text-white font-bold">{pagination.total}</span> applicants across all committees
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchApps(currentPage)}
                        className="p-2.5 bg-slate-800 border border-blue-500/20 hover:border-blue-500/50 rounded-xl text-gray-400 hover:text-white transition-all"
                        title="Refresh"
                    >
                        <FiRefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center btn-primary-blue px-5 py-2.5 rounded-xl font-bold transition-all text-sm"
                    >
                        <FiDownload className="mr-2" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {statusKeys.map(k => (
                    <button
                        key={k}
                        onClick={() => { setStatus(status === k ? '' : k); setCurrentPage(1); }}
                        className={`glass-panel p-3 rounded-xl text-center cursor-pointer transition-all border ${status === k ? STATUS_CONFIG[k].cls : 'border-blue-500/10 hover:border-blue-500/30'}`}
                    >
                        <div className="text-2xl font-extrabold text-white">{counts[k] || 0}</div>
                        <div className="text-xs text-gray-400 mt-1">{STATUS_CONFIG[k].label}</div>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="glass-panel p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search name, email, code..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && fetchApps(1)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-blue-500/20 rounded-xl text-white outline-none focus:border-gold text-sm"
                    />
                </div>
                <select
                    value={committeeId}
                    onChange={e => { setCommitteeId(e.target.value); setCurrentPage(1); }}
                    className="w-full p-3 bg-slate-900 border border-blue-500/20 rounded-xl text-white outline-none text-sm cursor-pointer"
                >
                    <option value="">All Committees</option>
                    {committees.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <select
                    value={status}
                    onChange={e => { setStatus(e.target.value); setCurrentPage(1); }}
                    className="w-full p-3 bg-slate-900 border border-blue-500/20 rounded-xl text-white outline-none text-sm cursor-pointer"
                >
                    <option value="">All Statuses</option>
                    {statusKeys.map(k => <option key={k} value={k}>{STATUS_CONFIG[k].label}</option>)}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="glass-panel rounded-2xl overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-5 border-b border-white/5 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-slate-700" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-700 rounded w-1/3" />
                                <div className="h-3 bg-slate-800 rounded w-1/4" />
                            </div>
                            <div className="h-6 w-20 bg-slate-700 rounded-full" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="glass-panel p-16 text-center rounded-2xl">
                    <FiAlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                    <p className="text-gray-400 mb-4">{error}</p>
                    <button onClick={() => fetchApps(currentPage)} className="px-6 py-2 rounded-xl font-bold transition-all text-sm border-blue-500 bg-blue-600/20 hover:bg-blue-600/40 border text-white">
                        إعادة المحاولة Retry
                    </button>
                </div>
            ) : apps.length === 0 ? (
                <div className="glass-panel p-16 text-center rounded-2xl">
                    <FiFilter className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">لا توجد طلبات تقديم حاليًا</p>
                    {(search || committeeId || status) && (
                        <button onClick={() => { setSearch(''); setCommitteeId(''); setStatus(''); }} className="mt-4 text-gold text-sm underline">
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-blue-500/20 text-gray-400 text-xs font-bold uppercase">
                                    <th className="p-4">Applicant</th>
                                    <th className="p-4">Code</th>
                                    <th className="p-4">Committee</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Applied</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                                {apps.map(a => {
                                    const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
                                    return (
                                        <tr key={a._id} className="hover:bg-slate-900/50 transition-colors group">
                                            {/* Applicant */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                        {a.name[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-semibold">{a.name}</div>
                                                        <div className="text-gray-500 text-xs">{a.email}</div>
                                                        {a.phone && <div className="text-gray-500 text-xs">{a.phone}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Code */}
                                            <td className="p-4">
                                                <code className="text-xs bg-slate-800 px-2 py-1 rounded font-mono text-gold">
                                                    {a.applicationCode}
                                                </code>
                                            </td>
                                            {/* Committee */}
                                            <td className="p-4">
                                                <span
                                                    className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                                                    style={{ backgroundColor: `${a.committeeId?.color || '#0066FF'}15`, color: a.committeeId?.color || '#0066FF', borderColor: `${a.committeeId?.color || '#0066FF'}30` }}
                                                >
                                                    {a.committeeId?.name || 'Unassigned'}
                                                </span>
                                            </td>
                                            {/* Status */}
                                            <td className="p-4">
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase border ${sc.cls}`}>
                                                    {sc.label}
                                                </span>
                                            </td>
                                            {/* Date */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                                    <FiClock className="shrink-0" />
                                                    {new Date(a.createdAt).toLocaleDateString('en-GB')}
                                                </div>
                                            </td>
                                            {/* Actions */}
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Quick status buttons */}
                                                    {a.status !== 'accepted' && (
                                                        <button
                                                            onClick={() => handleStatusChange(a._id, 'accepted')}
                                                            disabled={!!actionLoading}
                                                            title="Accept"
                                                            className="p-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-green-400 transition-all"
                                                        >
                                                            <FiCheck className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {a.status !== 'rejected' && (
                                                        <button
                                                            onClick={() => handleStatusChange(a._id, 'rejected')}
                                                            disabled={!!actionLoading}
                                                            title="Reject"
                                                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-all"
                                                        >
                                                            <FiX className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/admin/community/applications/${a._id}`}
                                                        className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 transition-all"
                                                        title="View Details"
                                                    >
                                                        <FiEye className="w-3.5 h-3.5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeleteConfirm(a._id)}
                                                        disabled={!!actionLoading}
                                                        title="Delete"
                                                        className="p-1.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 rounded-lg text-red-500 transition-all"
                                                    >
                                                        <FiTrash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-white/5">
                            <span className="text-xs text-gray-400">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className="px-3 py-1.5 text-xs bg-slate-800 border border-white/10 rounded-lg text-white disabled:opacity-40 hover:bg-slate-700 transition-all"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={currentPage >= pagination.totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="px-3 py-1.5 text-xs bg-slate-800 border border-white/10 rounded-lg text-white disabled:opacity-40 hover:bg-slate-700 transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="glass-panel p-8 rounded-3xl w-full max-w-sm text-center space-y-4"
                            onClick={e => e.stopPropagation()}
                        >
                            <FiAlertCircle className="w-12 h-12 mx-auto text-red-400" />
                            <h3 className="text-xl font-bold text-white">Delete Application?</h3>
                            <p className="text-gray-400 text-sm">This action cannot be undone.</p>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    disabled={!!actionLoading}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all text-sm"
                                >
                                    {actionLoading ? '...' : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
