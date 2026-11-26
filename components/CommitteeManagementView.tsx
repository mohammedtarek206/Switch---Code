'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FiShield, FiUsers, FiCheckSquare, FiCalendar, FiBell, FiSettings,
    FiMessageSquare, FiTarget, FiCheckCircle, FiAlertCircle, FiPrinter, FiLayers
} from 'react-icons/fi';
import DashboardShell from './DashboardShell';

const PERM_LABELS: Record<string, string> = {
    create_tasks: 'إنشاء المهام',
    assign_tasks: 'توزيع المهام على الأعضاء',
    review_tasks: 'مراجعة واعتماد التسليمات',
    manage_attendance: 'إدارة الحضور والغياب',
    publish_announcements: 'نشر إعلانات اللجنة',
    manage_meetings: 'تنظيم وإدارة الاجتماعات',
    view_reports: 'الاطلاع على تقارير الأداء',
    edit_members: 'تعديل بيانات وتوصيات الأعضاء',
};

interface ManagementPayload {
    committee: {
        _id: string;
        name: string;
        description: string;
        dashboardType?: string;
        leaderId?: { _id: string; name: string };
        viceLeaderId?: { _id: string; name: string };
        actingHeadId?: { _id: string; name: string };
        viceHeadPermissions?: string[];
        monthlyObjectives?: Array<{ _id: string; title: string; progress: number; status: string }>;
        managementNotes?: Array<{
            _id: string;
            content: string;
            createdAt: string;
            authorId?: { name: string; role: string };
            targetMemberId?: { name: string };
        }>;
    };
    mgmtRole: 'admin' | 'head' | 'acting_head' | 'vice_head';
    effectivePermissions: string[];
    allAvailablePermissions: string[];
    allCommittees?: Array<{ _id: string; name: string }>;
    overview: {
        totalMembers: number;
        activeMembers: number;
        inactiveMembers: number;
        totalTasks: number;
        completedTasks: number;
        pendingReviewTasks: number;
        overdueTasks: number;
        completionRate: number;
        attendanceRate: number;
        presentCount: number;
        lateCount: number;
        absentCount: number;
    };
    members: Array<{
        _id: string;
        status: string;
        position: string;
        userId?: { _id: string; name: string; email: string; performanceScore?: number };
    }>;
    meetings: Array<{ _id: string; title: string; date: string; time: string; location: string; meetLink?: string }>;
    announcements: Array<{ _id: string; title: string; body: string; createdAt: string }>;
}

