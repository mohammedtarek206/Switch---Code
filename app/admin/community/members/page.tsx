'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiAward, FiSearch, FiSliders, FiGrid, FiEye } from 'react-icons/fi';
import Link from 'next/link';

interface Committee {
    _id: string;
    name: string;
}

interface Member {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    position?: string;
    performanceScore?: number;
    committeeId?: Committee;
}

export default function MembersDirectoryPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [committeeId, setCommitteeId] = useState('');
    const [role, setRole] = useState('');

    async function fetchMembers() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const query = new URLSearchParams();
            if (search) query.append('search', search);
            if (committeeId) query.append('committeeId', committeeId);
            if (role) query.append('role', role);

            const [membersRes, commsRes] = await Promise.all([
                fetch(`/api/community/members?${query.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/community/committees')
            ]);

            if (membersRes.ok) setMembers(await membersRes.json());
            if (commsRes.ok) setCommittees(await commsRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchMembers();
    }, [committeeId, role]);

    const roles = [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
        { value: 'president', label: 'President' },
        { value: 'vice_president', label: 'Vice President' },
        { value: 'hr', label: 'HR' },
        { value: 'pr', label: 'PR' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'media', label: 'Media' },
        { value: 'technical', label: 'Technical' },
        { value: 'instructor', label: 'Instructor' },
        { value: 'mentor', label: 'Mentor' },
        { value: 'committee_leader', label: 'Committee Leader' },
        { value: 'vice_committee_leader', label: 'Vice Committee Leader' },
        { value: 'member', label: 'Member' }
    ];

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Members Directory</h1>
                <p className="text-slate-400 font-medium">View performance ranks, manage roles, and review contribution points.</p>
            </div>

            {/* Filter and search Bar */}
            <div className="glass-panel p-6 rounded-[2rem] grid grid-cols-1 sm:grid-cols-3 gap-5 border border-blue-500/20">
                {/* Search */}
                <div className="relative">
                    <FiSearch className="absolute left-4 top-[1.1rem] text-blue-500" />
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchMembers()}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-blue-500/20 rounded-2xl text-white outline-none focus:border-gold text-sm font-medium transition-colors"
                    />
                </div>

                {/* Committees */}
                <div>
                    <select
                        value={committeeId}
                        onChange={(e) => setCommitteeId(e.target.value)}
                        className="w-full p-3.5 bg-slate-900 border border-blue-500/20 rounded-2xl text-white outline-none text-sm cursor-pointer focus:border-gold font-medium transition-colors"
                    >
                        <option value="">All Committees</option>
                        {committees.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Role */}
                <div>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full p-3.5 bg-slate-900 border border-blue-500/20 rounded-2xl text-white outline-none text-sm cursor-pointer focus:border-gold font-medium transition-colors"
                    >
                        <option value="">All Roles</option>
                        {roles.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[30vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : members.length === 0 ? (
                <div className="glass-card p-12 text-center rounded-[2rem] border border-blue-500/20">
                    <FiSliders className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                    <p className="text-slate-400 font-medium">No members found.</p>
                </div>
            ) : (
                <div className="glass-panel rounded-[2rem] border border-blue-500/20 overflow-hidden shadow-lg shadow-blue-900/20">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-900/50 border-b border-blue-500/20 text-slate-400 text-xs font-black uppercase tracking-widest">
                                    <th className="p-6">Member Name</th>
                                    <th className="p-6">Role</th>
                                    <th className="p-6">Committee</th>
                                    <th className="p-6">Performance Score</th>
                                    <th className="p-6 text-right">Profile Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-500/10 text-sm text-slate-300">
                                {members.map((m) => (
                                    <tr key={m._id} className="hover:bg-blue-950/30 transition-colors">
                                        <td className="p-6 flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-slate-900 border border-gold/30 rounded-full flex items-center justify-center font-black text-sm text-gold shadow-glow-gold overflow-hidden shrink-0">
                                                {m.avatar ? (
                                                    <img src={m.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    m.name[0].toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-white font-black block text-base">{m.name}</span>
                                                <span className="text-blue-400 font-medium text-[11px] uppercase tracking-wide">{m.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 font-black capitalize text-gold text-xs tracking-wider">
                                            {m.role ? m.role.replace('_', ' ') : 'Member'}
                                        </td>
                                        <td className="p-6">
                                            <span className="flex items-center text-xs text-slate-300 font-bold bg-slate-900 border border-blue-500/30 px-3 py-1.5 rounded-xl w-fit">
                                                <FiGrid className="mr-2 text-blue-500" /> {m.committeeId?.name || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center">
                                                <FiAward className="mr-2 text-gold w-5 h-5" />
                                                <span className="font-black text-white text-base">{m.performanceScore || 0} <span className="text-xs text-gold uppercase">pts</span></span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <Link
                                                href={`/admin/community/members/${m._id}`}
                                                className="inline-flex p-2.5 bg-slate-900 border border-blue-500/30 hover:border-gold hover:text-gold rounded-xl text-blue-400 transition-all shadow-md group"
                                            >
                                                <FiEye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
