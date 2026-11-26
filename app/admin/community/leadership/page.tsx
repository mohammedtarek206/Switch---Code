'use client';

import { useEffect, useState } from 'react';
import { FiAward, FiUsers, FiRefreshCw, FiUserPlus, FiTrash2, FiClock, FiCheckCircle } from 'react-icons/fi';

interface CommitteeItem {
    _id: string;
    name: string;
    type: string;
    registrationOpen?: boolean;
    availableForRegistration?: boolean;
    maxMembers?: number;
    currentMemberCount?: number;
    displayOrder?: number;
    leaderId?: { _id: string; name: string; email: string };
    viceLeaderId?: { _id: string; name: string; email: string };
}

interface MemberItem {
    _id: string;
    committeeId: string;
    position: string;
    userId?: { _id: string; name: string; email: string; role: string };
}

interface EligibleUser {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface HistoryItem {
    _id: string;
    action: string;
    previousRole?: string;
    newRole: string;
    createdAt: string;
    committeeId?: { name: string };
    userId?: { name: string };
    changedBy?: { name: string };
}

export default function CommitteeLeadershipPage() {
    const [loading, setLoading] = useState(true);
    const [committees, setCommittees] = useState<CommitteeItem[]>([]);
    const [members, setMembers] = useState<MemberItem[]>([]);
    const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedCommitteeId, setSelectedCommitteeId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [transferCommitteeId, setTransferCommitteeId] = useState('');
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    async function loadData() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/admin/committees/leadership', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setCommittees(data.committees || []);
                setMembers(data.members || []);
                setEligibleUsers(data.eligibleUsers || []);
                setHistory(data.history || []);
                if (!selectedCommitteeId && data.committees?.length > 0) {
                    setSelectedCommitteeId(data.committees[0]._id);
                }
            } else {
                setError(data.error || 'فشل تحميل البيانات');
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    async function performAction(action: string, userId: string, extra?: { targetCommitteeId?: string }) {
        setMsg('');
        setError('');
        const token = localStorage.getItem('token');
        if (!token || !selectedCommitteeId || !userId) return;

        const res = await fetch('/api/admin/committees/leadership', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                committeeId: selectedCommitteeId,
                userId,
                action,
                ...extra,
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || 'فشل تنفيذ الإجراء');
            return;
        }
        setMsg(data.message || 'تم التحديث بنجاح');
        await loadData();
    }