export default function CommitteeManagementView({ mode }: { mode: 'head' | 'vice_head' }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [data, setData] = useState<ManagementPayload | null>(null);
    const [selectedCommitteeId, setSelectedCommitteeId] = useState('');

    const [tab, setTab] = useState<'overview' | 'members' | 'collaboration' | 'operations' | 'permissions'>('overview');

    const [vicePermsDraft, setVicePermsDraft] = useState<string[]>([]);
    const [noteText, setNoteText] = useState('');
    const [objectiveTitle, setObjectiveTitle] = useState('');
    const [meetingForm, setMeetingForm] = useState({ title: '', date: '', time: '19:00', location: 'Online', meetLink: '' });
    const [annForm, setAnnForm] = useState({ title: '', body: '' });
    const [recommendDraft, setRecommendDraft] = useState<Record<string, string>>({});

    async function loadData(commId?: string) {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        try {
            const q = commId ? `?committeeId=${commId}` : '';
            const res = await fetch(`/api/committee/management${q}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error || 'غير مصرح لك بالوصول إلى لوحة الإدارة.');
                return;
            }
            setData(json);
            setSelectedCommitteeId(json.committee?._id || '');
            setVicePermsDraft(json.committee?.viceHeadPermissions || []);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    async function postAction(payload: Record<string, unknown>) {
        setMsg('');
        setError('');
        const token = localStorage.getItem('token');
        if (!token || !data?.committee?._id) return;

        const res = await fetch('/api/committee/management', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ...payload, committeeId: data.committee._id }),
        });
        const json = await res.json();
        if (!res.ok) {
            setError(json.error || 'فشل تنفيذ الإجراء');
            return;
        }
        setMsg(json.message || 'تم الحفظ بنجاح');
        await loadData(selectedCommitteeId);
    }

    const title = mode === 'head' ? 'Committee Head Dashboard' : 'Committee Vice Head Dashboard';
    const isHeadOrAdmin = ['head', 'acting_head', 'admin'].includes(data?.mgmtRole || '');
    const perms = data?.effectivePermissions || [];

    return (
        <DashboardShell title={data?.committee ? `${data.committee.name} – ${title}` : title}>
            {loading ? (
                <div className="py-20 text-center text-slate-400">جاري تحميل لوحة القيادة...</div>
            ) : !data ? (
                <div className="max-w-lg mx-auto glass-panel rounded-2xl p-6 text-center text-red-400 text-sm">
                    {error || 'لا يمكن الوصول لهذه الصفحة.'}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Admin committee selector */}
                    {data.mgmtRole === 'admin' && data.allCommittees && data.allCommittees.length > 0 && (
                        <div className="glass-panel rounded-2xl p-4 border border-gold/30 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs font-bold text-gold">Admin Supervision – استعراض لوحة قيادة لجنة:</span>
                            <select
                                value={selectedCommitteeId}
                                onChange={(e) => loadData(e.target.value)}
                                className="px-4 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs font-bold"
                            >
                                {data.allCommittees.map((c) => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Header Banner */}
                    <div className="glass-panel rounded-3xl p-6 border border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gold/20 text-gold uppercase">
                                    {data.mgmtRole}
                                </span>
                                <span className="text-xs text-blue-300">
                                    Head: {data.committee.leaderId?.name || 'غير معيّن'}
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-white mt-1">{data.committee.name}</h2>
                            <p className="text-xs text-slate-400 mt-1">{data.committee.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/dashboard/committee"
                                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
                            >
                                <FiLayers /> المهام وأدوات اللجنة التخصصية
                            </Link>
                            {perms.includes('view_reports') && (
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                                >
                                    <FiPrinter /> طباعة تقرير PDF
                                </button>
                            )}
                        </div>
                    </div>

                    {msg && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                            <FiCheckCircle /> {msg}
                        </div>
                    )}
                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                            <FiAlertCircle /> {error}
                        </div>
                    )}

                    {/* Overview Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-[11px] text-slate-400">Active / Total Members</div>
                            <div className="text-xl font-black text-white mt-1">
                                {data.overview.activeMembers} / {data.overview.totalMembers}
                            </div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-[11px] text-slate-400">Attendance Rate</div>
                            <div className="text-xl font-black text-emerald-400 mt-1">{data.overview.attendanceRate}%</div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-[11px] text-slate-400">Completed Tasks</div>
                            <div className="text-xl font-black text-blue-400 mt-1">
                                {data.overview.completedTasks}/{data.overview.totalTasks}
                            </div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-[11px] text-slate-400">Pending Reviews</div>
                            <div className="text-xl font-black text-gold mt-1">{data.overview.pendingReviewTasks}</div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-[11px] text-slate-400">Overdue Tasks</div>
                            <div className="text-xl font-black text-red-400 mt-1">{data.overview.overdueTasks}</div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-[11px] text-slate-400">Completion Rate</div>
                            <div className="text-xl font-black text-purple-400 mt-1">{data.overview.completionRate}%</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
                        {[
                            { id: 'overview', label: 'الاجتماعات والإعلانات', icon: FiCalendar },
                            { id: 'members', label: `إدارة الأعضاء (${data.members.length})`, icon: FiUsers },
                            { id: 'collaboration', label: 'مساحة التعاون والأهداف', icon: FiMessageSquare },
                            ...(isHeadOrAdmin ? [{ id: 'permissions', label: 'صلاحيات Vice Head والتفويض', icon: FiSettings }] : []),
                        ].map((t) => {
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setTab(t.id as typeof tab)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
                                        tab === t.id ? 'bg-blue-600 text-white' : 'bg-[#0B1220] text-slate-300 border border-white/10'
                                    }`}
                                >
                                    <Icon /> {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* TAB: OVERVIEW (Meetings & Announcements) */}
                    {tab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Meetings */}
                            <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                    <FiCalendar className="text-blue-400" /> اجتماعات اللجنة
                                </h3>
                                {perms.includes('manage_meetings') ? (
                                    <div className="space-y-2 p-3 rounded-xl bg-[#0B1220] border border-white/10">
                                        <input
                                            type="text"
                                            placeholder="عنوان الاجتماع"
                                            value={meetingForm.title}
                                            onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                                        />
                                        <div className="grid grid-cols-3 gap-2">
                                            <input
                                                type="date"
                                                value={meetingForm.date}
                                                onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                                                className="px-2 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                                            />
                                            <input
                                                type="time"
                                                value={meetingForm.time}
                                                onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                                                className="px-2 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                                            />
                                            <input
                                                type="text"
                                                placeholder="المكان / Online"
                                                value={meetingForm.location}
                                                onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                                                className="px-2 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            disabled={!meetingForm.title}
                                            onClick={() => {
                                                postAction({ action: 'create_meeting', ...meetingForm });
                                                setMeetingForm({ title: '', date: '', time: '19:00', location: 'Online', meetLink: '' });
                                            }}
                                            className="btn-primary-blue px-4 py-2 text-xs disabled:opacity-50"
                                        >
                                            إنشاء اجتماع وإبلاغ الأعضاء
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-amber-300">ليس لديك صلاحية إنشاء الاجتماعات حالياً.</p>
                                )}

                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {data.meetings.map((m) => (
                                        <div key={m._id} className="p-3 rounded-xl bg-[#0B1220] text-xs flex justify-between">
                                            <div>
                                                <div className="font-bold text-white">{m.title}</div>
                                                <div className="text-slate-400">{m.location} • {m.time}</div>
                                            </div>
                                            <span className="text-blue-300">{new Date(m.date).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Internal Announcements */}
                            <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                    <FiBell className="text-gold" /> إعلانات اللجنة الداخلية
                                </h3>
                                {perms.includes('publish_announcements') ? (
                                    <div className="space-y-2 p-3 rounded-xl bg-[#0B1220] border border-white/10">
                                        <input
                                            type="text"
                                            placeholder="عنوان الإعلان"
                                            value={annForm.title}
                                            onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                                        />
                                        <textarea
                                            rows={2}
                                            placeholder="نص الإعلان..."
                                            value={annForm.body}
                                            onChange={(e) => setAnnForm({ ...annForm, body: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                                        />
                                        <button
                                            type="button"
                                            disabled={!annForm.title || !annForm.body}
                                            onClick={() => {
                                                postAction({ action: 'create_announcement', ...annForm });
                                                setAnnForm({ title: '', body: '' });
                                            }}
                                            className="btn-primary-blue px-4 py-2 text-xs disabled:opacity-50"
                                        >
                                            نشر الإعلان
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-amber-300">ليس لديك صلاحية نشر الإعلانات حالياً.</p>
                                )}

                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {data.announcements.map((a) => (
                                        <div key={a._id} className="p-3 rounded-xl bg-[#0B1220] text-xs">
                                            <div className="font-bold text-gold">{a.title}</div>
                                            <div className="text-slate-300 mt-1">{a.body}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: MEMBERS MANAGEMENT */}
                    {tab === 'members' && (
                        <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
                            {data.members.map((m) => {
                                const uid = m.userId?._id || '';
                                return (
                                    <div key={m._id} className="p-4 rounded-xl bg-[#0B1220] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div>
                                            <div className="font-bold text-white text-sm">
                                                {m.userId?.name} <span className="text-xs text-gold">[{m.position}]</span>
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {m.userId?.email} • Score: {m.userId?.performanceScore || 0}
                                            </div>
                                        </div>
                                        {perms.includes('edit_members') && (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="توصية بترقية أو نقل للإدارة..."
                                                    value={recommendDraft[uid] || ''}
                                                    onChange={(e) => setRecommendDraft((p) => ({ ...p, [uid]: e.target.value }))}
                                                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!recommendDraft[uid]?.trim()) return;
                                                        postAction({
                                                            action: 'recommend_member',
                                                            memberId: uid,
                                                            memberName: m.userId?.name,
                                                            recommendation: recommendDraft[uid],
                                                        });
                                                        setRecommendDraft((p) => ({ ...p, [uid]: '' }));
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold"
                                                >
                                                    إرسال توصية
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* TAB: SHARED HEAD & VICE HEAD COLLABORATION */}
                    {tab === 'collaboration' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Sensitive Management Notes */}
                            <div className="glass-panel rounded-2xl p-5 border border-purple-500/20 space-y-4">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                    <FiShield className="text-purple-400" /> ملاحظات الإدارة السرية (Head & Vice Head Only)
                                </h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="اكتب ملاحظة إدارية داخلية..."
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!noteText.trim()) return;
                                            postAction({ action: 'add_management_note', content: noteText });
                                            setNoteText('');
                                        }}
                                        className="btn-primary-blue px-4 py-2 text-xs"
                                    >
                                        حفظ
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {(data.committee.managementNotes || []).map((n) => (
                                        <div key={n._id} className="p-3 rounded-xl bg-[#0B1220] text-xs">
                                            <div className="font-bold text-purple-300">
                                                {n.authorId?.name || 'Leader'} ({new Date(n.createdAt).toLocaleDateString('ar-EG')})
                                            </div>
                                            <div className="text-slate-200 mt-1">{n.content}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Monthly Objectives */}
                            <div className="glass-panel rounded-2xl p-5 border border-blue-500/20 space-y-4">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                    <FiTarget className="text-gold" /> الأهداف الشهرية للجنة (Monthly Objectives)
                                </h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="أضف هدفاً شهرياً..."
                                        value={objectiveTitle}
                                        onChange={(e) => setObjectiveTitle(e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!objectiveTitle.trim()) return;
                                            postAction({ action: 'add_objective', title: objectiveTitle });
                                            setObjectiveTitle('');
                                        }}
                                        className="btn-primary-blue px-4 py-2 text-xs"
                                    >
                                        إضافة
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {(data.committee.monthlyObjectives || []).map((o) => (
                                        <div key={o._id} className="p-3 rounded-xl bg-[#0B1220] text-xs flex justify-between">
                                            <span className="font-bold text-white">{o.title}</span>
                                            <span className="text-gold">{o.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: VICE HEAD PERMISSIONS & ACTING HEAD (HEAD & ADMIN ONLY) */}
                    {tab === 'permissions' && isHeadOrAdmin && (
                        <div className="glass-panel rounded-2xl p-6 border border-gold/30 space-y-5">
                            <div>
                                <h3 className="font-bold text-white text-base">صلاحيات نائب رئيس اللجنة (Delegated Vice Head Permissions)</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    حدد بدقة الصلاحيات التشغيلية المسموح لنائب رئيس اللجنة باستخدامها داخل هذه اللجنة.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {data.allAvailablePermissions.map((p) => {
                                    const checked = vicePermsDraft.includes(p);
                                    return (
                                        <label key={p} className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0B1220] border border-white/10 text-xs cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                    setVicePermsDraft((prev) =>
                                                        prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                                                    )
                                                }
                                            />
                                            <span className="text-white font-semibold">{PERM_LABELS[p] || p}</span>
                                        </label>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={() => postAction({ action: 'update_vice_permissions', viceHeadPermissions: vicePermsDraft })}
                                className="btn-primary-blue px-6 py-2.5 text-xs"
                            >
                                حفظ صلاحيات نائب الرئيس
                            </button>

                            <div className="pt-4 border-t border-white/10">
                                <label className="block text-xs font-bold text-slate-300 mb-2">
                                    تفويض قائم بأعمال رئيس اللجنة مؤقتاً (Acting Head)
                                </label>
                                <select
                                    defaultValue={data.committee.actingHeadId?._id || ''}
                                    onChange={(e) => postAction({ action: 'assign_acting_head', actingHeadId: e.target.value || null })}
                                    className="w-full md:w-80 px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                >
                                    <option value="">-- لا يوجد (الرئيس الأصلي فقط) --</option>
                                    {data.members.map((m) => (
                                        <option key={m._id} value={m.userId?._id || ''}>
                                            {m.userId?.name} ({m.position})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </DashboardShell>
    );
}
