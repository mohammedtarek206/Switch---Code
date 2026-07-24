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

const MOCK_PROJECTS = [
    { id: '1', title: 'Switch Code Platform v2', status: 'in_progress', members: 5, tech: 'Next.js, MongoDB' },
    { id: '2', title: 'AI Chatbot Module', status: 'review', members: 3, tech: 'Python, FastAPI' },
    { id: '3', title: 'Mobile App', status: 'todo', members: 4, tech: 'Flutter, Dart' },
];

const MOCK_TASKS = [
    { id: '1', title: 'Build authentication system', assignee: 'Ahmed M.', due: '2026-07-30', status: 'in_progress' },
    { id: '2', title: 'Design dashboard UI', assignee: 'Sara K.', due: '2026-07-28', status: 'done' },
    { id: '3', title: 'Deploy to production', assignee: 'Omar T.', due: '2026-08-01', status: 'todo' },
];

const MOCK_ROADMAP = [
    { phase: 'Phase 1', title: 'Foundation', desc: 'Core architecture, DB schemas, Auth', done: true },
    { phase: 'Phase 2', title: 'Features', desc: 'Community system, Events, Tasks', done: true },
    { phase: 'Phase 3', title: 'Launch', desc: 'Public pages, Polish, Deploy', done: false },
    { phase: 'Phase 4', title: 'Scale', desc: 'Analytics, AI recommendations, Mobile', done: false },
];

const MOCK_RESOURCES = [
    { title: 'Next.js 14 Docs', url: 'https://nextjs.org/docs', tag: 'Frontend' },
    { title: 'MongoDB Aggregation Guide', url: 'https://www.mongodb.com', tag: 'Backend' },
    { title: 'Figma Community', url: 'https://figma.com', tag: 'UI/UX' },
    { title: 'OWASP Top 10', url: 'https://owasp.org', tag: 'Cyber Security' },
];

const MOCK_MEETINGS = [
    { title: 'Weekly Sync', date: '2026-07-28', time: '7:00 PM', link: '#' },
    { title: 'Code Review Session', date: '2026-07-30', time: '5:00 PM', link: '#' },
    { title: 'Sprint Planning', date: '2026-08-02', time: '6:00 PM', link: '#' },
];

const STATUS_COLORS: Record<string, string> = {
    todo: 'bg-gray-500/10 text-gray-400',
    in_progress: 'bg-blue-500/10 text-blue-400',
    review: 'bg-yellow-500/10 text-yellow-400',
    done: 'bg-green-500/10 text-green-400',
};

