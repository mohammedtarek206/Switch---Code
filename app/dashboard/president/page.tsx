'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiUsers, FiAward, FiAlertOctagon, FiActivity, FiMap, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';

export default function PresidentDashboard() {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const u = JSON.parse(userStr);
            if (!['president', 'vice_president', 'admin', 'super_admin'].includes(u.role)) {
                window.location.href = '/dashboard';
            }
        }
    }, []);

    if (loading) return null;

    return (
        <div className="min-h-screen bg-dark text-white py-10 px-4 md:px-8">
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
                        <button className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border border-red-500/20">
                            + Global Warning
                        </button>
                        <button className="bg-accent hover:bg-accent-dark text-black px-4 py-2.5 rounded-xl font-bold text-xs transition-all">
                            Global Announcement
                        </button>
                    </div>
                </div>

                {/* Supreme Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Total Members', val: 142, icon: FiUsers, color: 'text-white' },
                        { label: 'Committees', val: 12, icon: FiMap, color: 'text-blue-400' },
                        { label: 'Active Projects', val: 24, icon: FiActivity, color: 'text-primary' },
                        { label: 'Total Warnings', val: 8, icon: FiAlertOctagon, color: 'text-red-400' },
                        { label: 'Awards Granted', val: 45, icon: FiAward, color: 'text-yellow-400' },
                    ].map(s => (
                        <div key={s.label} className="glass p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-gray-400 transition-colors">{s.label}</p>
                                <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.val}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl text-gray-500 group-hover:text-white transition-all"><s.icon className="w-5 h-5" /></div>
                        </div>
                    ))}
                </div>

                {/* Insights Section */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="glass p-6 rounded-3xl border border-green-500/20 bg-green-500/5">
                        <h3 className="font-bold text-green-400 mb-4 flex items-center gap-2"><FiTrendingUp className="w-5 h-5" /> Top Performing Committees</h3>
                        <div className="space-y-3">
                            {[
                                { name: 'AI Department', score: 98, tasks: '100% completed' },
                                { name: 'Frontend Department', score: 94, tasks: '12 active projects' },
                                { name: 'PR Committee', score: 91, tasks: '8 major events' },
                            ].map(c => (
                                <div key={c.name} className="flex justify-between items-center p-3 bg-dark-light/50 rounded-xl border border-white/5">
                                    <div>
                                        <h4 className="text-white text-sm font-bold">{c.name}</h4>
                                        <p className="text-xs text-gray-400">{c.tasks}</p>
                                    </div>
                                    <span className="text-xl font-extrabold text-green-400">{c.score}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass p-6 rounded-3xl border border-red-500/20 bg-red-500/5">
                        <h3 className="font-bold text-red-500 mb-4 flex items-center gap-2"><FiTrendingDown className="w-5 h-5" /> Committees Needing Attention</h3>
                        <div className="space-y-3">
                            {[
                                { name: 'Embedded Systems', score: 65, issue: 'Low attendance rate (40%)' },
                                { name: 'Media Team', score: 71, issue: 'Missed 3 deadlines' },
                            ].map(c => (
                                <div key={c.name} className="flex justify-between items-center p-3 bg-dark-light/50 rounded-xl border border-white/5">
                                    <div>
                                        <h4 className="text-white text-sm font-bold">{c.name}</h4>
                                        <p className="text-xs text-red-400/80">{c.issue}</p>
                                    </div>
                                    <span className="text-xl font-extrabold text-red-500">{c.score}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Global Roster / Activity feed */}
                <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <h3 className="font-bold text-white text-lg">Cross-Committee Executive Ledger</h3>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all text-white">Evaluate Leaders</button>
                        </div>
                    </div>
                    <div className="p-8 text-center text-gray-500 text-sm">
                        Presidential view of all 142 members and leaders mapped dynamically against their committee indexes.
                    </div>
                </div>

            </div>
        </div>
    );
}
