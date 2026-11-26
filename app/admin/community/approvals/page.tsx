'use client';

import { useEffect, useState } from 'react';
import { FiCheckCircle, FiXCircle, FiUserCheck, FiClock } from 'react-icons/fi';
import { formatGoogleDriveImageUrl } from '@/lib/googleDrive';

interface PendingInstructor {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    university?: string;
    experienceYears?: number;
    skills?: string[];
    requestedTracks: { trackId?: { _id: string; name: string } }[];
}

interface PendingStudent {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    accountStatus: string;
    createdAt: string;
}

export default function AdminApprovalsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Record<string, number>>({});
    const [pendingInstructors, setPendingInstructors] = useState<PendingInstructor[]>([]);
    const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
    const [directPublishMap, setDirectPublishMap] = useState<Record<string, boolean>>({});
    const [msg, setMsg] = useState('');

    async function loadData() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/admin/users/review', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats || {});
                setPendingInstructors(data.pendingInstructors || []);
                setPendingStudents(data.pendingStudents || []);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    async function handleAction(
        userId: string,
        action: 'approve_instructor' | 'reject_instructor' | 'approve_user' | 'reject_user',
        trackIds?: string[]
    ) {
        const token = localStorage.getItem('token');
        if (!token) return;
        setMsg('');
        const res = await fetch('/api/admin/users/review', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                userId,
                action,
                trackIds,
                canPublishDirectly: Boolean(directPublishMap[userId]),
            }),
        });
        const data = await res.json();
        if (res.ok) {
            setMsg(data.message || 'تم تنفيذ القرار');
            await loadData();
        }
    }

    if (loading) return <div className="p-8 text-slate-400">جاري تحميل طلبات المراجعة...</div>;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                    <FiUserCheck className="text-gold" /> Pending Registrations & Approvals
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                    مراجعة واعتماد المحاضرين والطلاب الجدد وإحصائيات المجتمع الحقيقية
                </p>
            </div>

            {msg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                    {msg}
                </div>
            )}

            {/* Real DB Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Total Users', val: stats.totalUsers },
                    { label: 'Students', val: stats.totalStudents },
                    { label: 'Active Instructors', val: stats.totalInstructors },
                    { label: 'Pending Instructors', val: stats.pendingInstructorApps },
                    { label: 'Pending Committee Apps', val: stats.pendingCommitteeApps },
                    { label: 'Active Committees', val: stats.activeCommittees },
                ].map((s) => (
                    <div key={s.label} className="glass-card rounded-2xl p-4">
                        <div className="text-[11px] text-slate-400">{s.label}</div>
                        <div className="text-xl font-black text-white mt-1">{s.val ?? 0}</div>
                    </div>
                ))}
            </div>

            {/* Pending Instructors */}
            <div className="glass-panel rounded-2xl p-5 border border-blue-500/20 space-y-4">
                <h2 className="font-bold text-white text-sm flex items-center gap-2">
                    <FiClock className="text-gold" /> Pending Instructors ({pendingInstructors.length})
                </h2>
                {pendingInstructors.length === 0 ? (
                    <p className="text-xs text-slate-400">لا توجد طلبات محاضرين قيد المراجعة.</p>
                ) : (
                    <div className="space-y-3">
                        {pendingInstructors.map((inst) => {
                            const requestedIds = inst.requestedTracks
                                .map((t) => t.trackId?._id)
                                .filter(Boolean) as string[];
                            return (
                                <div key={inst._id} className="p-4 rounded-xl bg-[#0B1220] border border-white/10 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            {inst.avatar ? (
                                                <img
                                                    src={formatGoogleDriveImageUrl(inst.avatar)}
                                                    alt={inst.name}
                                                    className="w-12 h-12 rounded-full object-cover border border-gold"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center font-bold text-blue-300">
                                                    {inst.name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold text-white text-sm">{inst.name}</div>
                                                <div className="text-xs text-slate-400">
                                                    {inst.email} • {inst.phone} • {inst.university} ({inst.experienceYears || 0} yrs)
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                    {inst.requestedTracks.map((rt, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[11px]">
                                                            {rt.trackId?.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <label className="flex items-center gap-1.5 text-xs text-slate-300 mr-2">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(directPublishMap[inst._id])}
                                                    onChange={(e) =>
                                                        setDirectPublishMap((p) => ({ ...p, [inst._id]: e.target.checked }))
                                                    }
                                                />
                                                نشر مباشر
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => handleAction(inst._id, 'approve_instructor', requestedIds)}
                                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1"
                                            >
                                                <FiCheckCircle /> قبول وتعيين
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleAction(inst._id, 'reject_instructor')}
                                                className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold inline-flex items-center gap-1"
                                            >
                                                <FiXCircle /> رفض
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pending Students */}
            <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
                <h2 className="font-bold text-white text-sm">Pending Students ({pendingStudents.length})</h2>
                {pendingStudents.length === 0 ? (
                    <p className="text-xs text-slate-400">لا يوجد طلاب بانتظار التفعيل.</p>
                ) : (
                    pendingStudents.map((st) => (
                        <div key={st._id} className="p-3 rounded-xl bg-[#0B1220] border border-white/10 flex items-center justify-between text-xs">
                            <div>
                                <span className="font-bold text-white">{st.name}</span> — {st.email} ({st.accountStatus})
                            </div>
                            <button
                                type="button"
                                onClick={() => handleAction(st._id, 'approve_user')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
                            >
                                تفعيل
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
