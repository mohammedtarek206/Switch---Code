'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiUsers, FiTarget, FiDollarSign, FiBarChart2, FiPlus, FiEye, FiCalendar } from 'react-icons/fi';
import Link from 'next/link';

interface Campaign {
    id: string;
    name: string;
    status: 'active' | 'paused' | 'ended';
    reach: number;
    registrations: number;
    budget?: number;
    startDate: string;
    endDate: string;
}

const MOCK_CAMPAIGNS: Campaign[] = [
    { id: '1', name: 'Summer Bootcamp 2026', status: 'active', reach: 4820, registrations: 342, budget: 5000, startDate: '2026-07-01', endDate: '2026-08-31' },
    { id: '2', name: 'Hackathon Season', status: 'active', reach: 2305, registrations: 189, budget: 3000, startDate: '2026-07-15', endDate: '2026-07-25' },
    { id: '3', name: 'AI Workshop Series', status: 'paused', reach: 1100, registrations: 78, budget: 1500, startDate: '2026-06-01', endDate: '2026-07-31' },
];

export default function MarketingDashboard() {
    const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (!['marketing', 'admin', 'super_admin'].includes(user.role)) {
                window.location.href = '/dashboard';
            }
        }
    }, []);

    const totalReach = campaigns.reduce((s, c) => s + c.reach, 0);
    const totalReg = campaigns.reduce((s, c) => s + c.registrations, 0);
    const activeCount = campaigns.filter(c => c.status === 'active').length;

    const STATUS_BADGE: Record<string, string> = {
        active: 'bg-green-500/10 text-green-400',
        paused: 'bg-yellow-500/10 text-yellow-400',
        ended: 'bg-gray-500/10 text-gray-400',
    };

    return (
        <div className="min-h-screen bg-dark text-white py-10 px-4 md:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full text-xs font-bold text-orange-400 mb-2">
                            Marketing Dashboard
                        </div>
                        <h1 className="text-3xl font-extrabold">Campaigns & Reach Center</h1>
                        <p className="text-gray-400 text-sm mt-1">Track campaigns, sponsorships, registrations, and outreach metrics.</p>
                    </div>
                    <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white">← Main Dashboard</Link>
                </div>

                {/* Metrics Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Reach', val: totalReach.toLocaleString(), icon: FiTrendingUp, color: 'text-orange-400' },
                        { label: 'Registrations', val: totalReg.toLocaleString(), icon: FiUsers, color: 'text-accent' },
                        { label: 'Active Campaigns', val: activeCount, icon: FiTarget, color: 'text-green-400' },
                        { label: 'Conversion Rate', val: `${totalReach ? Math.round((totalReg / totalReach) * 100) : 0}%`, icon: FiBarChart2, color: 'text-primary' },
                    ].map(s => (
                        <div key={s.label} className="glass p-5 rounded-2xl border border-white/5 flex items-center gap-3">
                            <div className={`p-3 bg-white/5 rounded-xl ${s.color}`}><s.icon className="w-5 h-5" /></div>
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold block">{s.label}</span>
                                <span className={`text-xl font-extrabold ${s.color}`}>{s.val}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Campaigns Table */}
                <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2"><FiTarget className="text-orange-400" /> Campaigns</h3>
                        <button className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-black px-4 py-2.5 rounded-xl text-sm font-bold">
                            <FiPlus /> New Campaign
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="border-b border-white/5">
                                <tr className="text-gray-400 text-[10px] font-bold uppercase">
                                    <th className="p-4">Campaign Name</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Reach</th>
                                    <th className="p-4">Registrations</th>
                                    <th className="p-4">Budget</th>
                                    <th className="p-4">Period</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {campaigns.map((c, i) => (
                                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                                        className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 text-white font-bold">{c.name}</td>
                                        <td className="p-4">
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${STATUS_BADGE[c.status]}`}>{c.status}</span>
                                        </td>
                                        <td className="p-4 text-gray-300">{c.reach.toLocaleString()}</td>
                                        <td className="p-4 text-accent font-bold">{c.registrations}</td>
                                        <td className="p-4 text-gray-400">{c.budget ? `${c.budget.toLocaleString()} EGP` : '—'}</td>
                                        <td className="p-4 text-gray-500 text-xs">
                                            {new Date(c.startDate).toLocaleDateString()} → {new Date(c.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400" title="View Report">
                                                <FiEye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sponsors section */}
                <div className="glass p-8 rounded-3xl border border-white/5 space-y-4">
                    <h3 className="font-bold text-white flex items-center gap-2"><FiDollarSign className="text-orange-400" /> Sponsors & Partners</h3>
                    <p className="text-gray-500 text-sm">Track partnership inquiries and manage sponsor agreements here.</p>
                    <div className="grid md:grid-cols-3 gap-4">
                        {['Platinum Sponsor', 'Gold Partner', 'Community Partner'].map(tier => (
                            <div key={tier} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center">
                                <span className="text-xs text-gray-500 block font-bold uppercase mb-1">{tier}</span>
                                <button className="text-xs text-accent hover:underline mt-1">+ Add Sponsor</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
