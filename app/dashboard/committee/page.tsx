'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FiCheckSquare, FiPlus, FiSend, FiCheckCircle, FiAlertCircle,
    FiClock, FiUsers, FiBell, FiColumns, FiList, FiCalendar,
    FiBarChart2, FiDownload, FiPrinter, FiMessageSquare, FiLayers
} from 'react-icons/fi';
import DashboardShell from '@/components/DashboardShell';

interface TaskSubmission {
    _id: string;
    version: number;
    submittedBy?: { name: string };
    content?: string;
    links?: string[];
    notes?: string;
    status: string;
    feedback?: string;
    submittedAt: string;
}

interface TaskSubtask {
    _id: string;
    title: string;
    done: boolean;
}

interface TaskComment {
    _id: string;
    authorId?: { name: string };
    content: string;
    createdAt: string;
}

interface TaskItem {
    _id: string;
    title: string;
    description?: string;
    priority: string;
    status: string;
    progress?: number;
    deadline?: string;
    assignees: { _id: string; name: string }[];
    subtasks?: TaskSubtask[];
    comments?: TaskComment[];
    submissions: TaskSubmission[];
}

interface MemberItem {
    _id: string;
    userId?: { _id: string; name: string; email: string };
    position: string;
}

interface MemberPerf {
    userId: string;
    name: string;
    email: string;
    position: string;
    assignedTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
    attendanceRate: number;
}

