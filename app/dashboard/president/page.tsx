'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiTrendingUp, FiTrendingDown, FiUsers, FiAward, FiAlertOctagon,
    FiActivity, FiMap, FiArrowRight, FiCalendar, FiCheckSquare
} from 'react-icons/fi';
import Link from 'next/link';

export default function PresidentDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [topCommittees, setTopCommittees] = useState<any[]>([]);
    const [lowCommittees, setLowCommittees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const u = JSON.parse(userStr);
            if (!['president', 'vice_president', 'admin', 'super_admin'].includes(u.role)) {
                window.location.href = '/dashboard';
                return;
            }
        }
        fetchPresidentData();
    }, []);

    async function fetchPresidentData() {
        const token = localStorage.getItem('token');
        const timeoutId = setTimeout(() => setLoading(false), 2000);
        try {
            // Fetch community stats (members, committees, tasks, events)
            const [statsRes, committeesRes] = await Promise.all([
                fetch('/api/community/stats', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/community/committees', { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }

            if (committeesRes.ok) {
                const comms = await committeesRes.json();
                const sorted = [...comms].sort((a: any, b: any) =>
                    (b.completionRate || 0) - (a.completionRate || 0)
                );
                setTopCommittees(sorted.slice(0, 3));
                setLowCommittees(sorted.slice(-2).reverse());
            }
        } catch (err) {
            console.error('Failed to fetch president data', err);
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#07111F] text-white py-10 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="inline-flex items-center bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-bold text-yellow-400 mb-2 uppercase">
                            Presidential Board
                        </div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-2">Supreme Dashboard</h1>
                        <p className="text-gray-400 text-sm mt-1">High-level executive oversight of all Switch Code community operations.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/admin/community/announcements" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all">
                            Global Announcement
                        </Link>
                    </div>
                </div>

                {/* Supreme Stats — Dynamic */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="glass-panel p-5 rounded-2xl border border-blue-500/20 animate-pulse">
                                <div className="h-3 w-20 bg-slate-800 rounded mb-2" />
                                <div className="h-7 w-12 bg-slate-800 rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: 'Total Members', val: stats?.members?.total ?? 0, icon: FiUsers, color: 'text-white' },
                            { label: 'Committees', val: stats?.committees?.total ?? 0, icon: FiMap, color: 'text-blue-400' },
                            { label: 'Events', val: stats?.events?.total ?? 0, icon: FiCalendar, color: 'text-blue-500' },
                            { label: 'Completed Tasks', val: stats?.tasks?.completed ?? 0, icon: FiCheckSquare, color: 'text-green-400' },
                            { label: 'Accepted Members', val: stats?.applications?.accepted ?? 0, icon: FiAward, color: 'text-yellow-400' },
                        ].map((s, i) => (
                            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                className="glass-panel p-5 rounded-2xl border border-blue-500/20 flex items-center justify-between group">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-gray-400 transition-colors">{s.label}</p>
                                    <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.val}</p>
                                </div>
                                <div className="p-3 bg-slate-900 border border-blue-500/20 rounded-xl text-gray-500 group-hover:text-white transition-all">
                                    <s.icon className="w-5 h-5" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Committee Insights — Dynamic */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="glass-panel p-6 rounded-3xl border border-green-500/20 bg-green-500/5">
                        <h3 className="font-bold text-green-400 mb-4 flex items-center gap-2">
                            <FiTrendingUp className="w-5 h-5" /> Top Performing Committees
                        </h3>
                        {loading ? (
                            <div className="space-y-3 animate-pulse">
                                {[1, 2, 3].map(n => <div key={n} className="h-14 bg-slate-900 rounded-xl" />)}
                            </div>
                        ) : topCommittees.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No committee data available.</p>
                        ) : (
                            <div className="space-y-3">
                                {topCommittees.map((c: any) => (
                                    <div key={c._id} className="flex justify-between items-center p-3 bg-[#07111F]/80 rounded-xl border border-blue-500/20">
                                        <div>
                                            <h4 className="text-white text-sm font-bold">{c.name}</h4>
                                            <p className="text-xs text-gray-400">{c.type || 'Committee'}</p>
                                        </div>
                                        <span className="text-xl font-extrabold text-green-400">
                                            {c.completionRate ?? '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="glass-panel p-6 rounded-3xl border border-red-500/20 bg-red-500/5">
                        <h3 className="font-bold text-red-500 mb-4 flex items-center gap-2">
                            <FiTrendingDown className="w-5 h-5" /> Committees Needing Attention
                        </h3>
                        {loading ? (
                            <div className="space-y-3 animate-pulse">
                                {[1, 2].map(n => <div key={n} className="h-14 bg-slate-900 rounded-xl" />)}
                            </div>
                        ) : lowCommittees.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">All committees are performing well.</p>
                        ) : (
                            <div className="space-y-3">
                                {lowCommittees.map((c: any) => (
                                    <div key={c._id} className="flex justify-between items-center p-3 bg-[#07111F]/80 rounded-xl border border-blue-500/20">
                                        <div>
                                            <h4 className="text-white text-sm font-bold">{c.name}</h4>
                                            <p className="text-xs text-red-400/80">{c.type || 'Needs review'}</p>
                                        </div>
                                        <span className="text-xl font-extrabold text-red-500">
                                            {c.completionRate ?? '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Executive Quick Links */}
                <div className="glass-panel rounded-3xl border border-blue-500/20 overflow-hidden">
                    <div className="p-6 border-b border-blue-500/20 flex justify-between items-center bg-white/[0.02]">
                        <h3 className="font-bold text-white text-lg">Cross-Committee Executive Controls</h3>
                        <div className="flex gap-2">
                            <Link href="/admin/community/members" className="px-4 py-2 bg-slate-900 border border-blue-500/20 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all text-white">
                                View All Members <FiArrowRight className="inline ml-1" />
                            </Link>
                        </div>
                    </div>
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'All Members', href: '/admin/community/members', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                            { label: 'Applications', href: '/admin/community/applications', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
                            { label: 'Community Stats', href: '/admin/community/dashboard', color: 'text-gold bg-gold/10 border-gold/20' },
                            { label: 'Activity Logs', href: '/admin/community/logs', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                        ].map(l => (
                            <Link key={l.href} href={l.href}
                                className={`p-4 rounded-2xl border text-center text-xs font-bold transition-all hover:opacity-80 ${l.color}`}>
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
