'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiGrid, FiCalendar, FiFileText, FiAward, FiCheckSquare, FiClock } from 'react-icons/fi';

interface StatsData {
    members: { total: number; active: number; inactive: number };
    committees: { total: number };
    events: { total: number; maxTicket?: { title: string; registrations: number }; minTicket?: { title: string; registrations: number } };
    applications: { total: number; accepted: number };
    tasks: { total: number; completed: number; completionRate: number };
    attendance: { rate: number; totalRegistrations: number; totalAttended: number };
    topScorer?: { name: string; performanceScore: number; avatar?: string };
    volunteerHours: number;
    trainingHours: number;
}

export default function CommunityDashboard() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/community/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const cards = [
        { title: 'Total Members', value: stats?.members.total || 0, icon: FiUsers, color: 'text-blue-500', bg: 'bg-blue-500/10 border border-blue-500/20' },
        { title: 'Committees', value: stats?.committees.total || 0, icon: FiGrid, color: 'text-gold', bg: 'bg-gold/10 border border-gold/20' },
        { title: 'Events', value: stats?.events.total || 0, icon: FiCalendar, color: 'text-purple-500', bg: 'bg-purple-500/10 border border-purple-500/20' },
        { title: 'Applicants', value: stats?.applications.total || 0, icon: FiFileText, color: 'text-teal-500', bg: 'bg-teal-500/10 border border-teal-500/20' },
        { title: 'Completed Tasks', value: stats?.tasks.completed || 0, icon: FiCheckSquare, color: 'text-green-500', bg: 'bg-green-500/10 border border-green-500/20' },
        { title: 'Attendance Rate', value: `${stats?.attendance.rate || 0}%`, icon: FiClock, color: 'text-pink-500', bg: 'bg-pink-500/10 border border-pink-500/20' }
    ];

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Community Overview</h1>
                <p className="text-slate-400 font-medium">Track and monitor community roles, performance scores, logs, and events.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {cards.map((card, idx) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass-card p-6 rounded-3xl flex flex-col justify-between group"
                    >
                        <div className={`p-3 w-fit rounded-xl ${card.bg} ${card.color} mb-4 transition-transform group-hover:scale-110`}>
                            <card.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-extrabold">{card.title}</p>
                            <h3 className="text-3xl font-black text-white mt-1 group-hover:text-gold transition-colors">{card.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Performance Metrics */}
                <div className="glass-panel p-8 rounded-3xl lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-white">Community Engagement Metrics & Volunteer Hours</h3>

                    <div className="space-y-5">
                        <div>
                            <div className="flex justify-between text-sm mb-2 text-slate-300 font-bold">
                                <span>Task Completion Efficiency</span>
                                <span className="text-gold">{stats?.tasks.completionRate}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-blue-500/20">
                                <div className="h-full bg-gold rounded-full shadow-glow-gold" style={{ width: `${stats?.tasks.completionRate || 0}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2 text-slate-300 font-bold">
                                <span>Active Member Ratio</span>
                                <span className="text-blue-500">
                                    {stats?.members.total ? Math.round(((stats.members.active / stats.members.total) * 100)) : 0}%
                                </span>
                            </div>
                            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-blue-500/20">
                                <div className="h-full bg-blue-500 rounded-full shadow-glow-blue" style={{ width: `${stats?.members.total ? Math.round(((stats.members.active / stats.members.total) * 100)) : 0}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2 text-slate-300 font-bold">
                                <span>Event Attendance Quality</span>
                                <span className="text-pink-500">{stats?.attendance.rate}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-blue-500/20">
                                <div className="h-full bg-pink-500 rounded-full shadow-[0_0_20px_rgba(236,72,153,0.5)]" style={{ width: `${stats?.attendance.rate || 0}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-blue-500/20">
                        <div className="text-center p-5 bg-slate-900 border border-blue-500/20 rounded-2xl">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold block mb-1">Total Volunteer Hours</span>
                            <span className="text-3xl font-black text-gold">{stats?.volunteerHours} <span className="text-lg">hrs</span></span>
                        </div>
                        <div className="text-center p-5 bg-slate-900 border border-blue-500/20 rounded-2xl">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold block mb-1">Total Training Hours</span>
                            <span className="text-3xl font-black text-blue-500">{stats?.trainingHours} <span className="text-lg">hrs</span></span>
                        </div>
                    </div>
                </div>

                {/* Highlights & Top Scorer */}
                <div className="glass-panel p-8 rounded-3xl space-y-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-6">Top Standings</h3>

                        {stats?.topScorer ? (
                            <div className="bg-slate-900 border border-gold/30 p-4 rounded-2xl flex items-center space-x-4 mb-4 relative overflow-hidden shadow-glow-gold">
                                <div className="absolute top-0 right-3 text-2xl font-bold text-gold animate-bounce">👑</div>
                                <div className="w-12 h-12 bg-blue-900/30 border-2 border-gold rounded-full flex items-center justify-center text-gold text-xl font-black overflow-hidden shrink-0 shadow-lg shadow-gold/20">
                                    {stats.topScorer.avatar ? (
                                        <img src={stats.topScorer.avatar} alt={stats.topScorer.name} className="w-full h-full object-cover" />
                                    ) : (
                                        stats.topScorer.name[0].toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-white font-black">{stats.topScorer.name}</h4>
                                    <p className="text-slate-400 text-xs font-semibold">Top Performer • ⭐ {stats.topScorer.performanceScore} pts</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm text-center py-4 bg-slate-900 rounded-xl border border-blue-500/20">No performer selected yet.</p>
                        )}

                        <div className="space-y-4 pt-4 border-t border-blue-500/20">
                            <div className="bg-slate-900 p-4 rounded-xl border border-blue-500/20">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Popular Event (Max Tickets)</p>
                                <p className="text-white font-bold text-sm truncate">{stats?.events.maxTicket?.title || 'None'}</p>
                                <span className="text-xs font-bold text-gold">{stats?.events.maxTicket?.registrations || 0} registrations</span>
                            </div>
                            <div className="bg-slate-900 p-4 rounded-xl border border-blue-500/20">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Introductory Event</p>
                                <p className="text-white font-bold text-sm truncate">{stats?.events.minTicket?.title || 'None'}</p>
                                <span className="text-xs font-bold text-pink-500">{stats?.events.minTicket?.registrations || 0} registrations</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl text-xs font-semibold text-center text-blue-300">
                        Data is aggregated automatically in real-time from community logs and performance score trackers.
                    </div>
                </div>
            </div>
        </div>
    );
}