export default function CommitteeWorkspacePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');

    const [activeTab, setActiveTab] = useState<'tasks' | 'operations' | 'analytics'>('tasks');
    const [taskView, setTaskView] = useState<'list' | 'kanban' | 'calendar'>('list');

    const [isLeader, setIsLeader] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [allCommittees, setAllCommittees] = useState<Array<{ _id: string; name: string }>>([]);
    const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>('');

    const [committee, setCommittee] = useState<{ _id: string; name: string; description: string } | null>(null);
    const [stats, setStats] = useState({
        totalMembers: 0,
        activeTasks: 0,
        completedTasks: 0,
        pendingReviews: 0,
        overdueTasks: 0,
        completionRate: 0,
    });
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [members, setMembers] = useState<MemberItem[]>([]);
    const [announcements, setAnnouncements] = useState<Array<{ _id: string; title: string; content: string }>>([]);

    // Dynamic committee module state
    const [dashboardType, setDashboardType] = useState<string>('custom');
    const [moduleData, setModuleData] = useState<Record<string, unknown>>({});

    // Analytics state
    const [analytics, setAnalytics] = useState<{ summary?: Record<string, number>; memberPerformance?: MemberPerf[] }>({});

    // Forms
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        deadline: '',
        assigneeId: '',
    });
    const [submitDraft, setSubmitDraft] = useState<Record<string, { content: string; link: string }>>({});
    const [reviewFeedback, setReviewFeedback] = useState<Record<string, string>>({});
    const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
    const [subtaskDraft, setSubtaskDraft] = useState<Record<string, string>>({});

    // Module creation forms
    const [attForm, setAttForm] = useState({ userId: '', status: 'present', notes: '' });
    const [leaveReason, setLeaveReason] = useState('');
    const [campaignForm, setCampaignForm] = useState({ title: '', platform: 'facebook', scheduledDate: '', caption: '' });
    const [logisticsForm, setLogisticsForm] = useState({ title: '', category: 'equipment', quantity: '1', estimatedCost: '0' });
    const [projectForm, setProjectForm] = useState({ name: '', githubUrl: '', docsUrl: '', description: '' });

    async function loadWorkspace(commIdParam?: string) {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        try {
            const q = commIdParam ? `?committeeId=${commIdParam}` : '';
            const res = await fetch(`/api/committee/tasks/workspace${q}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'تعذر تحميل مساحة عمل اللجنة.');
                return;
            }
            setCommittee(data.committee);
            setSelectedCommitteeId(data.committee?._id || '');
            setIsLeader(Boolean(data.isLeader));
            setIsAdmin(Boolean(data.isAdmin));
            setAllCommittees(data.allCommittees || []);
            setStats(data.stats);
            setTasks(data.tasks || []);
            setMembers(data.members || []);
            setAnnouncements(data.announcements || []);

            const cid = data.committee?._id;
            if (cid) {
                const [modRes, perfRes] = await Promise.all([
                    fetch(`/api/committee/modules?committeeId=${cid}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`/api/analytics/performance?committeeId=${cid}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                if (modRes.ok) {
                    const md = await modRes.json();
                    setDashboardType(md.dashboardType || 'custom');
                    setModuleData(md);
                }
                if (perfRes.ok) {
                    setAnalytics(await perfRes.json());
                }
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadWorkspace();
    }, []);

    async function taskPatch(payload: Record<string, unknown>) {
        setMsg('');
        setError('');
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/committee/tasks/workspace', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || 'فشل تحديث المهمة');
            return;
        }
        if (data.message) setMsg(data.message);
        await loadWorkspace(selectedCommitteeId);
    }

    async function handleCreateTask(e: React.FormEvent) {
        e.preventDefault();
        setMsg('');
        setError('');
        const token = localStorage.getItem('token');
        if (!token || !committee) return;

        const res = await fetch('/api/committee/tasks/workspace', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                committeeId: committee._id,
                title: newTask.title,
                description: newTask.description,
                priority: newTask.priority,
                deadline: newTask.deadline || undefined,
                assignees: newTask.assigneeId ? [newTask.assigneeId] : [],
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || 'فشل إنشاء المهمة');
            return;
        }
        setMsg(data.message || 'تم إنشاء المهمة');
        setNewTask({ title: '', description: '', priority: 'medium', deadline: '', assigneeId: '' });
        await loadWorkspace(selectedCommitteeId);
    }

    async function saveModuleItem(payload: Record<string, unknown>) {
        setMsg('');
        setError('');
        const token = localStorage.getItem('token');
        if (!token || !committee) return;
        const res = await fetch('/api/committee/modules', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ...payload, committeeId: committee._id }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || 'فشل الحفظ');
            return;
        }
        setMsg(data.message || 'تم الحفظ بنجاح');
        await loadWorkspace(selectedCommitteeId);
    }

    function exportCsv() {
        const rows = analytics.memberPerformance || [];
        const headers = ['Name', 'Email', 'Position', 'Assigned Tasks', 'Completed Tasks', 'Overdue', 'Completion %', 'Attendance %'];
        const csvLines = [
            headers.join(','),
            ...rows.map((r) =>
                [r.name, r.email, r.position, r.assignedTasks, r.completedTasks, r.overdueTasks, r.completionRate, r.attendanceRate]
                    .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                    .join(',')
            ),
        ];
        const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${committee?.name || 'committee'}-performance.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <DashboardShell title={committee ? `${committee.name} – Workspace` : 'Committee Workspace'}>
            {loading ? (
                <div className="text-center py-20 text-slate-400">جاري تحميل مساحة عمل اللجنة...</div>
            ) : error && !committee ? (
                <div className="max-w-lg mx-auto glass-panel rounded-2xl p-6 text-center text-red-400 text-sm">
                    {error}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Admin Committee Switcher */}
                    {isAdmin && allCommittees.length > 0 && (
                        <div className="glass-panel rounded-2xl p-4 border border-gold/30 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs font-bold text-gold">Super Admin Supervision – اختر أي لجنة للمتابعة:</span>
                            <select
                                value={selectedCommitteeId}
                                onChange={(e) => loadWorkspace(e.target.value)}
                                className="px-4 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs font-bold"
                            >
                                {allCommittees.map((c) => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

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

                    {/* Committee Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-[11px] text-slate-400">Members</div>
                            <div className="text-xl font-black text-white mt-1">{stats.totalMembers}</div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-[11px] text-slate-400">Active Tasks</div>
                            <div className="text-xl font-black text-blue-400 mt-1">{stats.activeTasks}</div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-[11px] text-slate-400">Completed</div>
                            <div className="text-xl font-black text-emerald-400 mt-1">{stats.completedTasks}</div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-[11px] text-slate-400">Pending Reviews</div>
                            <div className="text-xl font-black text-gold mt-1">{stats.pendingReviews}</div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-[11px] text-slate-400">Overdue</div>
                            <div className="text-xl font-black text-red-400 mt-1">{stats.overdueTasks}</div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-[11px] text-slate-400">Completion Rate</div>
                            <div className="text-xl font-black text-purple-400 mt-1">{stats.completionRate}%</div>
                        </div>
                    </div>

                    {/* Top Module Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('tasks')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                                    activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'bg-[#0B1220] text-slate-300 border border-white/10'
                                }`}
                            >
                                <FiCheckSquare /> المهام والتسليمات
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('operations')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                                    activeTab === 'operations' ? 'bg-blue-600 text-white' : 'bg-[#0B1220] text-slate-300 border border-white/10'
                                }`}
                            >
                                <FiLayers /> أدوات اللجنة ({dashboardType.toUpperCase()})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('analytics')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                                    activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-[#0B1220] text-slate-300 border border-white/10'
                                }`}
                            >
                                <FiBarChart2 /> التقارير والأداء
                            </button>
                        </div>

                        {activeTab === 'tasks' && (
                            <div className="flex gap-1.5 bg-[#0B1220] p-1 rounded-xl border border-white/10">
                                {[
                                    { id: 'list', label: 'List', icon: FiList },
                                    { id: 'kanban', label: 'Kanban', icon: FiColumns },
                                    { id: 'calendar', label: 'Calendar', icon: FiCalendar },
                                ].map((v) => {
                                    const Icon = v.icon;
                                    return (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => setTaskView(v.id as typeof taskView)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${
                                                taskView === v.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <Icon /> {v.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* TAB 1: TASKS ENGINE */}
                    {activeTab === 'tasks' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {isLeader && (
                                <form onSubmit={handleCreateTask} className="glass-panel rounded-2xl p-5 border border-blue-500/20 space-y-3 h-fit">
                                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                        <FiPlus className="text-gold" /> إنشاء مهمة جديدة للجنة
                                    </h3>
                                    <input
                                        type="text"
                                        required
                                        placeholder="عنوان المهمة"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                    />
                                    <textarea
                                        rows={2}
                                        placeholder="وصف المهمة"
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                    />
                                    <select
                                        value={newTask.assigneeId}
                                        onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                    >
                                        <option value="">-- إسناد إلى عضو --</option>
                                        {members.map((m) => (
                                            <option key={m._id} value={m.userId?._id || ''}>
                                                {m.userId?.name} ({m.position})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                        <input
                                            type="date"
                                            value={newTask.deadline}
                                            onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                        />
                                    </div>
                                    <button type="submit" className="w-full btn-primary-blue py-2.5 text-xs">
                                        إضافة المهمة
                                    </button>
                                </form>
                            )}

                            <div className={`${isLeader ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
                                {taskView === 'kanban' && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        {[
                                            { id: 'todo', label: 'To Do' },
                                            { id: 'in_progress', label: 'In Progress' },
                                            { id: 'review', label: 'Under Review' },
                                            { id: 'done', label: 'Completed' },
                                        ].map((col) => {
                                            const colTasks = tasks.filter((t) =>
                                                col.id === 'in_progress'
                                                    ? t.status === 'in_progress' || t.status === 'revision'
                                                    : t.status === col.id
                                            );
                                            return (
                                                <div key={col.id} className="glass-panel rounded-2xl p-3 border border-white/10 space-y-2.5">
                                                    <div className="font-bold text-xs text-gold flex justify-between">
                                                        <span>{col.label}</span>
                                                        <span>{colTasks.length}</span>
                                                    </div>
                                                    {colTasks.map((t) => (
                                                        <div key={t._id} className="p-3 rounded-xl bg-[#0B1220] border border-white/10 space-y-1.5 text-xs">
                                                            <div className="font-bold text-white">{t.title}</div>
                                                            <div className="text-[10px] text-slate-400">
                                                                {t.priority.toUpperCase()} {t.deadline ? `• ${new Date(t.deadline).toLocaleDateString('ar-EG')}` : ''}
                                                            </div>
                                                            <select
                                                                value={t.status}
                                                                onChange={(e) => taskPatch({ taskId: t._id, action: 'update_status', status: e.target.value })}
                                                                className="w-full mt-1 px-2 py-1 rounded bg-slate-900 border border-white/10 text-[11px]"
                                                            >
                                                                <option value="todo">To Do</option>
                                                                <option value="in_progress">In Progress</option>
                                                                <option value="review">Under Review</option>
                                                                <option value="revision">Needs Revision</option>
                                                                <option value="done">Completed</option>
                                                            </select>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {taskView === 'calendar' && (
                                    <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
                                        <h4 className="font-bold text-sm text-white">جدول المواعيد النهائية (Deadlines Calendar)</h4>
                                        <div className="space-y-2">
                                            {[...tasks]
                                                .sort((a, b) => (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity))
                                                .map((t) => (
                                                    <div key={t._id} className="p-3 rounded-xl bg-[#0B1220] border border-white/10 flex items-center justify-between text-xs">
                                                        <div>
                                                            <span className="font-bold text-white">{t.title}</span>
                                                            <span className="text-slate-400 ml-2">({t.status})</span>
                                                        </div>
                                                        <span className="text-amber-300 font-semibold">
                                                            {t.deadline ? new Date(t.deadline).toLocaleDateString('ar-EG') : 'No Deadline'}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {taskView === 'list' &&
                                    (tasks.length === 0 ? (
                                        <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-xs">
                                            لا توجد مهام مسجلة حالياً.
                                        </div>
                                    ) : (
                                        tasks.map((t) => (
                                            <div key={t._id} className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div>
                                                        <h4 className="font-bold text-white text-sm">{t.title}</h4>
                                                        <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 uppercase">
                                                            {t.status}
                                                        </span>
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-gold uppercase">
                                                            {t.priority}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-4 text-[11px] text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <FiUsers /> {t.assignees?.map((a) => a.name).join('، ') || 'Unassigned'}
                                                    </span>
                                                    {t.deadline && (
                                                        <span className="flex items-center gap-1 text-amber-300">
                                                            <FiClock /> Deadline: {new Date(t.deadline).toLocaleDateString('ar-EG')}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Subtasks */}
                                                <div className="bg-[#0B1220] rounded-xl p-3 border border-white/5 space-y-2">
                                                    <div className="text-[11px] font-bold text-slate-300">
                                                        Subtasks ({t.subtasks?.filter((s) => s.done).length || 0}/{t.subtasks?.length || 0})
                                                    </div>
                                                    {t.subtasks?.map((st) => (
                                                        <label key={st._id} className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={st.done}
                                                                onChange={() => taskPatch({ taskId: t._id, action: 'toggle_subtask', subtaskId: st._id })}
                                                            />
                                                            <span className={st.done ? 'line-through text-slate-500' : ''}>{st.title}</span>
                                                        </label>
                                                    ))}
                                                    <div className="flex gap-2 pt-1">
                                                        <input
                                                            type="text"
                                                            placeholder="أضف مهمة فرعية..."
                                                            value={subtaskDraft[t._id] || ''}
                                                            onChange={(e) => setSubtaskDraft((p) => ({ ...p, [t._id]: e.target.value }))}
                                                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!subtaskDraft[t._id]?.trim()) return;
                                                                taskPatch({ taskId: t._id, action: 'add_subtask', subtaskTitle: subtaskDraft[t._id] });
                                                                setSubtaskDraft((p) => ({ ...p, [t._id]: '' }));
                                                            }}
                                                            className="px-3 py-1.5 rounded-lg bg-blue-600/30 text-blue-300 text-xs font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Submission History */}
                                                {t.submissions && t.submissions.length > 0 && (
                                                    <div className="bg-[#0B1220] rounded-xl p-3 border border-white/5 space-y-2">
                                                        <div className="text-[11px] font-bold text-slate-300">
                                                            سجل التسليمات ({t.submissions.length})
                                                        </div>
                                                        {t.submissions.map((sub) => (
                                                            <div key={sub._id} className="p-2.5 rounded-lg bg-white/5 text-xs space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span className="font-bold text-gold">v{sub.version} – {sub.submittedBy?.name}</span>
                                                                    <span className="text-[11px] text-blue-300">{sub.status}</span>
                                                                </div>
                                                                {sub.content && <p className="text-slate-300">{sub.content}</p>}
                                                                {sub.links?.map((lnk, idx) => (
                                                                    <a key={idx} href={lnk} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline block">
                                                                        {lnk}
                                                                    </a>
                                                                ))}
                                                                {sub.feedback && <p className="text-amber-300 text-[11px]">ملاحظة: {sub.feedback}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Submit Task */}
                                                {t.status !== 'done' && (
                                                    <div className="pt-2 border-t border-white/10 space-y-2">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="ملخص التسليم..."
                                                                value={submitDraft[t._id]?.content || ''}
                                                                onChange={(e) =>
                                                                    setSubmitDraft((prev) => ({
                                                                        ...prev,
                                                                        [t._id]: { ...(prev[t._id] || { link: '' }), content: e.target.value },
                                                                    }))
                                                                }
                                                                className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                                            />
                                                            <input
                                                                type="url"
                                                                placeholder="رابط الملف / Drive / GitHub..."
                                                                value={submitDraft[t._id]?.link || ''}
                                                                onChange={(e) =>
                                                                    setSubmitDraft((prev) => ({
                                                                        ...prev,
                                                                        [t._id]: { ...(prev[t._id] || { content: '' }), link: e.target.value },
                                                                    }))
                                                                }
                                                                className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                taskPatch({
                                                                    taskId: t._id,
                                                                    action: 'submit_task',
                                                                    content: submitDraft[t._id]?.content,
                                                                    links: submitDraft[t._id]?.link ? [submitDraft[t._id].link] : [],
                                                                })
                                                            }
                                                            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
                                                        >
                                                            <FiSend /> إرسال للمراجعة
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Leader Review */}
                                                {isLeader && t.status === 'review' && (
                                                    <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="ملاحظات المراجعة..."
                                                            value={reviewFeedback[t._id] || ''}
                                                            onChange={(e) => setReviewFeedback((p) => ({ ...p, [t._id]: e.target.value }))}
                                                            className="flex-1 px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => taskPatch({ taskId: t._id, action: 'review_task', status: 'approved', feedback: reviewFeedback[t._id] })}
                                                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                                                        >
                                                            قبول
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => taskPatch({ taskId: t._id, action: 'review_task', status: 'revision_required', feedback: reviewFeedback[t._id] })}
                                                            className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold"
                                                        >
                                                            طلب تعديل
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Comments Thread */}
                                                <div className="pt-2 border-t border-white/10 space-y-2">
                                                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                                        <FiMessageSquare /> التعليقات ({t.comments?.length || 0})
                                                    </div>
                                                    {t.comments?.map((c) => (
                                                        <div key={c._id} className="text-xs bg-white/5 px-3 py-2 rounded-lg">
                                                            <strong className="text-blue-300">{c.authorId?.name || 'Member'}: </strong>
                                                            <span className="text-slate-200">{c.content}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="أضف تعليقاً..."
                                                            value={commentDraft[t._id] || ''}
                                                            onChange={(e) => setCommentDraft((p) => ({ ...p, [t._id]: e.target.value }))}
                                                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#0B1220] border border-white/10 text-xs text-white"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!commentDraft[t._id]?.trim()) return;
                                                                taskPatch({ taskId: t._id, action: 'add_comment', comment: commentDraft[t._id] });
                                                                setCommentDraft((p) => ({ ...p, [t._id]: '' }));
                                                            }}
                                                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold"
                                                        >
                                                            إرسال
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: SPECIALIZED COMMITTEE OPERATIONS */}
                    {activeTab === 'operations' && (
                        <div className="space-y-6">
                            {/* HR Attendance & Leave Requests */}
                            {(dashboardType === 'hr' || isLeader) && (
                                <div className="glass-panel rounded-2xl p-5 border border-blue-500/20 space-y-4">
                                    <h3 className="font-bold text-white text-sm">سجل الحضور والغياب والاستئذان (Attendance & Leaves)</h3>
                                    {isLeader ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                            <select
                                                value={attForm.userId}
                                                onChange={(e) => setAttForm({ ...attForm, userId: e.target.value })}
                                                className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                            >
                                                <option value="">-- اختر العضو --</option>
                                                {members.map((m) => (
                                                    <option key={m._id} value={m.userId?._id || ''}>{m.userId?.name}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={attForm.status}
                                                onChange={(e) => setAttForm({ ...attForm, status: e.target.value })}
                                                className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                            >
                                                <option value="present">Present (حضور)</option>
                                                <option value="late">Late (تأخير)</option>
                                                <option value="absent">Absent (غياب)</option>
                                                <option value="excused">Excused (إذن)</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="ملاحظة"
                                                value={attForm.notes}
                                                onChange={(e) => setAttForm({ ...attForm, notes: e.target.value })}
                                                className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                            />
                                            <button
                                                type="button"
                                                disabled={!attForm.userId}
                                                onClick={() => saveModuleItem({ moduleType: 'attendance', ...attForm })}
                                                className="btn-primary-blue py-2 text-xs disabled:opacity-50"
                                            >
                                                تسجيل الحضور
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="سبب طلب الإذن / الاعتذار..."
                                                value={leaveReason}
                                                onChange={(e) => setLeaveReason(e.target.value)}
                                                className="flex-1 px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => saveModuleItem({ moduleType: 'attendance', isLeaveRequest: true, leaveReason })}
                                                className="btn-primary-blue px-4 py-2 text-xs"
                                            >
                                                طلب إذن
                                            </button>
                                        </div>
                                    )}
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {((moduleData.attendance as Array<{ _id: string; userId?: { name: string }; status: string; date: string; notes?: string }>) || []).map((a) => (
                                            <div key={a._id} className="p-2.5 rounded-xl bg-[#0B1220] text-xs flex justify-between">
                                                <span><strong className="text-white">{a.userId?.name}</strong> — {a.status}</span>
                                                <span className="text-slate-400">{new Date(a.date).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PR & Marketing Campaigns */}
                            {dashboardType === 'pr_marketing' && (
                                <div className="glass-panel rounded-2xl p-5 border border-purple-500/20 space-y-4">
                                    <h3 className="font-bold text-white text-sm">الحملات التسويقية وخطة المحتوى (Campaigns & Content Calendar)</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                        <input
                                            type="text"
                                            placeholder="عنوان الحملة / المنشور"
                                            value={campaignForm.title}
                                            onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                        />
                                        <select
                                            value={campaignForm.platform}
                                            onChange={(e) => setCampaignForm({ ...campaignForm, platform: e.target.value })}
                                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                        >
                                            <option value="facebook">Facebook</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="linkedin">LinkedIn</option>
                                            <option value="tiktok">TikTok</option>
                                        </select>
                                        <input
                                            type="date"
                                            value={campaignForm.scheduledDate}
                                            onChange={(e) => setCampaignForm({ ...campaignForm, scheduledDate: e.target.value })}
                                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => saveModuleItem({ moduleType: 'campaign', ...campaignForm })}
                                            className="btn-primary-blue py-2 text-xs"
                                        >
                                            إضافة للخطة
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {((moduleData.campaigns as Array<{ _id: string; title: string; platform: string; status: string }>) || []).map((c) => (
                                            <div key={c._id} className="p-3 rounded-xl bg-[#0B1220] text-xs flex justify-between">
                                                <span><strong className="text-white">{c.title}</strong> ({c.platform})</span>
                                                <span className="text-gold">{c.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Operations Logistics & Budget */}
                            {dashboardType === 'operations' && (
                                <div className="glass-panel rounded-2xl p-5 border border-emerald-500/20 space-y-4">
                                    <h3 className="font-bold text-white text-sm">اللوجستيات والميزانية وتجهيزات الفعاليات (OR Logistics & Budget)</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                        <input
                                            type="text"
                                            placeholder="البند / التجهيز"
                                            value={logisticsForm.title}
                                            onChange={(e) => setLogisticsForm({ ...logisticsForm, title: e.target.value })}
                                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                        />
                                        <select
                                            value={logisticsForm.category}
                                            onChange={(e) => setLogisticsForm({ ...logisticsForm, category: e.target.value })}
                                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                        >
                                            <option value="equipment">Equipment</option>
                                            <option value="transportation">Transportation</option>
                                            <option value="hospitality">Hospitality</option>
                                            <option value="venue">Venue</option>
                                        </select>
                                        <input
                                            type="number"
                                            placeholder="التكلفة التقديرية"
                                            value={logisticsForm.estimatedCost}
                                            onChange={(e) => setLogisticsForm({ ...logisticsForm, estimatedCost: e.target.value })}
                                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => saveModuleItem({ moduleType: 'logistics', ...logisticsForm })}
                                            className="btn-primary-blue py-2 text-xs"
                                        >
                                            إضافة بند
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {((moduleData.logistics as Array<{ _id: string; title: string; category: string; estimatedCost: number; status: string }>) || []).map((l) => (
                                            <div key={l._id} className="p-3 rounded-xl bg-[#0B1220] text-xs flex justify-between">
                                                <span><strong className="text-white">{l.title}</strong> ({l.category}) — {l.estimatedCost} EGP</span>
                                                <span className="text-emerald-300">{l.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Technical Committee Projects */}
                            {dashboardType === 'technical' && (
                                <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 space-y-4">
                                    <h3 className="font-bold text-white text-sm">المشروعات التقنية والـ Repositories</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                        <input
                                            type="text"
                                            placeholder="اسم المشروع"
                                            value={projectForm.name}
                                            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                        />
                                        <input
                                            type="url"
                                            placeholder="GitHub Repo URL"
                                            value={projectForm.githubUrl}
                                            onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                        />
                                        <input
                                            type="url"
                                            placeholder="Documentation URL"
                                            value={projectForm.docsUrl}
                                            onChange={(e) => setProjectForm({ ...projectForm, docsUrl: e.target.value })}
                                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => saveModuleItem({ moduleType: 'project', ...projectForm })}
                                            className="btn-primary-blue py-2 text-xs"
                                        >
                                            إنشاء مشروع
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {((moduleData.projects as Array<{ _id: string; name: string; githubUrl?: string; status: string; progress: number }>) || []).map((p) => (
                                            <div key={p._id} className="p-3 rounded-xl bg-[#0B1220] text-xs flex justify-between items-center">
                                                <div>
                                                    <strong className="text-white">{p.name}</strong> ({p.status} • {p.progress}%)
                                                    {p.githubUrl && (
                                                        <a href={p.githubUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline ml-2">
                                                            GitHub
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Education & Training */}
                            {dashboardType === 'education' && (
                                <div className="glass-panel rounded-2xl p-5 border border-blue-500/20 space-y-3">
                                    <h3 className="font-bold text-white text-sm">البرامج التدريبية وتنسيق المحاضرين</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {((moduleData.tracks as Array<{ _id: string; name: string; category: string }>) || []).map((tr) => (
                                            <div key={tr._id} className="p-3 rounded-xl bg-[#0B1220] text-xs">
                                                <div className="font-bold text-white">{tr.name}</div>
                                                <div className="text-slate-400">{tr.category}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: PERFORMANCE & ANALYTICS */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h3 className="font-bold text-white text-sm">تقارير الأداء والالتزام (Performance & Attendance Reports)</h3>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={exportCsv}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
                                    >
                                        <FiDownload /> Export Excel (CSV)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => window.print()}
                                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
                                    >
                                        <FiPrinter /> Print / PDF
                                    </button>
                                </div>
                            </div>

                            <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-white/10 text-slate-400">
                                            <th className="py-3 px-4">Member</th>
                                            <th className="py-3 px-4">Position</th>
                                            <th className="py-3 px-4">Tasks</th>
                                            <th className="py-3 px-4">Completion %</th>
                                            <th className="py-3 px-4">Attendance %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(analytics.memberPerformance || []).map((m) => (
                                            <tr key={m.userId}>
                                                <td className="py-3 px-4 font-bold text-white">{m.name}</td>
                                                <td className="py-3 px-4 text-gold">{m.position}</td>
                                                <td className="py-3 px-4 text-slate-300">
                                                    {m.completedTasks}/{m.assignedTasks} (Overdue: {m.overdueTasks})
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500" style={{ width: `${m.completionRate}%` }} />
                                                        </div>
                                                        <span>{m.completionRate}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-emerald-400 font-bold">{m.attendanceRate}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Committee Announcements */}
                    {announcements.length > 0 && (
                        <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-2">
                            <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                <FiBell className="text-gold" /> إعلانات اللجنة
                            </h3>
                            {announcements.map((a) => (
                                <div key={a._id} className="p-3 rounded-xl bg-[#0B1220] text-xs">
                                    <div className="font-bold text-gold">{a.title}</div>
                                    <div className="text-slate-300 mt-0.5">{a.content}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </DashboardShell>
    );
}
