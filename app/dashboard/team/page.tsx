'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiShield, FiCheckSquare, FiCalendar, FiAlertTriangle, FiAward, FiPieChart, FiUserCheck, FiPhone, FiMail } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';

function TeamDashboardContent() {
    const searchParams = useSearchParams();
    const teamIdParam = searchParams.get('teamId');

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTeamDashboard();
    }, [teamIdParam]);

    async function fetchTeamDashboard() {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        try {
            const query = teamIdParam ? `?teamId=${teamIdParam}` : '';
            const res = await fetch(`/api/community/teams/dashboard${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setData(await res.json());
            } else {
                const errData = await res.json();
                setError(errData.error || 'Failed to access team dashboard');
            }
        } catch {
            setError('A network error occurred while loading team dashboard');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="min-h-screen bg-dark text-accent flex items-center justify-center font-bold">Syncing Team Dashboard...</div>;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-dark p-8 flex items-center justify-center">
                <div className="glass p-8 rounded-3xl border border-red-500/20 max-w-md text-center space-y-4">
                    <FiAlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">Access Denied</h2>
                    <p className="text-gray-400 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    const { team, members, tasks, meetings, warnings, rewards, stats } = data;

    return (
        <div className="min-h-screen bg-dark text-white p-4 md:p-8 space-y-8 pb-16">
            {/* Header Banner */}
            <div className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 blur-3xl rounded-full pointer-events-none" style={{ backgroundColor: team?.color || '#00FF88', opacity: 0.15 }} />

                <div>
                    <span className="text-xs uppercase tracking-wider font-extrabold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-accent mb-3 inline-block">
                        {team?.committeeId?.name || 'Committee Sub-Team'}
                    </span>
                    <h1 className="text-4xl font-extrabold text-white mb-2">{team?.name} Team Dashboard</h1>
                    <p className="text-gray-400 text-sm max-w-2xl">{team?.description || 'Dedicated workspace for sub-team member management, task execution, and performance monitoring.'}</p>
                </div>

                <div className="flex gap-4">
                    <div className="glass p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                        <span className="text-2xl font-extrabold text-accent block">{stats.totalMembers}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Members</span>
                    </div>
                    <div className="glass p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                        <span className="text-2xl font-extrabold text-blue-400 block">{stats.averagePerformanceScore}%</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Score</span>
                    </div>
                </div>
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-5 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-gray-400 text-xs font-bold uppercase block">Completed Tasks</span>
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-extrabold text-accent">{stats.completedTasks} / {stats.totalTasks}</span>
                        <FiCheckSquare className="w-6 h-6 text-accent" />
                    </div>
                </div>
                <div className="glass p-5 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-gray-400 text-xs font-bold uppercase block">Attendance Rate</span>
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-extrabold text-blue-400">{stats.attendanceRate}</span>
                        <FiUserCheck className="w-6 h-6 text-blue-400" />
                    </div>
                </div>
                <div className="glass p-5 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-gray-400 text-xs font-bold uppercase block">Team Rewards</span>
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-extrabold text-yellow-400">{stats.rewardsCount}</span>
                        <FiAward className="w-6 h-6 text-yellow-400" />
                    </div>
                </div>
                <div className="glass p-5 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-gray-400 text-xs font-bold uppercase block">Warnings Issued</span>
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-extrabold text-red-400">{stats.warningsCount}</span>
                        <FiAlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                </div>
            </div>

            {/* Leadership Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Leader Card */}
                <div className="glass p-6 rounded-3xl border border-accent/20 bg-accent/5 space-y-4">
                    <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider">
                        <FiShield className="w-4 h-4" /> Team Leader
                    </div>
                    {team?.leaderId ? (
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center font-bold text-accent text-xl">
                                {team.leaderId.avatar ? <img src={team.leaderId.avatar} className="w-full h-full rounded-2xl object-cover" /> : team.leaderId.name[0]}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white">{team.leaderId.name}</h3>
                                <span className="text-xs text-accent font-mono block">@{team.leaderId.username}</span>
                                <div className="flex gap-3 text-xs text-gray-400 pt-1">
                                    {team.leaderId.email && <span className="flex items-center gap-1"><FiMail /> {team.leaderId.email}</span>}
                                    {team.leaderId.phone && <span className="flex items-center gap-1"><FiPhone /> {team.leaderId.phone}</span>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No Leader assigned to this team.</p>
                    )}
                </div>

                {/* Vice Leader Card */}
                <div className="glass p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5 space-y-4">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                        <FiUserCheck className="w-4 h-4" /> Vice Leader
                    </div>
                    {team?.viceLeaderId ? (
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center font-bold text-blue-400 text-xl">
                                {team.viceLeaderId.avatar ? <img src={team.viceLeaderId.avatar} className="w-full h-full rounded-2xl object-cover" /> : team.viceLeaderId.name[0]}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white">{team.viceLeaderId.name}</h3>
                                <span className="text-xs text-blue-400 font-mono block">@{team.viceLeaderId.username}</span>
                                <div className="flex gap-3 text-xs text-gray-400 pt-1">
                                    {team.viceLeaderId.email && <span className="flex items-center gap-1"><FiMail /> {team.viceLeaderId.email}</span>}
                                    {team.viceLeaderId.phone && <span className="flex items-center gap-1"><FiPhone /> {team.viceLeaderId.phone}</span>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No Vice Leader assigned to this team.</p>
                    )}
                </div>
            </div>

            {/* Team Members List */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FiUsers className="text-accent" /> Team Roster ({members.length})
                </h2>
                <div className="glass border border-white/5 rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-white/5 text-[10px] uppercase font-bold text-gray-400 border-b border-white/5">
                                <tr>
                                    <th className="p-4">Member</th>
                                    <th className="p-4">Username & Email</th>
                                    <th className="p-4">Position</th>
                                    <th className="p-4">Performance Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                                {members.length === 0 ? <tr><td colSpan={4} className="text-center p-8 text-gray-500">No members assigned to this team yet.</td></tr> : null}
                                {members.map((m: any) => (
                                    <tr key={m._id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 font-bold text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-xs font-bold text-accent">
                                                    {m.avatar ? <img src={m.avatar} className="w-full h-full rounded-full object-cover" /> : m.name[0].toUpperCase()}
                                                </div>
                                                <span>{m.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-xs">
                                            <span className="text-accent block">@{m.username}</span>
                                            <span className="text-gray-500 text-[11px] block">{m.email || 'No email'}</span>
                                        </td>
                                        <td className="p-4 text-xs font-bold text-gray-300">
                                            {m.position || 'Team Member'}
                                        </td>
                                        <td className="p-4 text-xs font-bold text-accent">
                                            {m.performanceScore || 100} pts
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Grid: Tasks & Meetings */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Tasks */}
                <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <FiCheckSquare className="text-accent" /> Team Tasks ({tasks.length})
                    </h3>
                    {tasks.length === 0 ? (
                        <p className="text-gray-500 text-sm">No tasks assigned to this team.</p>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map((t: any) => (
                                <div key={t._id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{t.title}</h4>
                                        <span className="text-gray-400 block">{t.description}</span>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${t.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                        {t.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Meetings */}
                <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <FiCalendar className="text-blue-400" /> Upcoming Meetings ({meetings.length})
                    </h3>
                    {meetings.length === 0 ? (
                        <p className="text-gray-500 text-sm">No upcoming meetings scheduled.</p>
                    ) : (
                        <div className="space-y-3">
                            {meetings.map((m: any) => (
                                <div key={m._id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{m.title}</h4>
                                        <span className="text-gray-400 block">{m.location || 'Online'}</span>
                                    </div>
                                    <span className="text-blue-400 font-bold">
                                        {m.date ? new Date(m.date).toLocaleDateString() : 'Scheduled'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TeamDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-dark text-accent flex items-center justify-center font-bold">Syncing Team Dashboard...</div>}>
            <TeamDashboardContent />
        </Suspense>
    );
}