    async function updateCommitteePolicy(committee: CommitteeItem, patch: Record<string, unknown>) {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`/api/community/committees/${committee._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(patch),
        });
        if (res.ok) {
            setMsg('تم تحديث إعدادات التسجيل للجنة بنجاح.');
            await loadData();
        }
    }

    const activeCommittee = committees.find((c) => c._id === selectedCommitteeId);
    const committeeMembers = members.filter((m) => m.committeeId === selectedCommitteeId);

    if (loading) {
        return <div className="p-8 text-slate-400">جاري تحميل بيانات قيادة اللجان...</div>;
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <FiAward className="text-gold" /> Committee Leadership Management
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        تعيين وتغيير Head و Vice Head وإدارة أعضاء اللجان وسجل التغييرات الإدارية
                    </p>
                </div>
                <button
                    type="button"
                    onClick={loadData}
                    className="px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold inline-flex items-center gap-1.5"
                >
                    <FiRefreshCw /> تحديث
                </button>
            </div>

            {msg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <FiCheckCircle /> {msg}
                </div>
            )}
            {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    {error}
                </div>
            )}

            {/* Committee Selector */}
            <div className="glass-panel rounded-2xl p-5 border border-blue-500/20 space-y-4">
                <label className="block text-xs font-bold text-slate-300">اختر اللجنة</label>
                <select
                    value={selectedCommitteeId}
                    onChange={(e) => setSelectedCommitteeId(e.target.value)}
                    className="w-full md:w-96 px-4 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                >
                    {committees.map((c) => (
                        <option key={c._id} value={c._id}>
                            {c.name}
                        </option>
                    ))}
                </select>

                {activeCommittee && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 rounded-xl bg-[#0B1220] border border-gold/30">
                            <div className="text-[11px] text-gold font-bold uppercase">Committee Head</div>
                            <div className="text-base font-extrabold text-white mt-1">
                                {activeCommittee.leaderId?.name || 'غير معيّن'}
                            </div>
                            <div className="text-xs text-slate-400">{activeCommittee.leaderId?.email || ''}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-[#0B1220] border border-blue-500/30">
                            <div className="text-[11px] text-blue-400 font-bold uppercase">Vice Head</div>
                            <div className="text-base font-extrabold text-white mt-1">
                                {activeCommittee.viceLeaderId?.name || 'غير معيّن'}
                            </div>
                            <div className="text-xs text-slate-400">{activeCommittee.viceLeaderId?.email || ''}</div>
                        </div>
                        <div className="md:col-span-2 p-4 rounded-xl bg-[#0B1220] border border-white/10 flex flex-wrap items-center justify-between gap-4">
                            <div className="text-xs text-slate-300">
                                <span className="font-bold text-white">حالة التسجيل المباشر: </span>
                                <span className={activeCommittee.registrationOpen !== false ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                    {activeCommittee.registrationOpen !== false ? 'مفتوح (Open)' : 'مغلق (Closed)'}
                                </span>
                                {typeof activeCommittee.maxMembers === 'number' && (
                                    <span className="text-slate-400 ml-3">
                                        ({activeCommittee.currentMemberCount || 0} / {activeCommittee.maxMembers} عضو)
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateCommitteePolicy(activeCommittee, {
                                            registrationOpen: activeCommittee.registrationOpen === false,
                                            availableForRegistration: activeCommittee.registrationOpen === false,
                                        })
                                    }
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                                        activeCommittee.registrationOpen !== false
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'bg-emerald-600 text-white'
                                    }`}
                                >
                                    {activeCommittee.registrationOpen !== false ? 'إغلاق التسجيل' : 'فتح التسجيل'}
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="الحد الأقصى للأعضاء"
                                    defaultValue={activeCommittee.maxMembers || ''}
                                    onBlur={(e) => {
                                        const val = e.target.value ? Number(e.target.value) : null;
                                        updateCommitteePolicy(activeCommittee, { maxMembers: val });
                                    }}
                                    className="w-40 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Assign Leader / Vice / Add Member */}
            <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
                <h2 className="font-bold text-white text-sm flex items-center gap-2">
                    <FiUserPlus className="text-blue-400" /> تعيين قيادة أو إضافة عضو للجنة
                </h2>
                <div className="flex flex-col md:flex-row gap-3">
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                    >
                        <option value="">-- اختر العضو / المستخدم --</option>
                        {eligibleUsers.map((u) => (
                            <option key={u._id} value={u._id}>
                                {u.name} ({u.email}) – {u.role}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        disabled={!selectedUserId}
                        onClick={() => performAction('assign_head', selectedUserId)}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold disabled:opacity-50"
                    >
                        تعيين كـ Head
                    </button>
                    <button
                        type="button"
                        disabled={!selectedUserId}
                        onClick={() => performAction('assign_vice_head', selectedUserId)}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-50"
                    >
                        تعيين كـ Vice Head
                    </button>
                    <button
                        type="button"
                        disabled={!selectedUserId}
                        onClick={() => performAction('add_member', selectedUserId)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50"
                    >
                        إضافة كعضو
                    </button>
                </div>
            </div>

            {/* Committee Members */}
            <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
                <h2 className="font-bold text-white text-sm flex items-center gap-2">
                    <FiUsers className="text-emerald-400" /> أعضاء اللجنة ({committeeMembers.length})
                </h2>
                {committeeMembers.length === 0 ? (
                    <p className="text-xs text-slate-400">لا يوجد أعضاء مسجلون في هذه اللجنة حالياً.</p>
                ) : (
                    <div className="space-y-2">
                        {committeeMembers.map((m) => {
                            const uid = m.userId?._id || '';
                            return (
                                <div
                                    key={m._id}
                                    className="p-3.5 rounded-xl bg-[#0B1220] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3"
                                >
                                    <div>
                                        <div className="font-bold text-sm text-white">
                                            {m.userId?.name}{' '}
                                            <span className="text-xs text-gold ml-2">[{m.position}]</span>
                                        </div>
                                        <div className="text-xs text-slate-400">{m.userId?.email}</div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => performAction('assign_head', uid)}
                                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-gold text-xs font-bold"
                                        >
                                            ترقية لـ Head
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => performAction('assign_vice_head', uid)}
                                            className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-bold"
                                        >
                                            ترقية لـ Vice
                                        </button>
                                        <select
                                            value={transferCommitteeId}
                                            onChange={(e) => setTransferCommitteeId(e.target.value)}
                                            className="px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                                        >
                                            <option value="">نقل إلى لجنة...</option>
                                            {committees
                                                .filter((c) => c._id !== selectedCommitteeId)
                                                .map((c) => (
                                                    <option key={c._id} value={c._id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                        </select>
                                        {transferCommitteeId && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    performAction('transfer_member', uid, {
                                                        targetCommitteeId: transferCommitteeId,
                                                    })
                                                }
                                                className="px-2.5 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold"
                                            >
                                                نقل
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => performAction('remove_member', uid)}
                                            className="px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold inline-flex items-center gap-1"
                                        >
                                            <FiTrash2 /> إزالة
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Leadership History */}
            <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
                <h2 className="font-bold text-white text-sm flex items-center gap-2">
                    <FiClock className="text-purple-400" /> سجل التغييرات الإدارية (Leadership History)
                </h2>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                    {history.length === 0 ? (
                        <p className="text-xs text-slate-400">لا توجد تغييرات مسجلة بعد.</p>
                    ) : (
                        history.map((h) => (
                            <div key={h._id} className="p-3 rounded-xl bg-[#0B1220] border border-white/5 text-xs flex flex-wrap justify-between gap-2">
                                <span>
                                    <strong className="text-gold">{h.action}</strong> — {h.userId?.name} في{' '}
                                    <span className="text-blue-300">{h.committeeId?.name}</span> (بواسطة {h.changedBy?.name})
                                </span>
                                <span className="text-slate-500">{new Date(h.createdAt).toLocaleString('ar-EG')}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
