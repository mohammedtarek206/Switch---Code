'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiUsers, FiCheckSquare, FiAlertTriangle, FiAward, FiCalendar,
    FiPlus, FiStar, FiActivity, FiTrendingUp, FiMessageSquare,
    FiChevronRight, FiClock, FiFlag, FiLogOut, FiArrowLeft, FiEdit
} from 'react-icons/fi';
import Link from 'next/link';

const PRIORITY_COLORS: Record<string, string> = {
    low: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/20 text-red-400 border-red-500/20',
};
const STATUS_COLORS: Record<string, string> = {
    todo: 'bg-gray-500/20 text-gray-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    review: 'bg-yellow-500/20 text-yellow-400',
    revision: 'bg-orange-500/20 text-orange-400',
    done: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
};
const REWARD_ICONS: Record<string, string> = {
    excellent_performance: '🏆', best_member: '⭐', fastest_delivery: '⚡',
    best_team_player: '🤝', outstanding_contribution: '🎯', innovation_award: '💡',
    consistency_award: '🎖️', leadership_excellence: '👑', most_improved: '📈',
};

const CRITERIA = ['commitment', 'attendance', 'workQuality', 'executionSpeed', 'cooperation', 'communication', 'creativity', 'responsibility', 'punctuality', 'teamwork'];
const CRITERIA_LABELS: Record<string, string> = {
    commitment: 'الالتزام', attendance: 'الحضور', workQuality: 'جودة العمل', executionSpeed: 'سرعة التنفيذ',
    cooperation: 'التعاون', communication: 'التواصل', creativity: 'الإبداع', responsibility: 'تحمل المسؤولية',
    punctuality: 'الالتزام بالمواعيد', teamwork: 'العمل الجماعي',
};

