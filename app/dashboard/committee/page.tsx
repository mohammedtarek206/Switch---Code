'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FiCheckSquare, FiPlus, FiSend, FiCheckCircle, FiAlertCircle,
    FiClock, FiUsers, FiBell
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

interface TaskItem {
    _id: string;
    title: string;
    description?: string;
    priority: string;
    status: string;
    deadline?: string;
    assignees: { _id: string; name: string }[];
    submissions: TaskSubmission[];
}

interface MemberItem {
    _id: string;
    userId?: { _id: string; name: string; email: string };
    position: string;
}

export default function CommitteeWorkspacePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [isLeader, setIsLeader] = useState(false);
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

    // New task form (for Head/Vice Head)
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        deadline: '',
        assigneeId: '',
    });

    // Submission draft per task
    const [submitDraft, setSubmitDraft] = useState<Record<string, { content: string; link: string; notes: string }>>({});
    const [reviewFeedback, setReviewFeedback] = useState<Record<string, string>>({});

    async function loadWorkspace() {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        try {
            const res = await fetch('/api/committee/tasks/workspace', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'تعذر تحميل مساحة عمل اللجنة.');
                return;
            }
            setCommittee(data.committee);
            setIsLeader(Boolean(data.isLeader));
            setStats(data.stats);
            setTasks(data.tasks || []);
            setMembers(data.members || []);
            setAnnouncements(data.announcements || []);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadWorkspace();
    }, []);

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
        await loadWorkspace();
    }

    async function handleSubmitTask(taskId: string) {
        setMsg('');
        setError('');
        const token = localStorage.getItem('token');
        const draft = submitDraft[taskId] || { content: '', link: '', notes: '' };
        const res = await fetch('/api/committee/tasks/workspace', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                taskId,
                action: 'submit_task',
                content: draft.content,
                links: draft.link ? [draft.link] : [],
                notes: draft.notes,
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || 'فشل إرسال التسليم');
            return;
        }
        setMsg(data.message || 'تم إرسال التسليم');
        await loadWorkspace();
    }

    async function handleReviewTask(taskId: string, status: 'approved' | 'revision_required') {
        setMsg('');
        setError('');
        const token = localStorage.getItem('token');
        const res = await fetch('/api/committee/tasks/workspace', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                taskId,
                action: 'review_task',
                status,
                feedback: reviewFeedback[taskId] || '',
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || 'فشل حفظ المراجعة');
            return;
        }
        setMsg(data.message || 'تم حفظ المراجعة');
        await loadWorkspace();
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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Create Task (Leaders Only) */}
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
                                    placeholder="وصف المهمة ومتطلبات التسليم"
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
                                        <option value="critical">Critical</option>
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

                        {/* Tasks List */}
                        <div className={`${isLeader ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <FiCheckSquare className="text-blue-400" /> مهام اللجنة ({tasks.length})
                            </h3>
                            {tasks.length === 0 ? (
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

                                        {/* Submission History */}
                                        {t.submissions && t.submissions.length > 0 && (
                                            <div className="bg-[#0B1220] rounded-xl p-3 border border-white/5 space-y-2">
                                                <div className="text-[11px] font-bold text-slate-300">
                                                    سجل التسليمات ({t.submissions.length})
                                                </div>
                                                {t.submissions.map((sub) => (
                                                    <div key={sub._id} className="p-2.5 rounded-lg bg-white/5 text-xs space-y-1">
                                                        <div className="flex justify-between">
                                                            <span className="font-bold text-gold">
                                                                v{sub.version} – {sub.submittedBy?.name}
                                                            </span>
                                                            <span className="text-[11px] text-blue-300">{sub.status}</span>
                                                        </div>
                                                        {sub.content && <p className="text-slate-300">{sub.content}</p>}
                                                        {sub.links?.map((lnk, idx) => (
                                                            <a key={idx} href={lnk} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline block">
                                                                {lnk}
                                                            </a>
                                                        ))}
                                                        {sub.feedback && (
                                                            <p className="text-amber-300 text-[11px]">ملاحظة المراجعة: {sub.feedback}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Member Submit Box */}
                                        {t.status !== 'done' && (
                                            <div className="pt-2 border-t border-white/10 space-y-2">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="ملخص التسليم أو الرد..."
                                                        value={submitDraft[t._id]?.content || ''}
                                                        onChange={(e) =>
                                                            setSubmitDraft((prev) => ({
                                                                ...prev,
                                                                [t._id]: { ...(prev[t._id] || { link: '', notes: '' }), content: e.target.value },
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
                                                                [t._id]: { ...(prev[t._id] || { content: '', notes: '' }), link: e.target.value },
                                                            }))
                                                        }
                                                        className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSubmitTask(t._id)}
                                                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
                                                >
                                                    <FiSend /> إرسال للمراجعة
                                                </button>
                                            </div>
                                        )}

                                        {/* Leader Review Controls */}
                                        {isLeader && t.status === 'review' && (
                                            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="ملاحظات المراجعة (Feedback)..."
                                                    value={reviewFeedback[t._id] || ''}
                                                    onChange={(e) =>
                                                        setReviewFeedback((prev) => ({ ...prev, [t._id]: e.target.value }))
                                                    }
                                                    className="flex-1 px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleReviewTask(t._id, 'approved')}
                                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                                                >
                                                    قبول المهمة
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleReviewTask(t._id, 'revision_required')}
                                                    className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold"
                                                >
                                                    طلب تعديل
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

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
