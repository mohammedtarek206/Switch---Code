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
                <h1 className="text-3xl font-bold text-white mb-2">Members Directory</h1>
                <p className="text-gray-400">View performance ranks, manage roles, and review contribution points.</p>
            </div>

            {/* Filter and search Bar */}
            <div className="glass p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                    <FiSearch className="absolute left-4 top-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchMembers()}
                        className="w-full pl-10 pr-4 py-3 bg-dark-light border border-white/5 rounded-xl text-white outline-none focus:border-accent text-sm"
                    />
                </div>

                {/* Committees */}
                <div>
                    <select
                        value={committeeId}
                        onChange={(e) => setCommitteeId(e.target.value)}
                        className="w-full p-3 bg-dark-light border border-white/5 rounded-xl text-white outline-none text-sm cursor-pointer"
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
                        className="w-full p-3 bg-dark-light border border-white/5 rounded-xl text-white outline-none text-sm cursor-pointer"
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
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                </div>
            ) : members.length === 0 ? (
                <div className="glass p-12 text-center rounded-2xl">
                    <FiSliders className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">No members found.</p>
                </div>
            ) : (
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-gray-400 text-xs font-bold uppercase">
                                    <th className="p-5">Member Name</th>
                                    <th className="p-5">Role</th>
                                    <th className="p-5">Committee</th>
                                    <th className="p-5">Performance Score</th>
                                    <th className="p-5 text-right">Profile Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                                {members.map((m) => (
                                    <tr key={m._id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-5 flex items-center space-x-3">
                                            <div className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center font-bold text-sm">
                                                {m.avatar ? (
                                                    <img src={m.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    m.name[0].toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-white font-bold block">{m.name}</span>
                                                <span className="text-gray-500 text-xs">{m.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 font-semibold capitalize text-accent text-xs">
                                            {m.role ? m.role.replace('_', ' ') : 'Member'}
                                        </td>
                                        <td className="p-5">
                                            <span className="flex items-center text-xs text-gray-300 font-bold">
                                                <FiGrid className="mr-2 text-primary" /> {m.committeeId?.name || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="p-5 flex items-center mt-2.5">
                                            <FiAward className="mr-2 text-yellow-500" />
                                            <span className="font-extrabold text-white">{m.performanceScore || 0} pts</span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <Link
                                                href={`/admin/community/members/${m._id}`}
                                                className="inline-flex p-2 bg-white/5 hover:bg-white/10 rounded-lg text-accent transition-colors"
                                            >
                                                <FiEye className="w-4 h-4" />
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
