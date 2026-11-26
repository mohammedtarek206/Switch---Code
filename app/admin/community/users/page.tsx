'use client';

import { useEffect, useState } from 'react';
import {
    FiUsers, FiSearch, FiShield, FiPauseCircle, FiPlayCircle,
    FiCheckCircle, FiRefreshCw
} from 'react-icons/fi';
import { formatGoogleDriveImageUrl } from '@/lib/googleDrive';

interface UserRow {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
    roles?: string[];
    accountStatus: string;
    isActive: boolean;
    avatar?: string;
    committeeId?: { _id: string; name: string };
    createdAt: string;
}

const ASSIGNABLE_ROLES = [
    { id: 'student', label: 'Student' },
    { id: 'instructor', label: 'Instructor' },
    { id: 'member', label: 'Committee Member' },
    { id: 'committee_leader', label: 'Committee Head' },
    { id: 'vice_committee_leader', label: 'Vice Head' },
    { id: 'hr', label: 'HR' },
    { id: 'pr', label: 'PR' },
];

export default function AdminUsersManagementPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Record<string, number>>({});
    const [users, setUsers] = useState<UserRow[]>([]);
    const [committees, setCommittees] = useState<Array<{ _id: string; name: string }>>([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [msg, setMsg] = useState('');
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [transferCommId, setTransferCommId] = useState('');

    async function loadUsers() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/admin/users/manage', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats || {});
                setUsers(data.users || []);
                setCommittees(data.committees || []);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    async function runAction(payload: Record<string, unknown>) {
        const token = localStorage.getItem('token');
        if (!token) return;
        setMsg('');
        const res = await fetch('/api/admin/users/manage', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
            setMsg(data.message || 'تم التحديث بنجاح');
            setEditingUser(null);
            await loadUsers();
        }
    }

    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            !search.trim() ||
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()) ||
            u.phone?.includes(search);
        const userAllRoles = [u.role, ...(u.roles || [])];
        const matchesRole = roleFilter === 'all' || userAllRoles.includes(roleFilter);
        return matchesSearch && matchesRole;
    });

    if (loading) return <div className="p-8 text-slate-400">جاري تحميل إدارة المستخدمين...</div>;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <FiUsers className="text-gold" /> Users Management
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        جميع الحسابات تظهر فور إنشائها – إدارة الأدوار المتعددة، اللجان، والحالة
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(stats.legacyPendingCount || 0) > 0 && (
                        <button
                            type="button"
                            onClick={() => runAction({ action: 'activate_legacy_pending' })}
                            className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                        >
                            تفعيل الحسابات المعلقة القديمة ({stats.legacyPendingCount})
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={loadUsers}
                        className="px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold inline-flex items-center gap-1.5"
                    >
                        <FiRefreshCw /> تحديث
                    </button>
                </div>
            </div>

            {msg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <FiCheckCircle /> {msg}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                    { label: 'Total Users', val: stats.totalUsers },
                    { label: 'Students', val: stats.students },
                    { label: 'Instructors', val: stats.instructors },
                    { label: 'Committee Members', val: stats.committeeMembers },
                    { label: 'Heads & Vice', val: (stats.committeeHeads || 0) + (stats.committeeViceHeads || 0) },
                    { label: 'Active Accounts', val: stats.activeAccounts },
                    { label: 'Suspended', val: stats.suspendedAccounts },
                    { label: 'New (7 days)', val: stats.newRegistrations },
                ].map((s) => (
                    <div key={s.label} className="glass-card rounded-2xl p-4">
                        <div className="text-[11px] text-slate-400">{s.label}</div>
                        <div className="text-xl font-black text-white mt-1">{s.val ?? 0}</div>
                    </div>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="بحث بالاسم أو البريد أو الهاتف..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                >
                    <option value="all">جميع الأدوار</option>
                    <option value="student">Students</option>
                    <option value="instructor">Instructors</option>
                    <option value="member">Committee Members</option>
                    <option value="committee_leader">Committee Heads</option>
                    <option value="vice_committee_leader">Vice Heads</option>
                    <option value="hr">HR</option>
                    <option value="pr">PR</option>
                    <option value="admin">Admins</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-white/10 text-slate-400">
                            <th className="py-3 px-4">User</th>
                            <th className="py-3 px-4">Roles</th>
                            <th className="py-3 px-4">Committee</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((u) => {
                            const rolesList = Array.from(new Set([u.role, ...(u.roles || [])].filter(Boolean)));
                            return (
                                <tr key={u._id} className="hover:bg-white/[0.02]">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2.5">
                                            {u.avatar ? (
                                                <img
                                                    src={formatGoogleDriveImageUrl(u.avatar)}
                                                    alt={u.name}
                                                    className="w-8 h-8 rounded-full object-cover border border-gold/50"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center font-bold text-blue-300">
                                                    {u.name?.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold text-white">{u.name}</div>
                                                <div className="text-[11px] text-slate-400">{u.email} • {u.phone || '-'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-wrap gap-1">
                                            {rolesList.map((r) => (
                                                <span key={r} className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                                                    {r}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-slate-300">{u.committeeId?.name || '-'}</td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`px-2 py-0.5 rounded-full font-bold ${
                                                u.isActive !== false && u.accountStatus !== 'suspended'
                                                    ? 'bg-emerald-500/20 text-emerald-300'
                                                    : 'bg-red-500/20 text-red-300'
                                            }`}
                                        >
                                            {u.accountStatus === 'suspended' || u.isActive === false ? 'Suspended' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingUser(u);
                                                    setSelectedRoles(rolesList);
                                                    setTransferCommId(u.committeeId?._id || '');
                                                }}
                                                className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 font-bold inline-flex items-center gap-1"
                                            >
                                                <FiShield /> إدارة
                                            </button>
                                            {u.isActive !== false && u.accountStatus !== 'suspended' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => runAction({ action: 'suspend', userId: u._id })}
                                                    className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 font-bold inline-flex items-center gap-1"
                                                >
                                                    <FiPauseCircle /> إيقاف
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => runAction({ action: 'reactivate', userId: u._id })}
                                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold inline-flex items-center gap-1"
                                                >
                                                    <FiPlayCircle /> تفعيل
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="max-w-lg w-full glass-panel rounded-3xl p-6 border border-blue-500/30 space-y-5">
                        <div className="flex justify-between items-center">
                            <h3 className="font-extrabold text-white text-base">إدارة حساب: {editingUser.name}</h3>
                            <button
                                type="button"
                                onClick={() => setEditingUser(null)}
                                className="text-xs text-slate-400 hover:text-white"
                            >
                                إغلاق
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-2">
                                تعيين الأدوار (يدعم أكثر من دور)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {ASSIGNABLE_ROLES.map((r) => {
                                    const checked = selectedRoles.includes(r.id);
                                    return (
                                        <label key={r.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-xs cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                    setSelectedRoles((prev) =>
                                                        prev.includes(r.id) ? prev.filter((x) => x !== r.id) : [...prev, r.id]
                                                    )
                                                }
                                            />
                                            <span>{r.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    runAction({
                                        action: 'update_roles',
                                        userId: editingUser._id,
                                        roles: selectedRoles,
                                        primaryRole: selectedRoles[0],
                                    })
                                }
                                className="mt-3 btn-primary-blue px-4 py-2 text-xs"
                            >
                                حفظ الأدوار
                            </button>
                        </div>

                        <div className="pt-3 border-t border-white/10">
                            <label className="block text-xs font-bold text-slate-300 mb-2">نقل / تعيين لجنة</label>
                            <div className="flex gap-2">
                                <select
                                    value={transferCommId}
                                    onChange={(e) => setTransferCommId(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                >
                                    <option value="">-- اختر اللجنة --</option>
                                    {committees.map((c) => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    disabled={!transferCommId}
                                    onClick={() =>
                                        runAction({
                                            action: 'transfer_committee',
                                            userId: editingUser._id,
                                            committeeId: transferCommId,
                                        })
                                    }
                                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold disabled:opacity-50"
                                >
                                    نقل
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