export default function CommitteeDashboard() {
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'members' | 'evals' | 'meetings' | 'warnings' | 'rewards'>('overview');

    // Modals
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showEvalModal, setShowEvalModal] = useState(false);
    const [showWarnModal, setShowWarnModal] = useState(false);
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);

    // Forms
    const [taskForm, setTaskForm] = useState<any>({ title: '', description: '', priority: 'medium', deadline: '', assignees: [], category: '' });
    const [evalForm, setEvalForm] = useState<any>({ memberId: '', period: 'monthly', commitment: 7, attendance: 7, workQuality: 7, executionSpeed: 7, cooperation: 7, communication: 7, creativity: 7, responsibility: 7, punctuality: 7, teamwork: 7, leaderComment: '' });
    const [warnForm, setWarnForm] = useState<any>({ memberId: '', reason: '', level: 'low', notes: '' });
    const [rewardForm, setRewardForm] = useState<any>({ memberId: '', rewardType: 'best_member', title: '', notes: '' });
    const [meetingForm, setMeetingForm] = useState<any>({ title: '', date: '', time: '', location: 'Online', meetLink: '', agenda: '' });

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('user') || 'null');
        setUser(u);
        if (u) fetchAll(u);
    }, []);

    async function fetchAll(u: any) {
        setLoading(true);
        try {
            const committeeId = u.committeeId?._id || u.committeeId;
            const [wRes, tRes] = await Promise.all([
                fetch(`/api/committee/workspace?committeeId=${committeeId}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`/api/committee/tasks?committeeId=${committeeId}`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (wRes.ok) setData(await wRes.json());
            if (tRes.ok) setTasks(await tRes.json());
        } catch { }
        setLoading(false);
    }

    async function postAction(type: string, body: any) {
        const res = await fetch('/api/committee/actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ type, committeeId: user?.committeeId?._id || user?.committeeId, ...body }),
        });
        if (!res.ok) { const e = await res.json(); alert(e.error); return false; }
        return true;
    }

    async function createTask(e: React.FormEvent) {
        e.preventDefault();
        const committeeId = user?.committeeId?._id || user?.committeeId;
        const res = await fetch('/api/committee/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...taskForm, committeeId }),
        });
        if (res.ok) { setShowTaskModal(false); fetchAll(user); }
        else { const e = await res.json(); alert(e.error); }
    }

    async function updateTask(id: string, action: string, extra: any = {}) {
        await fetch('/api/committee/tasks', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id, action, ...extra }),
        });
        fetchAll(user);
    }

    if (loading) return <div className="min-h-screen bg-[#07111F] flex justify-center items-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-gold" /></div>;
    if (!user) return null;

    const isLeader = ['committee_leader', 'vice_committee_leader', 'admin', 'super_admin', 'president'].includes(user.role);
    const committeeName = user.committeeId?.name || 'Committee';
    const members = data?.members || [];
    const stats = data?.committeeStats;

    const TABS = [
        { id: 'overview', label: 'Overview', icon: FiActivity },
        { id: 'tasks', label: 'Tasks', icon: FiCheckSquare },
        ...(isLeader ? [{ id: 'members', label: 'Members', icon: FiUsers }] : []),
        { id: 'evals', label: 'Evaluations', icon: FiStar },
        { id: 'meetings', label: 'Meetings', icon: FiCalendar },
        { id: 'warnings', label: 'Warnings', icon: FiAlertTriangle },
        { id: 'rewards', label: 'Rewards', icon: FiAward },
    ];

    return (
        <div className="min-h-screen bg-[#07111F] text-white">
            {/* Top Header */}
            <div className="bg-slate-900 border-b border-blue-500/20 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-slate-900 border border-blue-500/20 rounded-xl text-gray-400 hover:text-white transition-colors">
                        <FiArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Committee Workspace</div>
                        <h1 className="text-xl font-extrabold text-white">{committeeName}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${isLeader ? 'bg-gold/10 border-gold/20 text-gold' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                        {user.role?.replace(/_/g, ' ')}
                    </span>
                    {isLeader && (
                        <div className="flex gap-2 ml-2">
                            <button onClick={() => setShowTaskModal(true)} className="bg-gold text-black font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-gold/90">
                                <FiPlus className="w-4 h-4" /> New Task
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-blue-500/20 px-6 flex gap-1 overflow-x-auto">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                        className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === t.id ? 'border-gold text-gold' : 'border-transparent text-gray-400 hover:text-white'}`}>
                        <t.icon className="w-4 h-4" />{t.label}
                    </button>
                ))}
            </div>

            <div className="p-6 max-w-7xl mx-auto space-y-6">

                {/* ──── OVERVIEW TAB ──── */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* KPI Cards */}
                        {isLeader && stats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                {[
                                    { label: 'Members', val: stats.memberCount, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                                    { label: 'Total Tasks', val: stats.totalTasks, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                                    { label: 'Completed', val: stats.completedTasks, color: 'text-green-400', bg: 'bg-green-500/10' },
                                    { label: 'Overdue', val: stats.lateTasks, color: 'text-red-400', bg: 'bg-red-500/10' },
                                    { label: 'Completion %', val: `${stats.completionRate}%`, color: 'text-gold', bg: 'bg-gold/10' },
                                    { label: 'Warnings', val: stats.totalWarnings, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                                    { label: 'Rewards', val: stats.totalRewards, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                                ].map(s => (
                                    <div key={s.label} className={`glass-panel p-4 rounded-2xl border border-blue-500/20 flex flex-col gap-2`}>
                                        <div className={`text-xs font-bold uppercase tracking-wider ${s.color}`}>{s.label}</div>
                                        <div className="text-2xl font-extrabold text-white">{s.val}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Member Performance Score */}
                        {!isLeader && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Avg Score', val: `${data?.avgScore || 0}`, color: 'text-gold' },
                                    { label: 'My Tasks', val: tasks.length, color: 'text-blue-400' },
                                    { label: 'Warnings', val: data?.warnings?.length || 0, color: 'text-red-400' },
                                    { label: 'Rewards', val: data?.rewards?.length || 0, color: 'text-yellow-400' },
                                ].map(s => (
                                    <div key={s.label} className="glass-panel p-5 rounded-2xl border border-blue-500/20">
                                        <div className={`text-xs font-bold uppercase text-gray-500 mb-1`}>{s.label}</div>
                                        <div className={`text-3xl font-extrabold ${s.color}`}>{s.val}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Active Tasks Preview */}
                        <div className="glass-panel rounded-3xl border border-blue-500/20 overflow-hidden">
                            <div className="p-5 border-b border-blue-500/20 flex justify-between items-center">
                                <h3 className="font-bold text-white">Active Tasks</h3>
                                <button onClick={() => setActiveTab('tasks')} className="text-xs text-gold hover:underline flex items-center gap-1">View all <FiChevronRight /></button>
                            </div>
                            <div className="divide-y divide-white/5">
                                {tasks.filter(t => t.status !== 'done').slice(0, 5).map((task: any) => (
                                    <div key={task._id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] cursor-pointer" onClick={() => { setSelectedTask(task); setActiveTab('tasks'); }}>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white text-sm truncate">{task.title}</p>
                                            <p className="text-xs text-gray-400">{task.assignees?.map((a: any) => a.name).join(', ')}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[task.status]}`}>{task.status.replace('_', ' ')}</span>
                                        {task.deadline && <span className="text-xs text-gray-500"><FiClock className="inline mr-1" />{new Date(task.deadline).toLocaleDateString()}</span>}
                                    </div>
                                ))}
                                {tasks.filter(t => t.status !== 'done').length === 0 && <div className="p-8 text-center text-gray-500 text-sm">No active tasks.</div>}
                            </div>
                        </div>

                        {/* Upcoming Meetings */}
                        {(data?.meetings || []).length > 0 && (
                            <div className="glass-panel rounded-3xl border border-blue-500/20 p-5">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FiCalendar className="text-blue-400" />Upcoming Meetings</h3>
                                <div className="space-y-3">
                                    {(data.meetings || []).filter((m: any) => m.status === 'upcoming').slice(0, 3).map((m: any) => (
                                        <div key={m._id} className="bg-slate-900 border border-blue-500/20 p-3 rounded-xl flex items-center gap-4">
                                            <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl text-center min-w-[48px]">
                                                <div className="text-base font-extrabold">{new Date(m.date).getDate()}</div>
                                                <div className="text-[10px] uppercase">{new Date(m.date).toLocaleString('en', { month: 'short' })}</div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white">{m.title}</p>
                                                <p className="text-xs text-gray-400">{m.time} · {m.location}</p>
                                            </div>
                                            {m.meetLink && <a href={m.meetLink} target="_blank" className="ml-auto text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-500/20">Join</a>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Leader Quick Actions */}
                        {isLeader && (
                            <div className="glass-panel rounded-3xl border border-blue-500/20 p-5">
                                <h3 className="font-bold text-white mb-4">Quick Actions</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { label: 'New Task', icon: FiPlus, color: 'text-gold bg-gold/10', action: () => setShowTaskModal(true) },
                                        { label: 'Evaluate Member', icon: FiStar, color: 'text-yellow-400 bg-yellow-500/10', action: () => setShowEvalModal(true) },
                                        { label: 'Issue Warning', icon: FiAlertTriangle, color: 'text-red-400 bg-red-500/10', action: () => setShowWarnModal(true) },
                                        { label: 'Grant Reward', icon: FiAward, color: 'text-purple-400 bg-purple-500/10', action: () => setShowRewardModal(true) },
                                        { label: 'Schedule Meeting', icon: FiCalendar, color: 'text-blue-400 bg-blue-500/10', action: () => setShowMeetingModal(true) },
                                    ].map(a => (
                                        <button key={a.label} onClick={a.action} className={`glass-panel p-4 rounded-xl border border-blue-500/20 flex items-center gap-3 hover:bg-slate-900 border border-blue-500/20 transition-all text-left`}>
                                            <div className={`p-2 rounded-xl ${a.color}`}><a.icon className="w-5 h-5" /></div>
                                            <span className="text-sm font-bold text-white">{a.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ──── TASKS TAB ──── */}
                {activeTab === 'tasks' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Tasks Board</h2>
                            {isLeader && <button onClick={() => setShowTaskModal(true)} className="bg-gold text-black font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2"><FiPlus />New Task</button>}
                        </div>
                        {/* Kanban columns */}
                        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {['todo', 'in_progress', 'review', 'revision', 'done'].map(col => (
                                <div key={col} className="glass-panel rounded-2xl border border-blue-500/20 overflow-hidden">
                                    <div className={`p-3 border-b border-blue-500/20 text-xs font-extrabold uppercase tracking-wider ${STATUS_COLORS[col]}`}>
                                        {col.replace('_', ' ')} ({tasks.filter(t => t.status === col).length})
                                    </div>
                                    <div className="p-3 space-y-3 min-h-[200px]">
                                        {tasks.filter(t => t.status === col).map((task: any) => (
                                            <div key={task._id} className="bg-slate-900 border border-blue-500/20 p-3 rounded-xl border border-blue-500/20 cursor-pointer hover:border-gold/30 transition-all"
                                                onClick={() => setSelectedTask(task === selectedTask ? null : task)}>
                                                <p className="font-bold text-sm text-white mb-1">{task.title}</p>
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                                                    {task.deadline && <span className="text-[9px] text-gray-500"><FiClock className="inline mr-0.5" />{new Date(task.deadline).toLocaleDateString()}</span>}
                                                </div>
                                                {task.progress > 0 && (
                                                    <div className="mt-2">
                                                        <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>Progress</span><span>{task.progress}%</span></div>
                                                        <div className="w-full h-1.5 bg-slate-900 border border-blue-500/20 rounded-full"><div className="h-full bg-gold rounded-full" style={{ width: `${task.progress}%` }} /></div>
                                                    </div>
                                                )}
                                                {/* Member quick actions */}
                                                {!isLeader && (
                                                    <div className="flex gap-1 mt-2 flex-wrap">
                                                        {col === 'todo' && <button onClick={e => { e.stopPropagation(); updateTask(task._id, 'UPDATE_STATUS', { status: 'in_progress', progress: 5 }); }} className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">Start</button>}
                                                        {col === 'in_progress' && <button onClick={e => { e.stopPropagation(); setSelectedTask(task); }} className="text-[9px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-bold">Update</button>}
                                                        {col === 'in_progress' && <button onClick={e => { e.stopPropagation(); updateTask(task._id, 'REQUEST_REVIEW', {}); }} className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-bold">Request Review</button>}
                                                    </div>
                                                )}
                                                {/* Leader review actions */}
                                                {isLeader && col === 'review' && (
                                                    <div className="flex gap-1 mt-2">
                                                        <button onClick={e => { e.stopPropagation(); updateTask(task._id, 'APPROVE', { reviewNote: 'Looks great!' }); }} className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold">Approve</button>
                                                        <button onClick={e => { e.stopPropagation(); updateTask(task._id, 'REJECT', { reviewNote: 'Needs changes.' }); }} className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">Reject</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Task Detail Panel */}
                        {selectedTask && (
                            <div className="glass-panel rounded-3xl border border-gold/20 p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-extrabold text-white">{selectedTask.title}</h3>
                                        <p className="text-gray-400 text-sm mt-1">{selectedTask.description}</p>
                                    </div>
                                    <button onClick={() => setSelectedTask(null)} className="text-gray-500 hover:text-white text-lg">✕</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded border ${PRIORITY_COLORS[selectedTask.priority]}`}>{selectedTask.priority}</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${STATUS_COLORS[selectedTask.status]}`}>{selectedTask.status.replace('_', ' ')}</span>
                                    {selectedTask.deadline && <span className="text-xs text-gray-400"><FiClock className="inline mr-1" />{new Date(selectedTask.deadline).toLocaleDateString()}</span>}
                                </div>
                                {/* Progress update for members */}
                                {!isLeader && selectedTask.status === 'in_progress' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400">Update Progress: {selectedTask.progress}%</label>
                                        <input type="range" min="0" max="100" value={selectedTask.progress}
                                            onChange={e => setSelectedTask({ ...selectedTask, progress: parseInt(e.target.value) })}
                                            className="w-full accent-accent" />
                                        <button onClick={() => updateTask(selectedTask._id, 'UPDATE_PROGRESS', { progress: selectedTask.progress })}
                                            className="bg-gold text-black font-bold px-4 py-2 rounded-xl text-sm">Save Progress</button>
                                    </div>
                                )}
                                {/* Checklist */}
                                {selectedTask.checklist?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-2">Checklist ({selectedTask.checklist.filter((c: any) => c.done).length}/{selectedTask.checklist.length})</h4>
                                        <div className="space-y-1">
                                            {selectedTask.checklist.map((item: any) => (
                                                <label key={item._id} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                                    <input type="checkbox" checked={item.done} onChange={() => updateTask(selectedTask._id, 'TOGGLE_CHECKLIST', { checklistItemId: item._id })} className="accent-accent" />
                                                    <span className={item.done ? 'line-through text-gray-500' : ''}>{item.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Comments */}
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-2">Comments ({selectedTask.comments?.length || 0})</h4>
                                    <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                                        {(selectedTask.comments || []).map((c: any, i: number) => (
                                            <div key={i} className="bg-slate-900 border border-blue-500/20 p-3 rounded-xl text-sm">
                                                <p className="text-gold font-bold text-xs mb-1">{c.authorId?.name || 'Member'}</p>
                                                <p className="text-gray-300">{c.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input id="comment-input" type="text" placeholder="Add a comment..." className="flex-1 p-2.5 bg-slate-900 border border-blue-500/30 rounded-xl text-sm text-white outline-none focus:border-gold" />
                                        <button onClick={() => {
                                            const inp = document.getElementById('comment-input') as HTMLInputElement;
                                            if (inp?.value) { updateTask(selectedTask._id, 'ADD_COMMENT', { content: inp.value }); inp.value = ''; }
                                        }} className="bg-gold text-black font-bold px-4 rounded-xl text-sm">Send</button>
                                    </div>
                                </div>
                                {/* Activity log */}
                                {selectedTask.activityLog?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-2">Activity Log</h4>
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                            {[...(selectedTask.activityLog || [])].reverse().map((a: any, i: number) => (
                                                <p key={i} className="text-xs text-gray-500"><span className="text-gray-400">{a.action}</span> · {new Date(a.createdAt).toLocaleString()}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ──── MEMBERS TAB (leader only) ──── */}
                {activeTab === 'members' && isLeader && (
                    <div className="glass-panel rounded-3xl border border-blue-500/20 overflow-hidden">
                        <div className="p-5 border-b border-blue-500/20 flex justify-between items-center">
                            <h3 className="font-bold text-white">Committee Members ({members.length})</h3>
                        </div>
                        <div className="divide-y divide-white/5">
                            {members.map((m: any) => (
                                <div key={m._id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02]">
                                    <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center font-bold text-gold">
                                        {m.avatar ? <img src={m.avatar} className="w-full h-full rounded-full object-cover" /> : m.name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-white">{m.name}</p>
                                        <p className="text-xs text-gray-400">{m.username} · {m.position || m.role}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-lg">⭐ {m.performanceScore || 0}</span>
                                        <button onClick={() => { setEvalForm({ ...evalForm, memberId: m._id }); setShowEvalModal(true); }} className="text-xs bg-gold/10 text-gold px-3 py-1.5 rounded-lg font-bold hover:bg-gold/20">Evaluate</button>
                                        <button onClick={() => { setWarnForm({ ...warnForm, memberId: m._id }); setShowWarnModal(true); }} className="text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg font-bold hover:bg-red-500/20">Warn</button>
                                        <button onClick={() => { setRewardForm({ ...rewardForm, memberId: m._id }); setShowRewardModal(true); }} className="text-xs bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-500/20">Reward</button>
                                    </div>
                                </div>
                            ))}
                            {members.length === 0 && <div className="p-8 text-center text-gray-500">No members found in this committee.</div>}
                        </div>
                    </div>
                )}

                {/* ──── EVALUATIONS TAB ──── */}
                {activeTab === 'evals' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Evaluations <span className="text-gray-500 text-sm ml-2">Avg: {data?.avgScore || 0}/100</span></h2>
                            {isLeader && <button onClick={() => setShowEvalModal(true)} className="bg-yellow-500/20 text-yellow-400 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 border border-yellow-500/20"><FiStar />New Evaluation</button>}
                        </div>
                        <div className="space-y-4">
                            {(data?.evaluations || []).map((ev: any) => (
                                <div key={ev._id} className="glass-panel rounded-2xl border border-blue-500/20 p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <p className="font-bold text-white">{ev.period} Evaluation · {ev.month}/{ev.year}</p>
                                            <p className="text-xs text-gray-400">By: {ev.evaluatorId?.name}</p>
                                        </div>
                                        <div className="text-3xl font-extrabold text-gold">{ev.totalScore}<span className="text-sm text-gray-500">/100</span></div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {CRITERIA.map(c => (
                                            <div key={c} className="bg-slate-900 border border-blue-500/20 p-2.5 rounded-xl text-center">
                                                <div className="text-[10px] text-gray-500 uppercase">{CRITERIA_LABELS[c]}</div>
                                                <div className="text-lg font-bold text-white">{ev[c]}<span className="text-xs text-gray-500">/10</span></div>
                                                <div className="w-full h-1 bg-slate-800 rounded-full mt-1"><div className="h-full bg-gold rounded-full" style={{ width: `${ev[c] * 10}%` }} /></div>
                                            </div>
                                        ))}
                                    </div>
                                    {ev.leaderComment && <p className="mt-3 text-sm text-gray-300 bg-slate-900 border border-blue-500/20 p-3 rounded-xl"><span className="font-bold text-gold">Leader: </span>{ev.leaderComment}</p>}
                                </div>
                            ))}
                            {(data?.evaluations || []).length === 0 && <div className="glass-panel p-10 text-center text-gray-500 rounded-3xl">No evaluations yet.</div>}
                        </div>
                    </div>
                )}

                {/* ──── MEETINGS TAB ──── */}
                {activeTab === 'meetings' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Meetings</h2>
                            {isLeader && <button onClick={() => setShowMeetingModal(true)} className="bg-blue-500/20 text-blue-400 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 border border-blue-500/20"><FiCalendar />Schedule Meeting</button>}
                        </div>
                        <div className="space-y-3">
                            {(data?.meetings || []).map((m: any) => (
                                <div key={m._id} className="glass-panel p-4 rounded-2xl border border-blue-500/20 flex items-center gap-4">
                                    <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl text-center min-w-[56px]">
                                        <div className="text-xl font-extrabold">{new Date(m.date).getDate()}</div>
                                        <div className="text-[10px] uppercase">{new Date(m.date).toLocaleString('en', { month: 'short' })}</div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-white">{m.title}</p>
                                        <p className="text-sm text-gray-400">{m.time} · {m.location}</p>
                                        {m.agenda && <p className="text-xs text-gray-500 mt-1">{m.agenda}</p>}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${m.status === 'upcoming' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{m.status}</span>
                                        {m.meetLink && <a href={m.meetLink} target="_blank" className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-500/20 border border-blue-500/20">Join Meet</a>}
                                    </div>
                                </div>
                            ))}
                            {(data?.meetings || []).length === 0 && <div className="glass-panel p-10 text-center text-gray-500 rounded-3xl">No meetings scheduled.</div>}
                        </div>
                    </div>
                )}

                {/* ──── WARNINGS TAB ──── */}
                {activeTab === 'warnings' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Warnings</h2>
                            {isLeader && <button onClick={() => setShowWarnModal(true)} className="bg-red-500/20 text-red-400 font-bold px-4 py-2 rounded-xl text-sm border border-red-500/20 flex items-center gap-2"><FiAlertTriangle />Issue Warning</button>}
                        </div>
                        <div className="space-y-3">
                            {(data?.warnings || []).map((w: any) => (
                                <div key={w._id} className="glass-panel p-4 rounded-2xl border border-red-500/10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${w.level === 'critical' ? 'bg-red-900/50 text-red-300 border-red-500/30' : w.level === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/20' : w.level === 'medium' ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'}`}>{w.level} severity</span>
                                            <p className="font-bold text-white mt-2">{w.reason}</p>
                                            {w.notes && <p className="text-sm text-gray-400 mt-1">{w.notes}</p>}
                                        </div>
                                        <div className="text-right text-xs text-gray-500">
                                            <p>By: {w.issuedBy?.name}</p>
                                            <p>{new Date(w.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(data?.warnings || []).length === 0 && <div className="glass-panel p-10 text-center text-gray-500 rounded-3xl">✅ No warnings on record. Keep it up!</div>}
                        </div>
                    </div>
                )}

                {/* ──── REWARDS TAB ──── */}
                {activeTab === 'rewards' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Rewards & Recognition</h2>
                            {isLeader && <button onClick={() => setShowRewardModal(true)} className="bg-purple-500/20 text-purple-400 font-bold px-4 py-2 rounded-xl text-sm border border-purple-500/20 flex items-center gap-2"><FiAward />Grant Reward</button>}
                        </div>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {(data?.rewards || []).map((r: any) => (
                                <div key={r._id} className="glass-panel p-5 rounded-2xl border border-yellow-500/10 text-center space-y-2">
                                    <div className="text-4xl">{REWARD_ICONS[r.rewardType] || '🏅'}</div>
                                    <p className="font-extrabold text-white">{r.title}</p>
                                    <p className="text-xs text-gray-400">{r.rewardType.replace(/_/g, ' ')}</p>
                                    {r.notes && <p className="text-xs text-gray-500">{r.notes}</p>}
                                    <p className="text-[10px] text-gray-600">From: {r.grantedBy?.name} · {new Date(r.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))}
                            {(data?.rewards || []).length === 0 && <div className="glass-panel p-10 text-center text-gray-500 rounded-3xl col-span-3">No rewards yet. Earn your first one!</div>}
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════ MODALS ══════════ */}

            {/* New Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel w-full max-w-xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-white mb-5">Create New Task</h2>
                        <form onSubmit={createTask} className="space-y-4 text-sm">
                            <input required placeholder="Task title *" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" />
                            <textarea placeholder="Description" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" rows={3} />
                            <div className="grid grid-cols-2 gap-3">
                                <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} className="p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold">
                                    {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <input type="date" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} className="p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block">Assign to Members</label>
                                <div className="space-y-1 bg-slate-900 border border-blue-500/20 p-3 rounded-xl max-h-40 overflow-y-auto">
                                    {members.map((m: any) => (
                                        <label key={m._id} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                            <input type="checkbox" checked={taskForm.assignees.includes(m._id)} className="accent-accent"
                                                onChange={e => setTaskForm({ ...taskForm, assignees: e.target.checked ? [...taskForm.assignees, m._id] : taskForm.assignees.filter((a: any) => a !== m._id) })} />
                                            {m.name}
                                        </label>
                                    ))}
                                    {members.length === 0 && <p className="text-xs text-gray-500">No members loaded</p>}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-blue-500/30">
                                <button type="button" onClick={() => setShowTaskModal(false)} className="px-5 py-2.5 bg-slate-900 border border-blue-500/20 rounded-xl text-gray-300 font-bold">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 bg-gold text-black rounded-xl font-bold">Create Task</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Evaluate Modal */}
            {showEvalModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel w-full max-w-2xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-white mb-5">Evaluate Member</h2>
                        <div className="space-y-4 text-sm">
                            <select value={evalForm.memberId} onChange={e => setEvalForm({ ...evalForm, memberId: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold">
                                <option value="">Select member *</option>
                                {members.map((m: any) => <option key={m._id} value={m._id}>{m.name}</option>)}
                            </select>
                            <select value={evalForm.period} onChange={e => setEvalForm({ ...evalForm, period: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold">
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                {CRITERIA.map(c => (
                                    <div key={c} className="space-y-1">
                                        <div className="flex justify-between text-xs text-gray-400"><span>{CRITERIA_LABELS[c]}</span><span className="font-bold text-white">{evalForm[c]}/10</span></div>
                                        <input type="range" min="1" max="10" value={evalForm[c]} onChange={e => setEvalForm({ ...evalForm, [c]: parseInt(e.target.value) })} className="w-full accent-accent" />
                                    </div>
                                ))}
                            </div>
                            <div className="bg-gold/5 border border-gold/10 p-3 rounded-xl text-center">
                                <span className="text-xs text-gray-400 uppercase">Calculated Total Score</span>
                                <div className="text-3xl font-extrabold text-gold">{Math.round(CRITERIA.reduce((a, c) => a + evalForm[c], 0) / CRITERIA.length * 10)}<span className="text-sm text-gray-400">/100</span></div>
                            </div>
                            <textarea placeholder="Leader comment..." value={evalForm.leaderComment} onChange={e => setEvalForm({ ...evalForm, leaderComment: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" rows={2} />
                            <div className="flex justify-end gap-3 pt-4 border-t border-blue-500/30">
                                <button onClick={() => setShowEvalModal(false)} className="px-5 py-2.5 bg-slate-900 border border-blue-500/20 rounded-xl text-gray-300 font-bold">Cancel</button>
                                <button onClick={async () => {
                                    if (!evalForm.memberId) { alert('Select a member'); return; }
                                    const ok = await postAction('EVALUATE', evalForm);
                                    if (ok) { setShowEvalModal(false); fetchAll(user); }
                                }} className="px-5 py-2.5 bg-yellow-500 text-black rounded-xl font-bold">Submit Evaluation</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Warning Modal */}
            {showWarnModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel w-full max-w-md rounded-3xl p-6">
                        <h2 className="text-xl font-bold text-white mb-5">Issue Warning</h2>
                        <div className="space-y-3 text-sm">
                            <select value={warnForm.memberId} onChange={e => setWarnForm({ ...warnForm, memberId: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold">
                                <option value="">Select member *</option>
                                {members.map((m: any) => <option key={m._id} value={m._id}>{m.name}</option>)}
                            </select>
                            <input placeholder="Reason *" value={warnForm.reason} onChange={e => setWarnForm({ ...warnForm, reason: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" />
                            <select value={warnForm.level} onChange={e => setWarnForm({ ...warnForm, level: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold">
                                {['low', 'medium', 'high', 'critical'].map(l => <option key={l} value={l}>{l} severity</option>)}
                            </select>
                            <textarea placeholder="Additional notes..." value={warnForm.notes} onChange={e => setWarnForm({ ...warnForm, notes: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" rows={2} />
                            <div className="flex justify-end gap-3 pt-4 border-t border-blue-500/30">
                                <button onClick={() => setShowWarnModal(false)} className="px-5 py-2.5 bg-slate-900 border border-blue-500/20 rounded-xl text-gray-300 font-bold">Cancel</button>
                                <button onClick={async () => {
                                    if (!warnForm.memberId || !warnForm.reason) { alert('Fill required fields'); return; }
                                    const ok = await postAction('WARN', warnForm);
                                    if (ok) { setShowWarnModal(false); fetchAll(user); }
                                }} className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold">Issue Warning</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Reward Modal */}
            {showRewardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel w-full max-w-md rounded-3xl p-6">
                        <h2 className="text-xl font-bold text-white mb-5">Grant Reward</h2>
                        <div className="space-y-3 text-sm">
                            <select value={rewardForm.memberId} onChange={e => setRewardForm({ ...rewardForm, memberId: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold">
                                <option value="">Select member *</option>
                                {members.map((m: any) => <option key={m._id} value={m._id}>{m.name}</option>)}
                            </select>
                            <select value={rewardForm.rewardType} onChange={e => setRewardForm({ ...rewardForm, rewardType: e.target.value, title: e.target.value.replace(/_/g, ' ') })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold">
                                {Object.entries(REWARD_ICONS).map(([k, v]) => <option key={k} value={k}>{v} {k.replace(/_/g, ' ')}</option>)}
                            </select>
                            <input placeholder="Custom title" value={rewardForm.title} onChange={e => setRewardForm({ ...rewardForm, title: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" />
                            <textarea placeholder="Notes..." value={rewardForm.notes} onChange={e => setRewardForm({ ...rewardForm, notes: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" rows={2} />
                            <div className="flex justify-end gap-3 pt-4 border-t border-blue-500/30">
                                <button onClick={() => setShowRewardModal(false)} className="px-5 py-2.5 bg-slate-900 border border-blue-500/20 rounded-xl text-gray-300 font-bold">Cancel</button>
                                <button onClick={async () => {
                                    if (!rewardForm.memberId) { alert('Select a member'); return; }
                                    const ok = await postAction('REWARD', rewardForm);
                                    if (ok) { setShowRewardModal(false); fetchAll(user); }
                                }} className="px-5 py-2.5 bg-purple-500 text-white rounded-xl font-bold">Grant Reward</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Meeting Modal */}
            {showMeetingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel w-full max-w-md rounded-3xl p-6">
                        <h2 className="text-xl font-bold text-white mb-5">Schedule Meeting</h2>
                        <div className="space-y-3 text-sm">
                            <input placeholder="Meeting title *" value={meetingForm.title} onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="date" value={meetingForm.date} onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })} className="p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" />
                                <input type="time" value={meetingForm.time} onChange={e => setMeetingForm({ ...meetingForm, time: e.target.value })} className="p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" />
                            </div>
                            <input placeholder="Location (or 'Online')" value={meetingForm.location} onChange={e => setMeetingForm({ ...meetingForm, location: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" />
                            <input placeholder="Google Meet link (optional)" type="url" value={meetingForm.meetLink} onChange={e => setMeetingForm({ ...meetingForm, meetLink: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" />
                            <textarea placeholder="Agenda..." value={meetingForm.agenda} onChange={e => setMeetingForm({ ...meetingForm, agenda: e.target.value })} className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold" rows={2} />
                            <div className="flex justify-end gap-3 pt-4 border-t border-blue-500/30">
                                <button onClick={() => setShowMeetingModal(false)} className="px-5 py-2.5 bg-slate-900 border border-blue-500/20 rounded-xl text-gray-300 font-bold">Cancel</button>
                                <button onClick={async () => {
                                    if (!meetingForm.title || !meetingForm.date) { alert('Title and date required'); return; }
                                    const ok = await postAction('MEETING', meetingForm);
                                    if (ok) { setShowMeetingModal(false); fetchAll(user); }
                                }} className="px-5 py-2.5 bg-blue-500 text-white rounded-xl font-bold">Schedule</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
