'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiAward, FiBook, FiShield, FiPlus, FiTrash2, FiActivity } from 'react-icons/fi';
import Link from 'next/link';

interface Badge {
    _id: string;
    name: string;
    description: string;
    icon?: string;
    color?: string;
}

interface MemberDetail {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    position?: string;
    performanceScore?: number;
    bio?: string;
    skills?: string[];
    badges: Badge[];
    committeeId?: {
        _id: string;
        name: string;
    };
}

interface ScoreDoc {
    month: number;
    year: number;
    attendanceScore: number;
    tasksScore: number;
    projectsScore: number;
    leaderEvaluation: number;
    adminEvaluation: number;
    manualOverride?: number;
    total: number;
}

export default function MemberProfileDetailPage({ params }: { params: { id: string } }) {
    const [member, setMember] = useState<MemberDetail | null>(null);
    const [score, setScore] = useState<ScoreDoc | null>(null);
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);

    // Score override form states
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [evalLeader, setEvalLeader] = useState(0);
    const [evalAdmin, setEvalAdmin] = useState(0);
    const [manualOverride, setManualOverride] = useState('');

    // Badge assign states
    const [selectedBadgeId, setSelectedBadgeId] = useState('');

    async function fetchProfileData() {
        try {
            const token = localStorage.getItem('token');
            const [profileRes, scoreRes, badgesRes] = await Promise.all([
                fetch(`/api/community/members/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`/api/community/members/${params.id}/scores?month=${month - 1}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/community/badges', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (profileRes.ok) setMember(await profileRes.json());
            if (scoreRes.ok) {
                const doc = await scoreRes.json();
                setScore(doc);
                setEvalLeader(doc.leaderEvaluation || 0);
                setEvalAdmin(doc.adminEvaluation || 0);
                setManualOverride(doc.manualOverride !== undefined ? doc.manualOverride.toString() : '');
            }
            if (badgesRes.ok) setAllBadges(await badgesRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProfileData();
    }, [params.id, month, year]);

    async function handleSaveScores(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const payload = {
            month: Number(month),
            year: Number(year),
            leaderEvaluation: Number(evalLeader),
            adminEvaluation: Number(evalAdmin),
            manualOverride: manualOverride !== '' ? Number(manualOverride) : undefined
        };

        try {
            const res = await fetch(`/api/community/members/${params.id}/scores`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert('Scores updated successfully!');
                fetchProfileData();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to update scores');
            }
        } catch {
            alert('Error updating scores');
        }
    }

    async function handleAssignBadge() {
        if (!selectedBadgeId) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/community/members/${params.id}/badges`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ badgeId: selectedBadgeId })
            });
            if (res.ok) {
                setSelectedBadgeId('');
                fetchProfileData();
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handleRemoveBadge(badgeId: string) {
        if (!confirm('Are you sure you want to remove this badge?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/community/members/${params.id}/badges`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ badgeId })
            });
            if (res.ok) {
                fetchProfileData();
            }
        } catch (err) {
            console.error(err);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400">Member profile not found.</p>
                <Link href="/admin/community/members" className="text-accent underline">Back to List</Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header info */}
            <div className="space-y-4">
                <Link href="/admin/community/members" className="flex items-center text-gray-400 hover:text-white w-fit">
                    <FiArrowLeft className="mr-2" /> Back to Directory
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center font-bold text-2xl text-accent border border-white/10">
                            {member.avatar ? (
                                <img src={member.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                member.name[0].toUpperCase()
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-white">{member.name}</h1>
                            <p className="text-gray-400 text-sm">{member.email} • {member.position || 'Member'}</p>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center space-x-3">
                        <FiAward className="text-yellow-500 w-8 h-8" />
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Performance Score</span>
                            <span className="text-xl font-extrabold text-white">{member.performanceScore || 0} pts</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Performance Scorer Panel */}
                <div className="glass p-8 rounded-3xl lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h3 className="text-xl font-bold text-white flex items-center">
                            <FiActivity className="mr-2 text-accent" /> Score Calculator & Override
                        </h3>
                        <div className="flex gap-2 text-xs">
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="bg-dark p-2 rounded-lg border border-white/5 text-white"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>Month {i + 1}</option>
                                ))}
                            </select>
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="bg-dark p-2 rounded-lg border border-white/5 text-white"
                            >
                                <option value="2026">2026</option>
                                <option value="2027">2027</option>
                            </select>
                        </div>
                    </div>

                    {score && (
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Attendance Score</span>
                                <span className="text-lg font-bold text-white">{score.attendanceScore}%</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Tasks Done Status</span>
                                <span className="text-lg font-bold text-white">{score.tasksScore}%</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Automated Sum</span>
                                <span className="text-lg font-bold text-accent">
                                    {Math.round(score.attendanceScore + score.tasksScore + score.projectsScore)} pts
                                </span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSaveScores} className="space-y-4 pt-4 border-t border-white/5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-semibold uppercase">Leader Evaluation (Max 15)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="15"
                                    value={evalLeader}
                                    onChange={(e) => setEvalLeader(Number(e.target.value))}
                                    className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-semibold uppercase">Admin Evaluation (Max 15)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="15"
                                    value={evalAdmin}
                                    onChange={(e) => setEvalAdmin(Number(e.target.value))}
                                    className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 font-semibold uppercase">Manual Score Override (Sets exact absolute points)</label>
                            <input
                                type="number"
                                placeholder="Leave blank to use standard formula totals"
                                value={manualOverride}
                                onChange={(e) => setManualOverride(e.target.value)}
                                className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-accent hover:bg-accent-dark text-black py-3 rounded-xl font-bold transition-all text-xs"
                        >
                            Update Score Analytics
                        </button>
                    </form>
                </div>

                {/* Badges system */}
                <div className="glass p-8 rounded-3xl space-y-6">
                    <h3 className="text-xl font-bold text-white border-b border-white/5 pb-4 flex items-center">
                        <FiShield className="mr-2 text-primary" /> Awarded Badges
                    </h3>

                    <div className="flex gap-2">
                        <select
                            value={selectedBadgeId}
                            onChange={(e) => setSelectedBadgeId(e.target.value)}
                            className="flex-1 p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none text-xs"
                        >
                            <option value="">Grant Badge...</option>
                            {allBadges.map(b => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleAssignBadge}
                            className="p-3 bg-accent text-black rounded-xl hover:bg-accent-dark font-bold font-bold text-xs"
                        >
                            Award
                        </button>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/5 max-h-60 overflow-y-auto custom-scrollbar-thin">
                        {member.badges?.length === 0 ? (
                            <p className="text-gray-500 text-xs italic text-center py-4">No badges awarded yet.</p>
                        ) : (
                            member.badges?.map((b) => (
                                <div
                                    key={b._id}
                                    className="p-4 bg-white/5 rounded-xl flex items-center justify-between border border-white/5"
                                    style={{ borderLeft: `3px solid ${b.color || '#00A3FF'}` }}
                                >
                                    <div>
                                        <span className="font-bold text-white text-xs block">{b.name}</span>
                                        <span className="text-gray-400 text-[10px] leading-relaxed block">{b.description}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveBadge(b._id)}
                                        className="text-red-400 hover:text-red-500 p-1"
                                    >
                                        <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
