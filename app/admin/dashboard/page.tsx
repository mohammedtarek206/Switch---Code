'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiBook, FiUsers, FiCalendar, FiFileText, FiAward, FiGrid,
    FiTrendingUp, FiActivity, FiUserCheck, FiClock, FiPlusCircle
} from 'react-icons/fi';
import Link from 'next/link';

interface DashboardStats {
    stats: {
        totalUsers: number;
        studentsCount: number;
        instructorsCount: number;
        tracksCount: number;
        eventsCount: number;
        eventRegistrationsCount: number;
        jobApplicationsCount: number;
        certificatesCount: number;
        partnersCount: number;
        projectsCount: number;
        teamMembersCount: number;
        committeesCount: number;
        revenueEstimate: number;
    };
    recentActivities: any[];
    recentRegistrations: any[];
    recentJobApplications: any[];
    recentEvents: any[];
}

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/admin/dashboard-stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardStats();
    }, []);

    const statCards = [
        { title: 'Total Students', value: data?.stats.studentsCount ?? 0, icon: FiUsers, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
        { title: 'Tracks & Courses', value: data?.stats.tracksCount ?? 0, icon: FiBook, color: 'text-gold', bg: 'bg-gold/10 border-gold/20' },
        { title: 'Total Events', value: data?.stats.eventsCount ?? 0, icon: FiCalendar, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        { title: 'Event Registrations', value: data?.stats.eventRegistrationsCount ?? 0, icon: FiUserCheck, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
        { title: 'Job Applications', value: data?.stats.jobApplicationsCount ?? 0, icon: FiFileText, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
        { title: 'Issued Certificates', value: data?.stats.certificatesCount ?? 0, icon: FiAward, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        { title: 'Community Committees', value: data?.stats.committeesCount ?? 0, icon: FiGrid, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
        { title: 'Estimated Revenue', value: `$${(data?.stats.revenueEstimate ?? 0).toLocaleString()}`, icon: FiTrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    ];

    return (
        <div className="space-y-8 pb-16">
            {/* Header */}
            <div className="glass-panel p-8 rounded-3xl border border-blue-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-gold/10 border border-gold/20 px-3 py-1 rounded-full mb-2 inline-block">
                        Real-Time Control Center
                    </span>
                    <h1 className="text-3xl font-black text-white">Admin Operations Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-1">Full overview of platform registrations, courses, metrics, and live user activities.</p>
                </div>
                <Link
                    href="/admin/community/events/applications"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-lg"
                >
                    <FiUserCheck /> Manage Event Attendees
                </Link>
            </div>

            {/* Metrics Grid with Skeletons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {loading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="glass-panel p-6 rounded-2xl animate-pulse space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800" />
                            <div className="h-3 w-24 bg-slate-800 rounded" />
                            <div className="h-7 w-16 bg-slate-800 rounded" />
                        </div>
                    ))
                    : statCards.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                            className="glass-panel p-6 rounded-2xl border flex items-center space-x-4 hover:border-gold/40 transition-colors group"
                        >
                            <div className={`p-4 rounded-2xl border ${stat.bg} ${stat.color} shrink-0 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.title}</p>
                                <h3 className="text-2xl font-black text-white mt-0.5 group-hover:text-gold transition-colors">{stat.value}</h3>
                            </div>
                        </motion.div>
                    ))}
            </div>

            {/* Live Feed & Recent Activity Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Recent Event Applications */}
                <div className="glass-panel p-6 rounded-3xl border border-blue-500/20 space-y-4">
                    <div className="flex justify-between items-center border-b border-blue-500/20 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FiUserCheck className="text-gold" /> Latest Event Registrations
                        </h3>
                        <Link href="/admin/community/events/applications" className="text-xs text-blue-400 font-bold hover:underline">
                            View All →
                        </Link>
                    </div>

                    {loading ? (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2, 3].map(n => <div key={n} className="h-14 bg-slate-900 rounded-xl" />)}
                        </div>
                    ) : !data?.recentRegistrations?.length ? (
                        <p className="text-slate-500 text-xs text-center py-8">No recent event registrations found.</p>
                    ) : (
                        <div className="space-y-3">
                            {data.recentRegistrations.map((reg: any) => (
                                <div key={reg._id} className="bg-slate-900/60 p-4 rounded-2xl border border-blue-500/10 flex items-center justify-between">
                                    <div>
                                        <span className="text-white font-bold text-sm block">{reg.name}</span>
                                        <span className="text-slate-400 text-xs">{reg.email} • {reg.eventId?.title || 'Event'}</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                                        {reg.status || 'registered'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Audit & System Activity Logs */}
                <div className="glass-panel p-6 rounded-3xl border border-blue-500/20 space-y-4">
                    <div className="flex justify-between items-center border-b border-blue-500/20 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FiActivity className="text-blue-400" /> Recent System Audit Logs
                        </h3>
                        <Link href="/admin/community/logs" className="text-xs text-blue-400 font-bold hover:underline">
                            View Logs →
                        </Link>
                    </div>

                    {loading ? (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2, 3].map(n => <div key={n} className="h-14 bg-slate-900 rounded-xl" />)}
                        </div>
                    ) : !data?.recentActivities?.length ? (
                        <p className="text-slate-500 text-xs text-center py-8">No recent activity logs recorded.</p>
                    ) : (
                        <div className="space-y-3">
                            {data.recentActivities.map((act: any) => (
                                <div key={act._id} className="bg-slate-900/60 p-4 rounded-2xl border border-blue-500/10 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs">
                                            {act.userId?.name?.[0]?.toUpperCase() || 'S'}
                                        </div>
                                        <div>
                                            <span className="text-white font-semibold text-xs block">{act.action}</span>
                                            <span className="text-slate-500 text-[10px]">{act.userId?.name || 'User'} • {new Date(act.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                        <FiClock /> {new Date(act.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="glass-panel p-6 rounded-3xl border border-blue-500/20 space-y-4">
                <h3 className="text-lg font-bold text-gold flex items-center gap-2">
                    <FiPlusCircle /> System Management Shortcuts
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/admin/community/events" className="p-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-2xl text-xs font-bold text-blue-400 text-center transition-all">
                        ➕ Manage Events & Questions
                    </Link>
                    <Link href="/admin/tracks" className="p-4 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-2xl text-xs font-bold text-gold text-center transition-all">
                        📚 Manage Tracks & Courses
                    </Link>
                    <Link href="/admin/community/accounts" className="p-4 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 rounded-2xl text-xs font-bold text-purple-400 text-center transition-all">
                        👥 Users & Accounts
                    </Link>
                    <Link href="/admin/partners" className="p-4 bg-green-600/10 hover:bg-green-600/20 border border-green-500/30 rounded-2xl text-xs font-bold text-green-400 text-center transition-all">
                        🤝 Partners & Team
                    </Link>
                </div>
            </div>
        </div>
    );
}

