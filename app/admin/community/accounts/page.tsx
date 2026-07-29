'use client';

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiUsers, FiSearch, FiFilter, FiSettings, FiTrash2, FiUserCheck,
    FiUserX, FiCopy, FiRefreshCw, FiCheckCircle, FiPlus
} from 'react-icons/fi';
import Link from 'next/link';

// ─── Skeleton Row ────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-700/60 shrink-0" />
                    <div className="space-y-2">
                        <div className="h-3 w-28 bg-slate-700/60 rounded" />
                        <div className="h-2.5 w-20 bg-slate-700/40 rounded" />
                    </div>
                </div>
            </td>
            <td className="p-4">
                <div className="h-3 w-24 bg-slate-700/60 rounded mb-2" />
                <div className="h-2.5 w-32 bg-slate-700/40 rounded" />
            </td>
            <td className="p-4">
                <div className="h-3 w-20 bg-slate-700/60 rounded mb-2" />
                <div className="h-2.5 w-16 bg-slate-700/40 rounded" />
            </td>
            <td className="p-4">
                <div className="h-5 w-20 bg-slate-700/60 rounded mb-1" />
                <div className="h-2.5 w-12 bg-slate-700/40 rounded" />
            </td>
            <td className="p-4 text-center">
                <div className="h-6 w-20 bg-slate-700/60 rounded-full mx-auto" />
            </td>
            <td className="p-4">
                <div className="h-3 w-20 bg-slate-700/40 rounded" />
            </td>
            <td className="p-4 text-right">
                <div className="flex gap-2 justify-end">
                    <div className="w-8 h-8 bg-slate-700/60 rounded-lg" />
                    <div className="w-8 h-8 bg-slate-700/60 rounded-lg" />
                    <div className="w-8 h-8 bg-slate-700/60 rounded-lg" />
                </div>
            </td>
        </tr>
    );
}