export default function TechnicalDashboard() {
    const [tab, setTab] = useState<Tab>('projects');
    const [track, setTrack] = useState('Frontend');
    const [committeeId, setCommitteeId] = useState('');
    const [memberCount, setMemberCount] = useState(0);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const techRoles = ['technical', 'committee_leader', 'vice_committee_leader', 'member', 'admin', 'super_admin'];
            if (!techRoles.includes(user.role)) window.location.href = '/dashboard';
            if (user.committeeId) setCommitteeId(user.committeeId);
        }
    }, []);

    const trackColor = TRACK_COLORS[track] || '#00A3FF';

    return (
        <div className="min-h-screen bg-dark text-white py-10 px-4 md:px-8">
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
                            className="bg-dark border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none" >
                            {Object.keys(TRACK_COLORS).map(t => <option key={t}>{t}</option>)}
                        </select>
                        <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white">← Dashboard</Link>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Active Projects', val: MOCK_PROJECTS.filter(p => p.status !== 'done').length, color: trackColor },
                        { label: 'Open Tasks', val: MOCK_TASKS.filter(t => t.status !== 'done').length, color: '#EAB308' },
                        { label: 'Next Meeting', val: MOCK_MEETINGS[0]?.date || '—', color: '#8B5CF6' },
                    ].map(s => (
                        <div key={s.label} className="glass p-5 rounded-2xl border border-white/5">
                            <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">{s.label}</span>
                            <span className="text-xl font-extrabold" style={{ color: s.color }}>{s.val}</span>
                        </div>
                    ))}
                </div>

                {/* Tab nav */}
                <div className="flex flex-wrap gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/5 w-fit">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setTab(key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${tab === key ? 'bg-white/10 text-white shadow' : 'text-gray-400 hover:text-white'
                                }`}
                            style={tab === key ? { color: trackColor } : {}}>
                            <Icon className="w-3.5 h-3.5" /> {label}
                        </button>
                    ))}
                </div>

                {/* Projects tab */}
                {tab === 'projects' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-white">Active Projects</h3>
                            <button className="flex items-center gap-2 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2 rounded-xl">
                                <FiPlus /> New Project
                            </button>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            {MOCK_PROJECTS.map((p, i) => (
                                <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                    className="glass p-6 rounded-2xl border border-white/5 space-y-3"
                                    style={{ borderTop: `3px solid ${trackColor}` }}>
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-white text-sm leading-tight">{p.title}</h4>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${STATUS_COLORS[p.status]}`}>
                                            {p.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-xs">{p.tech}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/5">
                                        <span className="flex items-center gap-1"><FiUsers className="w-3.5 h-3.5" /> {p.members} devs</span>
                                        <button className="flex items-center gap-1 text-accent hover:underline">Open <FiArrowRight className="w-3 h-3" /></button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tasks tab */}
                {tab === 'tasks' && (
                    <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                        <div className="p-5 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-bold text-white">Assignments</h3>
                            <button className="text-xs font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-1.5">
                                <FiPlus /> Add Task
                            </button>
                        </div>
                        <table className="w-full text-left">
                            <thead className="border-b border-white/5">
                                <tr className="text-gray-400 text-[10px] font-bold uppercase">
                                    <th className="p-4">Task</th><th className="p-4">Assignee</th><th className="p-4">Due Date</th><th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {MOCK_TASKS.map(t => (
                                    <tr key={t.id} className="hover:bg-white/[0.02]">
                                        <td className="p-4 text-white font-medium">{t.title}</td>
                                        <td className="p-4 text-gray-400 text-xs">{t.assignee}</td>
                                        <td className="p-4 text-gray-500 text-xs">{t.due}</td>
                                        <td className="p-4">
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${STATUS_COLORS[t.status]}`}>
                                                {t.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Roadmap tab */}
                {tab === 'roadmap' && (
                    <div className="space-y-4">
                        {MOCK_ROADMAP.map((r, i) => (
                            <div key={i} className="glass p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${r.done ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'
                                    }`}>
                                    {r.done ? '✓' : i + 1}
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">{r.phase}</span>
                                    <h4 className="font-bold text-white text-sm">{r.title}</h4>
                                    <p className="text-gray-400 text-xs">{r.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Resources tab */}
                {tab === 'resources' && (
                    <div className="space-y-3">
                        {MOCK_RESOURCES.map((r, i) => (
                            <div key={i} className="glass p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FiLink2 className="text-accent w-4 h-4" />
                                    <div>
                                        <span className="text-white font-semibold text-sm block">{r.title}</span>
                                        <span className="text-gray-500 text-xs">{r.tag}</span>
                                    </div>
                                </div>
                                <a href={r.url} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-accent hover:underline flex items-center gap-1">
                                    Open <FiArrowRight className="w-3 h-3" />
                                </a>
                            </div>
                        ))}
                        <button className="w-full glass p-4 rounded-2xl border border-dashed border-white/10 text-gray-500 text-sm hover:border-white/20 transition-all flex items-center justify-center gap-2">
                            <FiPlus /> Add Resource
                        </button>
                    </div>
                )}

                {/* Meetings tab */}
                {tab === 'meetings' && (
                    <div className="space-y-4">
                        {MOCK_MEETINGS.map((m, i) => (
                            <div key={i} className="glass p-6 rounded-2xl border border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/5 rounded-xl" style={{ color: trackColor }}><FiCalendar className="w-5 h-5" /></div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{m.title}</h4>
                                        <p className="text-gray-500 text-xs">{m.date} at {m.time}</p>
                                    </div>
                                </div>
                                <a href={m.link} className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                                    Join <FiArrowRight className="w-3 h-3" />
                                </a>
                            </div>
                        ))}
                    </div>
                )}

                {/* Progress tab */}
                {tab === 'progress' && (
                    <div className="space-y-6">
                        {[
                            { label: 'Tasks Completion Rate', value: 72 },
                            { label: 'Project Delivery Rate', value: 55 },
                            { label: 'Member Activity Score', value: 88 },
                            { label: 'Meeting Attendance', value: 91 },
                        ].map(m => (
                            <div key={m.label} className="glass p-6 rounded-2xl border border-white/5 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-300 font-medium">{m.label}</span>
                                    <span className="text-white font-bold">{m.value}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div className="h-full rounded-full" style={{ backgroundColor: trackColor }}
                                        initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 0.8, delay: 0.2 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
