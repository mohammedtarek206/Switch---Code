'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiCpu, FiCheckSquare, FiBook, FiMap, FiLink2, FiClipboard,
    FiCalendar, FiTrendingUp, FiPlus, FiUsers, FiArrowRight
} from 'react-icons/fi';
import Link from 'next/link';

type Tab = 'projects' | 'tasks' | 'roadmap' | 'resources' | 'meetings' | 'progress';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'projects', label: 'Projects', icon: FiCpu },
    { key: 'tasks', label: 'Assignments', icon: FiCheckSquare },
    { key: 'roadmap', label: 'Roadmap', icon: FiMap },
    { key: 'resources', label: 'Resources', icon: FiBook },
    { key: 'meetings', label: 'Meetings', icon: FiCalendar },
    { key: 'progress', label: 'Progress', icon: FiTrendingUp },
];

const TRACK_COLORS: Record<string, string> = {
    Frontend: '#00A3FF',
    Backend: '#00FF88',
    'Cyber Security': '#FF4757',
    AI: '#F59E0B',
    Flutter: '#54C5F8',
    'Data Science': '#8B5CF6',
    'UI/UX': '#EC4899',
    Embedded: '#6B7280',
};

const STATUS_COLORS: Record<string, string> = {
    todo: 'bg-gray-500/10 text-gray-400',
    in_progress: 'bg-blue-500/10 text-blue-400',
    review: 'bg-yellow-500/10 text-yellow-400',
    done: 'bg-green-500/10 text-green-400',
};