// ─── Account Row (memoized) ──────────────────────────────────────────────────
const AccountRow = memo(function AccountRow({
    acc,
    onToggle,
    onReset,
    onEdit,
    onDelete,
    onCopy,
}: {
    acc: any;
    onToggle: (id: string) => void;
    onReset: (id: string) => void;
    onEdit: (acc: any) => void;
    onDelete: (id: string) => void;
    onCopy: (text: string, label: string) => void;
}) {
    return (
        <tr className="hover:bg-white/[0.02] transition-colors">
            <td className="p-4 font-extrabold text-white">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center font-bold text-gold shrink-0">
                        {acc.avatar
                            ? <img src={acc.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                            : acc.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <span>{acc.name}</span>
                        <span className="text-xs text-gray-500 block font-normal">{acc.phone || 'No phone'}</span>
                    </div>
                </div>
            </td>
            <td className="p-4 font-mono text-xs">
                <div className="flex items-center gap-2">
                    <span className="text-gold font-bold">{acc.username}</span>
                    <button onClick={() => onCopy(acc.username, 'Username')} title="Copy Username" className="text-gray-500 hover:text-white">
                        <FiCopy className="w-3.5 h-3.5" />
                    </button>
                </div>
                <span className="text-gray-500 block text-[11px] font-normal">{acc.email || 'No email'}</span>
            </td>
            <td className="p-4 text-xs">
                <span className="text-blue-500 font-bold block">{acc.committeeId?.name || 'Global'}</span>
                <span className="text-gray-400 font-medium">{acc.teamId?.name ? `Team: ${acc.teamId.name}` : 'No Sub-Team'}</span>
            </td>
            <td className="p-4 text-xs font-bold">
                <span className="uppercase bg-slate-900 border border-blue-500/20 px-2 py-0.5 rounded text-gray-300 inline-block mb-1">
                    {acc.role?.replace(/_/g, ' ')}
                </span>
                <span className="text-gold block text-[11px] font-normal">{acc.position || 'Member'}</span>
            </td>
            <td className="p-4 text-center">
                <button
                    onClick={() => onToggle(acc._id)}
                    className={`px-3 py-1 text-[10px] uppercase font-bold rounded-full ${acc.isActive
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                >
                    {acc.isActive ? <FiUserCheck className="inline mr-1" /> : <FiUserX className="inline mr-1" />}
                    {acc.isActive ? 'Active' : 'Suspended'}
                </button>
            </td>
            <td className="p-4 text-xs text-gray-500">
                {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : 'N/A'}
            </td>
            <td className="p-4 text-right space-x-1 whitespace-nowrap">
                <button onClick={() => onReset(acc._id)} title="Reset Password"
                    className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-colors">
                    <FiRefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => onEdit(acc)} title="Edit Account"
                    className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors">
                    <FiSettings className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(acc._id)} title="Delete Account"
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                    <FiTrash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
});

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AccountsManagementPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [committees, setCommittees] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [committeeFilter, setCommitteeFilter] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [credentialsPopup, setCredentialsPopup] = useState<any>(null);

    const [formData, setFormData] = useState({
        _id: '', name: '', username: '', email: '', phone: '', tempPassword: '',
        role: 'member', committeeId: '', teamId: '', position: '',
        permissions: [] as string[], isActive: true, notes: '', avatar: ''
    });

    const ALL_ROLES = [
        'super_admin', 'admin', 'president', 'vice_president', 'hr', 'pr',
        'marketing', 'media', 'finance', 'operations', 'logistics', 'sponsorship',
        'technical', 'committee_leader', 'vice_committee_leader', 'instructor', 'mentor', 'member', 'student'
    ];

    const AVAILABLE_PERMISSIONS = [
        'manage_users', 'manage_committees', 'manage_teams', 'manage_tasks', 'manage_events',
        'issue_warnings', 'grant_rewards', 'view_all_reports', 'edit_system_settings'
    ];

    const abortRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async () => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const signal = abortRef.current.signal;

        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        try {
            // All three requests in parallel
            const [accRes, commRes, teamRes] = await Promise.all([
                fetch('/api/community/accounts', { headers: { Authorization: `Bearer ${token}` }, signal }),
                fetch('/api/community/committees', { signal }),
                fetch('/api/community/teams', { signal }),
            ]);
            if (!signal.aborted) {
                if (accRes.ok) setAccounts(await accRes.json());
                if (commRes.ok) setCommittees(await commRes.json());
                if (teamRes.ok) setTeams(await teamRes.json());
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') console.error('Accounts fetch error:', err);
        } finally {
            if (!abortRef.current?.signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        return () => abortRef.current?.abort();
    }, [fetchData]);

    // ── Optimistic toggle status ────────────────────────────────────────────
    const toggleStatus = useCallback(async (id: string) => {
        // Optimistic update
        setAccounts(prev => prev.map(a => a._id === id ? { ...a, isActive: !a.isActive } : a));
        const token = localStorage.getItem('token');
        const res = await fetch('/api/community/accounts', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id, action: 'TOGGLE_ACTIVE' }),
        });
        if (!res.ok) {
            // Revert on failure
            setAccounts(prev => prev.map(a => a._id === id ? { ...a, isActive: !a.isActive } : a));
        }
    }, []);

    // ── Optimistic delete ───────────────────────────────────────────────────
    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('Are you sure you want to delete this account?')) return;
        const token = localStorage.getItem('token');

        // Keep a copy for potential revert
        setAccounts(prev => prev.filter(a => a._id !== id));

        const res = await fetch(`/api/community/accounts?id=${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            alert('Failed to delete account');
            fetchData(); // revert by re-fetching
        }
    }, [fetchData]);

    const resetPassword = useCallback(async (id: string) => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/community/accounts', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id, action: 'RESET_PASSWORD' }),
        });
        if (res.ok) {
            const data = await res.json();
            setCredentialsPopup({ name: 'Password Reset', username: data.username, tempPassword: data.tempPassword });
        }
    }, []);

    const handleSaveAccount = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const isEditing = !!formData._id;
        const method = isEditing ? 'PUT' : 'POST';
        const payload = isEditing
            ? { id: formData._id, action: 'UPDATE_FULL_ACCOUNT', payload: formData }
            : formData;

        const res = await fetch('/api/community/accounts', {
            method,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (res.ok) {
            setIsModalOpen(false);
            if (isEditing) {
                // Optimistic update in list
                setAccounts(prev => prev.map(a => a._id === formData._id ? { ...a, ...data } : a));
            } else {
                // Prepend new account
                setAccounts(prev => [data, ...prev]);
                setCredentialsPopup({ name: data.name, username: data.username, tempPassword: formData.tempPassword });
            }
        } else {
            alert(data.error || 'Failed to save account');
        }
    }, [formData]);

    function openNewModal() {
        setFormData({
            _id: '', name: '', username: '', email: '', phone: '',
            tempPassword: Math.random().toString(36).slice(-8),
            role: 'member', committeeId: '', teamId: '', position: '',
            permissions: [], isActive: true, notes: '', avatar: ''
        });
        setIsModalOpen(true);
    }

    function copyToClipboard(text: string, label: string) {
        navigator.clipboard.writeText(text);
        alert(`${label} copied to clipboard!`);
    }

    function toggleFormPermission(perm: string) {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }));
    }

    const filteredFormTeams = useMemo(() =>
        formData.committeeId
            ? teams.filter(t => (t.committeeId?._id || t.committeeId) === formData.committeeId)
            : teams,
        [teams, formData.committeeId]
    );

    // Client-side instant filter + search — no extra API calls
    const filteredAccounts = useMemo(() => {
        const query = searchTerm.toLowerCase();
        return accounts.filter(acc => {
            if (roleFilter && acc.role !== roleFilter) return false;
            if (committeeFilter && acc.committeeId?._id !== committeeFilter && acc.committeeId !== committeeFilter) return false;
            if (!query) return true;
            return (
                acc.name?.toLowerCase().includes(query) ||
                acc.username?.toLowerCase().includes(query) ||
                acc.email?.toLowerCase().includes(query)
            );
        });
    }, [accounts, searchTerm, roleFilter, committeeFilter]);

    // Pagination — reset to page 1 on filter change
    const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pagedAccounts = useMemo(() =>
        filteredAccounts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
        [filteredAccounts, safePage]
    );

    // Reset page when filters change
    useEffect(() => setPage(1), [searchTerm, roleFilter, committeeFilter]);

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Accounts Management</h1>
                    <p className="text-gray-400 text-sm">
                        Provision, configure roles, assign teams, positions, and maintain access control.
                        {!loading && (
                            <span className="ml-2 text-gold font-bold">
                                {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href="/admin/community/teams"
                        className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2 text-sm">
                        <FiUsers className="w-4 h-4" /> Manage Teams
                    </Link>
                    <button onClick={openNewModal}
                        className="btn-primary-blue px-6 py-3 rounded-xl hover:scale-105 transition-transform shadow-glow-blue flex items-center gap-2 text-sm">
                        <FiPlus className="w-5 h-5" /> Create New Account
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-5 flex flex-col md:flex-row gap-4 border border-blue-500/20 rounded-3xl">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by name, username, or email…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold text-sm"
                    />
                </div>
                <div className="relative md:w-56">
                    <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold text-sm appearance-none">
                        <option value="">All Roles</option>
                        {ALL_ROLES.map(r => <option key={r} value={r}>{r.toUpperCase().replace(/_/g, ' ')}</option>)}
                    </select>
                </div>
                <div className="relative md:w-56">
                    <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <select value={committeeFilter} onChange={e => setCommitteeFilter(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold text-sm appearance-none">
                        <option value="">All Committees</option>
                        {committees.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Accounts Table */}
            <div className="glass-panel border border-blue-500/20 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-900 border-b border-blue-500/20 text-[10px] uppercase font-bold text-gray-400">
                            <tr>
                                <th className="p-4">Member Name</th>
                                <th className="p-4">Username &amp; Email</th>
                                <th className="p-4">Committee &amp; Team</th>
                                <th className="p-4">Position &amp; Role</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4">Created Date</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : pagedAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center p-10 text-gray-500">
                                        {searchTerm || roleFilter || committeeFilter
                                            ? 'No accounts match your filters.'
                                            : 'No accounts yet.'}
                                    </td>
                                </tr>
                            ) : pagedAccounts.map(acc => (
                                <AccountRow
                                    key={acc._id}
                                    acc={acc}
                                    onToggle={toggleStatus}
                                    onReset={resetPassword}
                                    onEdit={a => {
                                        setFormData({
                                            ...a,
                                            committeeId: a.committeeId?._id || a.committeeId || '',
                                            teamId: a.teamId?._id || a.teamId || '',
                                        });
                                        setIsModalOpen(true);
                                    }}
                                    onDelete={handleDelete}
                                    onCopy={copyToClipboard}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-blue-500/10">
                        <span className="text-xs text-gray-500">
                            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredAccounts.length)} of {filteredAccounts.length}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={safePage === 1}
                                className="px-4 py-2 text-xs font-bold bg-slate-900 border border-blue-500/20 rounded-xl text-white disabled:opacity-40 hover:border-gold transition-colors"
                            >
                                ← Prev
                            </button>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                const pageNum = totalPages <= 7
                                    ? i + 1
                                    : safePage <= 4
                                        ? i + 1
                                        : safePage >= totalPages - 3
                                            ? totalPages - 6 + i
                                            : safePage - 3 + i;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors ${pageNum === safePage
                                            ? 'bg-gold/10 text-gold border-gold/40'
                                            : 'bg-slate-900 border-blue-500/20 text-gray-400 hover:border-gold hover:text-gold'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={safePage === totalPages}
                                className="px-4 py-2 text-xs font-bold bg-slate-900 border border-blue-500/20 rounded-xl text-white disabled:opacity-40 hover:border-gold transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                        onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 custom-scrollbar-thin"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 border-b border-blue-500/30 pb-4">
                                {formData._id ? 'Edit User Credentials & Team Assignment' : 'Create New Account & Assign Team'}
                            </h2>

                            <form onSubmit={handleSaveAccount} className="space-y-6 text-sm">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Identity */}
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-gold border-b border-blue-500/20 pb-2">Identity Details</h3>
                                        {[
                                            { label: 'Full Name *', key: 'name', type: 'text', required: true },
                                            { label: 'Username (Unique) *', key: 'username', type: 'text', required: true },
                                            { label: 'Email Address (Optional)', key: 'email', type: 'email', required: false },
                                            { label: 'Phone Number (Optional)', key: 'phone', type: 'text', required: false },
                                        ].map(({ label, key, type, required }) => (
                                            <div key={key} className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-400">{label}</label>
                                                <input
                                                    type={type} required={required}
                                                    value={(formData as any)[key]}
                                                    onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                                                    className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold"
                                                />
                                            </div>
                                        ))}
                                        {!formData._id && (
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-400">Temporary Password *</label>
                                                <input
                                                    type="text" required value={formData.tempPassword}
                                                    onChange={e => setFormData(f => ({ ...f, tempPassword: e.target.value }))}
                                                    className="w-full p-3 bg-[#07111F] border border-gold/20 rounded-xl text-gold font-mono outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Placement */}
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-blue-400 border-b border-blue-500/20 pb-2">Committee, Team & Position</h3>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400">Primary System Role *</label>
                                            <select required value={formData.role}
                                                onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}
                                                className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold">
                                                {ALL_ROLES.map(r => <option key={r} value={r}>{r.toUpperCase().replace(/_/g, ' ')}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400">Committee Attachment</label>
                                            <select value={formData.committeeId}
                                                onChange={e => setFormData(f => ({ ...f, committeeId: e.target.value, teamId: '' }))}
                                                className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold">
                                                <option value="">Global / Independent</option>
                                                {committees.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400">Team (Sub-Committee)</label>
                                            <select value={formData.teamId}
                                                onChange={e => setFormData(f => ({ ...f, teamId: e.target.value }))}
                                                className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold">
                                                <option value="">No Specific Team</option>
                                                {filteredFormTeams.map(t => (
                                                    <option key={t._id} value={t._id}>{t.name} ({t.committeeId?.name || 'Sub-Team'})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400">Internal Position Title</label>
                                            <input type="text" placeholder="e.g. Leader, Member, Mentor"
                                                value={formData.position}
                                                onChange={e => setFormData(f => ({ ...f, position: e.target.value }))}
                                                className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400">Administrative Notes</label>
                                            <input type="text" value={formData.notes || ''}
                                                onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                                                className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" />
                                        </div>
                                    </div>
                                </div>

                                {/* Permissions */}
                                <div className="space-y-2 pt-4">
                                    <h3 className="font-bold text-purple-400 border-b border-blue-500/20 pb-2">Granular Role Permissions Override</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-900 border border-blue-500/20 p-4 rounded-xl">
                                        {AVAILABLE_PERMISSIONS.map(p => (
                                            <label key={p} className="flex items-center space-x-2 text-xs font-bold text-gray-400 cursor-pointer hover:text-white">
                                                <input type="checkbox" checked={formData.permissions.includes(p)}
                                                    onChange={() => toggleFormPermission(p)} className="accent-accent w-4 h-4" />
                                                <span>{p.replace(/_/g, ' ').toUpperCase()}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-blue-500/30">
                                    <button type="button" onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 bg-slate-900 border border-blue-500/20 font-bold rounded-xl text-gray-300">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary-blue px-6 py-3 rounded-xl font-bold text-sm">
                                        Save Account
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Generated Credentials Popup */}
            <AnimatePresence>
                {credentialsPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#07111F] border border-gold/30 shadow-[0_0_50px_rgba(0,255,136,0.15)] w-full max-w-sm p-8 rounded-3xl text-center space-y-6"
                        >
                            <FiCheckCircle className="w-16 h-16 text-gold mx-auto" />
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{credentialsPopup.name}</h2>
                                <p className="text-gray-400 text-xs">Credentials generated successfully. Share with member.</p>
                            </div>
                            <div className="bg-slate-900 border border-blue-500/20 p-4 rounded-xl text-left space-y-3 font-mono text-xs">
                                <div>
                                    <span className="text-gray-500 uppercase text-[10px] font-bold block">Username</span>
                                    <span className="text-gold font-bold text-sm">{credentialsPopup.username}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 uppercase text-[10px] font-bold block">Temporary Password</span>
                                    <span className="text-yellow-400 font-bold text-sm">{credentialsPopup.tempPassword}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    copyToClipboard(
                                        `Username: ${credentialsPopup.username}\nTemporary Password: ${credentialsPopup.tempPassword}`,
                                        'Credentials'
                                    );
                                    setCredentialsPopup(null);
                                }}
                                className="w-full btn-primary-blue py-3 rounded-xl font-bold"
                            >
                                Copy &amp; Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
