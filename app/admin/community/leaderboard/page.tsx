'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiShield, FiTag, FiTrendingUp, FiCheckCircle, FiStar, FiCalendar, FiPlus } from 'react-icons/fi';

interface LeaderboardMember {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
    performanceScore: number;
    position?: string;
    committeeId?: {
        name: string;
        color: string;
    };
}

interface CommitteeRank {
    id: string;
    name: string;
    color: string;
    membersCount: number;
    eventsCount: number;
    taskCompletionRate: number;
    avgPerformance: number;
    rankingScore: number;
}

interface Award {
    _id: string;
    type: string;
    label: string;
    winnerId?: {
        name: string;
        avatar?: string;
        email: string;
    };
    month: number;
    year: number;
}

interface User {
    _id: string;
    name: string;
}

export default function LeaderboardAndAwardsPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardMember[]>([]);
    const [rankings, setRankings] = useState<CommitteeRank[]>([]);
    const [awards, setAwards] = useState<Award[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Awards modal
    const [showAwardModal, setShowAwardModal] = useState(false);
    const [awardType, setAwardType] = useState('member_of_the_month');
    const [awardLabel, setAwardLabel] = useState('Best Contributor');
    const [awardMonth, setAwardMonth] = useState(new Date().getMonth() + 1);
    const [awardYear, setAwardYear] = useState(new Date().getFullYear());
    const [awardWinnerId, setAwardWinnerId] = useState('');

    // active tab
    const [activeTab, setActiveTab] = useState<'members' | 'committees' | 'awards'>('members');

    async function fetchStats() {
        try {
            const token = localStorage.getItem('token');
            const [leaderRes, rankRes, awardRes, usersRes] = await Promise.all([
                fetch('/api/community/leaderboard', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/community/rankings', { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`/api/community/awards?month=${awardMonth}&year=${awardYear}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (leaderRes.ok) setLeaderboard(await leaderRes.json());
            if (rankRes.ok) setRankings(await rankRes.json());
            if (awardRes.ok) setAwards(await awardRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchStats();
    }, [awardMonth, awardYear]);

    async function handleGrantAward(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const payload = {
            type: awardType,
            label: awardLabel,
            winnerId: awardWinnerId || undefined,
            month: Number(awardMonth),
            year: Number(awardYear)
        };

        try {
            const res = await fetch('/api/community/awards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setShowAwardModal(false);
                setAwardWinnerId('');
                fetchStats();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to award');
            }
        } catch {
            alert('Error');
        }
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Standing & Leaderboards</h1>
                    <p className="text-gray-400">Track committee performance, member scores, and monthly achievements.</p>
                </div>
                <button
                    onClick={() => setShowAwardModal(true)}
                    className="flex items-center btn-primary-blue px-5 py-3 rounded-xl font-bold transition-all"
                >
                    <FiPlus className="mr-2" /> Certify Monthly Award
                </button>
            </div>

            {/* Tabs list */}
            <div className="flex space-x-2 bg-slate-900 border border-blue-500/20 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('members')}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'members' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Members Score Board
                </button>
                <button
                    onClick={() => setActiveTab('committees')}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'committees' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Committee Standing
                </button>
                <button
                    onClick={() => setActiveTab('awards')}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'awards' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Monthly Awards Log
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[30vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
                </div>
            ) : activeTab === 'members' ? (
                <div className="glass-panel rounded-3xl overflow-hidden p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <FiTrendingUp className="mr-2 text-gold" /> Leaderboard Rankings
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-blue-500/20 text-gray-400 text-xs font-bold uppercase">
                                    <th className="py-4 pl-4">Rank</th>
                                    <th className="py-4">Member</th>
                                    <th className="py-4">Committee</th>
                                    <th className="py-4">Role</th>
                                    <th className="py-4 text-right pr-4">Total Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-gray-300 text-sm">
                                {leaderboard.map((m, idx) => (
                                    <tr key={m._id} className="hover:bg-slate-900 border border-blue-500/20 transition-colors">
                                        <td className="py-4 pl-4 font-bold text-white">
                                            {idx + 1 === 1 ? '🥇 1st' : idx + 1 === 2 ? '🥈 2nd' : idx + 1 === 3 ? '🥉 3rd' : `# ${idx + 1}`}
                                        </td>
                                        <td className="py-4 flex items-center space-x-3">
                                            <div className="w-9 h-9 bg-slate-900 border border-blue-500/20 rounded-full flex items-center justify-center font-bold text-xs text-gold">
                                                {m.avatar ? (
                                                    <img src={m.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    m.name[0].toUpperCase()
                                                )}
                                            </div>
                                            <span className="text-white font-bold">{m.name}</span>
                                        </td>
                                        <td className="py-4 font-semibold text-xs">
                                            <span
                                                className="px-2.5 py-1 rounded-full font-bold"
                                                style={{ backgroundColor: `${m.committeeId?.color || '#0066FF'}20`, color: m.committeeId?.color || '#0066FF' }}
                                            >
                                                {m.committeeId?.name || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="py-4 capitalize text-xs text-gray-400 font-semibold">{m.role.replace('_', ' ')}</td>
                                        <td className="py-4 text-right pr-4 font-extrabold text-gold">{m.performanceScore} pts</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'committees' ? (
                <div className="grid md:grid-cols-2 gap-6">
                    {rankings.map((c, idx) => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-panel p-6 rounded-2xl border border-blue-500/20 relative overflow-hidden flex flex-col justify-between"
                            style={{ borderLeft: `4px solid ${c.color || '#0066FF'}` }}
                        >
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs uppercase font-extrabold text-gray-500 tracking-wider">Standing: #{idx + 1}</span>
                                    <span className="bg-gold/20 text-gold text-xs px-3 py-1 rounded-full font-bold">
                                        Rank Points: {c.rankingScore}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-4">{c.name}</h3>

                                <div className="space-y-3 text-xs text-gray-400">
                                    <div className="flex justify-between">
                                        <span>Task Completion Efficiency</span>
                                        <span className="text-white font-bold">{c.taskCompletionRate}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-900 border border-blue-500/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 hover:bg-blue-500 text-white transition-colors" style={{ width: `${c.taskCompletionRate}%` }}></div>
                                    </div>

                                    <div className="flex justify-between pt-1">
                                        <span>Average User Score</span>
                                        <span className="text-white font-bold">{c.avgPerformance} pts</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-900 border border-blue-500/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600" style={{ width: `${c.avgPerformance}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-center mt-6 border-t border-blue-500/20 pt-4 text-xs">
                                <div>
                                    <span className="text-gray-500 block mb-1">Members Count</span>
                                    <span className="font-extrabold text-white">{c.membersCount}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block mb-1">Seminars Held</span>
                                    <span className="font-extrabold text-white">{c.eventsCount}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-3xl flex items-center justify-between">
                        <h3 className="font-bold text-white text-md">Awards of the Selected Period</h3>
                        <div className="flex gap-2">
                            <select
                                value={awardMonth}
                                onChange={(e) => setAwardMonth(Number(e.target.value))}
                                className="bg-[#07111F] p-2 rounded-lg border border-blue-500/20 text-xs text-white outline-none"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>Month {i + 1}</option>
                                ))}
                            </select>
                            <select
                                value={awardYear}
                                onChange={(e) => setAwardYear(Number(e.target.value))}
                                className="bg-[#07111F] p-2 rounded-lg border border-blue-500/20 text-xs text-white outline-none"
                            >
                                <option value="2026">2026</option>
                                <option value="2027">2027</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {awards.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-12 col-span-2">No certificates granted for this month cycle.</p>
                        ) : (
                            awards.map((a) => (
                                <div key={a._id} className="glass-panel p-6 rounded-2xl relative border-l-4 border-yellow-500 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                                🥇 {a.type.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-gray-500 text-xs font-semibold">{a.month}/{a.year}</span>
                                        </div>

                                        <h4 className="text-white font-extrabold text-lg mt-2">{a.label}</h4>
                                    </div>

                                    {a.winnerId && (
                                        <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-blue-500/20">
                                            <div className="w-10 h-10 bg-slate-900 border border-blue-500/20 rounded-full flex items-center justify-center font-bold text-xs text-gold">
                                                {a.winnerId.avatar ? (
                                                    <img src={a.winnerId.avatar} alt="Winner" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    a.winnerId.name[0].toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-white font-bold block">{a.winnerId.name}</span>
                                                <span className="text-gray-500 text-[10px] block">{a.winnerId.email}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Grant Award Modal */}
            {showAwardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-panel w-full max-w-md rounded-3xl p-8 space-y-6"
                    >
                        <h2 className="text-2xl font-bold text-white mb-2">Publish Monthly Award</h2>

                        <form onSubmit={handleGrantAward} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-300">Award Type</label>
                                <select
                                    value={awardType}
                                    onChange={(e) => setAwardType(e.target.value)}
                                    className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold text-sm"
                                >
                                    <option value="member_of_the_month">Member of the Month</option>
                                    <option value="committee_of_the_month">Committee of the Month</option>
                                    <option value="best_instructor">Best Instructor of Session</option>
                                    <option value="best_mentor">Best Mentor of Session</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-300">Title / Custom Label</label>
                                <input
                                    type="text"
                                    required
                                    value={awardLabel}
                                    onChange={(e) => setAwardLabel(e.target.value)}
                                    placeholder="e.g. Shield of Excellence"
                                    className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-300">Month</label>
                                    <select
                                        value={awardMonth}
                                        onChange={(e) => setAwardMonth(Number(e.target.value))}
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none text-sm"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>Month {i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-300">Year</label>
                                    <select
                                        value={awardYear}
                                        onChange={(e) => setAwardYear(Number(e.target.value))}
                                        className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none text-sm"
                                    >
                                        <option value="2026">2026</option>
                                        <option value="2027">2027</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-300">Select Winner</label>
                                <select
                                    value={awardWinnerId}
                                    onChange={(e) => setAwardWinnerId(e.target.value)}
                                    className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold text-sm"
                                >
                                    <option value="">Choose User...</option>
                                    {users.map(u => (
                                        <option key={u._id} value={u._id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAwardModal(false)}
                                    className="px-6 py-3 bg-slate-900 border border-blue-500/20 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 btn-primary-blue rounded-xl transition-all font-bold"
                                >
                                    Certify Scholar
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
