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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    const cards = [
        { title: 'Total Members', value: stats?.members.total || 0, icon: FiUsers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { title: 'Committees', value: stats?.committees.total || 0, icon: FiGrid, color: 'text-green-500', bg: 'bg-green-500/10' },
        { title: 'Events', value: stats?.events.total || 0, icon: FiCalendar, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { title: 'Applicants', value: stats?.applications.total || 0, icon: FiFileText, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        { title: 'Completed Tasks', value: stats?.tasks.completed || 0, icon: FiCheckSquare, color: 'text-red-500', bg: 'bg-red-500/10' },
        { title: 'Attendance Rate', value: `${stats?.attendance.rate || 0}%`, icon: FiClock, color: 'text-pink-500', bg: 'bg-pink-500/10' }
    ];

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Community Overview</h1>
                <p className="text-gray-400">Track and monitor community roles, performance scores, logs, and events.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {cards.map((card, idx) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass p-6 rounded-2xl flex flex-col justify-between"
                    >
                        <div className={`p-3 w-fit rounded-xl ${card.bg} ${card.color} mb-4`}>
                            <card.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{card.title}</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{card.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Performance Metrics */}
                <div className="glass p-8 rounded-2xl lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-white">Community Engagement Metrics & Volunteer Hours</h3>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2 text-gray-300">
                                <span>Task Completion Efficiency</span>
                                <span className="text-accent font-bold">{stats?.tasks.completionRate}%</span>
                            </div>
                            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-accent" style={{ width: `${stats?.tasks.completionRate || 0}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2 text-gray-300">
                                <span>Active Member Ratio</span>
                                <span className="text-primary font-bold">
                                    {stats?.members.total ? Math.round(((stats.members.active / stats.members.total) * 100)) : 0}%
                                </span>
                            </div>
                            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${stats?.members.total ? Math.round(((stats.members.active / stats.members.total) * 100)) : 0}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2 text-gray-300">
                                <span>Event Attendance Quality</span>
                                <span className="text-pink-500 font-bold">{stats?.attendance.rate}%</span>
                            </div>
                            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-pink-500" style={{ width: `${stats?.attendance.rate || 0}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold block mb-1">Total Volunteer Hours</span>
                            <span className="text-2xl font-extrabold text-accent">{stats?.volunteerHours} hrs</span>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold block mb-1">Total Training Hours</span>
                            <span className="text-2xl font-extrabold text-primary">{stats?.trainingHours} hrs</span>
                        </div>
                    </div>
                </div>

                {/* Highlights & Top Scorer */}
                <div className="glass p-8 rounded-2xl space-y-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-6">Top Standings</h3>

                        {stats?.topScorer ? (
                            <div className="bg-white/5 p-4 rounded-xl flex items-center space-x-4 mb-4">
                                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent text-xl font-bold">
                                    {stats.topScorer.avatar ? (
                                        <img src={stats.topScorer.avatar} alt={stats.topScorer.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        stats.topScorer.name[0].toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold">{stats.topScorer.name}</h4>
                                    <p className="text-gray-400 text-xs">Top Performer • Score: {stats.topScorer.performanceScore}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-4">No performer selected yet.</p>
                        )}

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Popular Event (Max Tickets)</p>
                                <p className="text-white font-bold">{stats?.events.maxTicket?.title || 'None'}</p>
                                <span className="text-xs text-accent">{stats?.events.maxTicket?.registrations || 0} registrations</span>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Closed/Introductory Event (Min Tickets)</p>
                                <p className="text-white font-bold">{stats?.events.minTicket?.title || 'None'}</p>
                                <span className="text-xs text-pink-500">{stats?.events.minTicket?.registrations || 0} registrations</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-xs text-center text-primary-light">
                        Data is aggregated automatically in real-time from community logs and performance score trackers.
                    </div>
                </div>
            </div>
        </div>
    );
}