export default function TechnicalDashboard() {
    const [tab, setTab] = useState<Tab>('tasks');
    const [track, setTrack] = useState('Frontend');
    const [loading, setLoading] = useState(true);

    // Dynamic data from API
    const [tasks, setTasks] = useState<any[]>([]);
    const [meetings, setMeetings] = useState<any[]>([]);
    const [committeeStats, setCommitteeStats] = useState<any>(null);

    const trackColor = TRACK_COLORS[track] || '#00A3FF';

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const techRoles = ['technical', 'committee_leader', 'vice_committee_leader', 'member', 'admin', 'super_admin'];
            if (!techRoles.includes(user.role)) window.location.href = '/dashboard';
        }
        fetchWorkspaceData();
    }, []);

    async function fetchWorkspaceData() {
        const token = localStorage.getItem('token');
        const timeoutId = setTimeout(() => setLoading(false), 1500);
        try {
            const res = await fetch('/api/committee/workspace', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks || []);
                setMeetings(data.meetings || []);
                setCommitteeStats(data.committeeStats || null);
            }
        } catch (err) {
            console.error('Failed to fetch workspace data', err);
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    }

    const openTasks = tasks.filter((t: any) => t.status !== 'done');
    const doneTasks = tasks.filter((t: any) => t.status === 'done');
    const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
    const nextMeeting = meetings.find((m: any) => new Date(m.date) >= new Date());

    return (
        <div className="min-h-screen bg-[#07111F] text-white py-10 px-4 md:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-2 border"
                            style={{ backgroundColor: `${trackColor}15`, borderColor: `${trackColor}30`, color: trackColor }}>
                            Technical Committee
                        </div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-2">
                            <FiCpu style={{ color: trackColor }} /> {track} Division
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Manage projects, assignments, resources, and team progress.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select value={track} onChange={e => setTrack(e.target.value)}
                            className="bg-[#07111F] border border-blue-500/30 rounded-xl px-4 py-2.5 text-white text-sm outline-none">
                            {Object.keys(TRACK_COLORS).map(t => <option key={t}>{t}</option>)}
                        </select>
                        <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white">← Dashboard</Link>
                    </div>
                </div>

                {/* Quick stats — dynamic from API */}
                <div className="grid grid-cols-3 gap-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="glass-panel p-5 rounded-2xl border border-blue-500/20 animate-pulse">
                                <div className="h-3 w-20 bg-slate-800 rounded mb-2" />
                                <div className="h-7 w-12 bg-slate-800 rounded" />
                            </div>
                        ))
                    ) : (
                        [
                            { label: 'Open Tasks', val: openTasks.length, color: trackColor },
                            { label: 'Completed Tasks', val: doneTasks.length, color: '#10B981' },
                            { label: 'Next Meeting', val: nextMeeting ? new Date(nextMeeting.date).toLocaleDateString() : 'None Scheduled', color: '#8B5CF6' },
                        ].map(s => (
                            <div key={s.label} className="glass-panel p-5 rounded-2xl border border-blue-500/20">
                                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">{s.label}</span>
                                <span className="text-xl font-extrabold" style={{ color: s.color }}>{s.val}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* Tab nav */}
                <div className="flex flex-wrap gap-1.5 bg-slate-900 border border-blue-500/20 p-1.5 rounded-2xl w-fit">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setTab(key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${tab === key ? 'bg-slate-800 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            style={tab === key ? { color: trackColor } : {}}>
                            <Icon className="w-3.5 h-3.5" /> {label}
                        </button>
                    ))}
                </div>

                {/* Tasks tab — Dynamic */}
                {tab === 'tasks' && (
                    <div className="glass-panel rounded-3xl border border-blue-500/20 overflow-hidden">
                        <div className="p-5 border-b border-blue-500/20 flex justify-between items-center">
                            <h3 className="font-bold text-white">My Assignments</h3>
                        </div>
                        {loading ? (
                            <div className="p-5 space-y-3 animate-pulse">
                                {[1, 2, 3].map(n => <div key={n} className="h-12 bg-slate-900 rounded-xl" />)}
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 text-sm">
                                No tasks assigned yet.
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="border-b border-blue-500/20">
                                    <tr className="text-gray-400 text-[10px] font-bold uppercase">
                                        <th className="p-4">Task</th>
                                        <th className="p-4">Assignee</th>
                                        <th className="p-4">Due Date</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {tasks.map((t: any) => (
                                        <tr key={t._id} className="hover:bg-white/[0.02]">
                                            <td className="p-4 text-white font-medium">{t.title}</td>
                                            <td className="p-4 text-gray-400 text-xs">
                                                {Array.isArray(t.assignees)
                                                    ? t.assignees.map((a: any) => a.name || a).join(', ')
                                                    : t.assignees?.name || 'Unassigned'}
                                            </td>
                                            <td className="p-4 text-gray-500 text-xs">
                                                {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${STATUS_COLORS[t.status] || STATUS_COLORS.todo}`}>
                                                    {(t.status || 'todo').replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Projects tab — replaced with committee stats */}
                {tab === 'projects' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-white">Committee Task Overview</h3>
                        {loading ? (
                            <div className="grid md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 glass-panel rounded-2xl animate-pulse" />)}</div>
                        ) : committeeStats ? (
                            <div className="grid md:grid-cols-3 gap-4">
                                {[
                                    { label: 'Total Tasks', val: committeeStats.totalTasks, color: trackColor },
                                    { label: 'Completed', val: committeeStats.completedTasks, color: '#10B981' },
                                    { label: 'Late Tasks', val: committeeStats.lateTasks, color: '#EF4444' },
                                    { label: 'Members', val: committeeStats.memberCount, color: '#8B5CF6' },
                                    { label: 'Total Warnings', val: committeeStats.totalWarnings, color: '#F59E0B' },
                                    { label: 'Total Rewards', val: committeeStats.totalRewards, color: '#EC4899' },
                                ].map(s => (
                                    <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                        className="glass-panel p-6 rounded-2xl border border-blue-500/20">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">{s.label}</span>
                                        <span className="text-2xl font-black" style={{ color: s.color }}>{s.val}</span>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="glass-panel p-12 rounded-2xl text-center text-gray-500 border border-blue-500/20">
                                No committee data available. You may not be assigned to a committee yet.
                            </div>
                        )}
                    </div>
                )}

                {/* Roadmap tab — committee progress */}
                {tab === 'roadmap' && (
                    <div className="space-y-4">
                        <div className="glass-panel p-6 rounded-2xl border border-blue-500/20">
                            <h3 className="font-bold text-white mb-4">Task Completion Progress</h3>
                            {loading ? (
                                <div className="h-8 bg-slate-900 rounded-full animate-pulse" />
                            ) : (
                                <>
                                    <div className="flex justify-between text-sm mb-2 text-slate-300 font-bold">
                                        <span>Overall Completion Rate</span>
                                        <span style={{ color: trackColor }}>{completionRate}%</span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-blue-500/20">
                                        <motion.div className="h-full rounded-full" style={{ backgroundColor: trackColor }}
                                            initial={{ width: 0 }} animate={{ width: `${completionRate}%` }} transition={{ duration: 0.8 }} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mt-6">
                                        <div className="text-center bg-slate-900 rounded-2xl p-4 border border-blue-500/20">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">To Do</span>
                                            <span className="text-2xl font-black text-gray-400">{tasks.filter(t => t.status === 'todo').length}</span>
                                        </div>
                                        <div className="text-center bg-slate-900 rounded-2xl p-4 border border-blue-500/20">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">In Progress</span>
                                            <span className="text-2xl font-black text-blue-400">{tasks.filter(t => t.status === 'in_progress').length}</span>
                                        </div>
                                        <div className="text-center bg-slate-900 rounded-2xl p-4 border border-blue-500/20">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Done</span>
                                            <span className="text-2xl font-black text-green-400">{doneTasks.length}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Resources tab — static links (committee-curated, not user data) */}
                {tab === 'resources' && (
                    <div className="space-y-3">
                        <div className="glass-panel p-6 rounded-2xl border border-blue-500/20 text-center text-gray-500 text-sm">
                            <FiBook className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                            Resource links are managed by the committee leader via the admin panel.
                        </div>
                    </div>
                )}

                {/* Meetings tab — dynamic from API */}
                {tab === 'meetings' && (
                    <div className="space-y-4">
                        {loading ? (
                            <div className="space-y-3 animate-pulse">
                                {[1, 2, 3].map(n => <div key={n} className="h-20 glass-panel rounded-2xl border border-blue-500/20" />)}
                            </div>
                        ) : meetings.length === 0 ? (
                            <div className="glass-panel p-12 rounded-2xl text-center text-gray-500 border border-blue-500/20">
                                No meetings scheduled.
                            </div>
                        ) : (
                            meetings.map((m: any, i: number) => (
                                <div key={m._id || i} className="glass-panel p-6 rounded-2xl border border-blue-500/20 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-900 border border-blue-500/20 rounded-xl" style={{ color: trackColor }}>
                                            <FiCalendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{m.title}</h4>
                                            <p className="text-gray-500 text-xs">
                                                {m.date ? new Date(m.date).toLocaleDateString() : '—'}
                                                {m.agenda ? ` · ${m.agenda}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    {m.link && (
                                        <a href={m.link} target="_blank" rel="noopener noreferrer"
                                            className="text-xs font-bold text-gold hover:underline flex items-center gap-1">
                                            Join <FiArrowRight className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Progress tab — dynamic */}
                {tab === 'progress' && (
                    <div className="space-y-6">
                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                {[1, 2].map(n => <div key={n} className="h-20 glass-panel rounded-2xl border border-blue-500/20" />)}
                            </div>
                        ) : (
                            [
                                { label: 'Tasks Completion Rate', value: completionRate },
                                { label: 'Overall Committee Rate', value: committeeStats?.completionRate ?? 0 },
                            ].map(m => (
                                <div key={m.label} className="glass-panel p-6 rounded-2xl border border-blue-500/20 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-300 font-medium">{m.label}</span>
                                        <span className="text-white font-bold">{m.value}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-900 border border-blue-500/20 rounded-full overflow-hidden">
                                        <motion.div className="h-full rounded-full" style={{ backgroundColor: trackColor }}
                                            initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 0.8, delay: 0.2 }} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
