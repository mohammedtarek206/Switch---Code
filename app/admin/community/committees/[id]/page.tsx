'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiGrid, FiArrowLeft, FiUserPlus, FiUserMinus, FiShield, FiTag } from 'react-icons/fi';
import Link from 'next/link';

interface User {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
}

interface Committee {
    _id: string;
    name: string;
    description: string;
    type: string;
    color: string;
    leaderId?: User;
    viceLeaderId?: User;
}

interface MemberJunction {
    _id: string;
    userId: User;
    position: string;
    status: string;
}

export default function CommitteeDetailPage({ params }: { params: { id: string } }) {
    const [committee, setCommittee] = useState<Committee | null>(null);
    const [members, setMembers] = useState<MemberJunction[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);

    // Search input for raw user additions
    const [searchTerm, setSearchTerm] = useState('');

    // Appointing state variables
    const [isLeaderModal, setIsLeaderModal] = useState(false);
    const [isViceModal, setIsViceModal] = useState(false);

    async function fetchDetails() {
        try {
            const token = localStorage.getItem('token');
            const [commRes, membRes, usersRes] = await Promise.all([
                fetch(`/api/community/committees/${params.id}`),
                fetch(`/api/community/committees/${params.id}/members`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } }) // fetching all user lists
            ]);

            if (commRes.ok) setCommittee(await commRes.json());
            if (membRes.ok) setMembers(await membRes.json());
            if (usersRes.ok) setAllUsers(await usersRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDetails();
    }, [params.id]);

    async function handleAssignLeader(userId: string, roleType: 'leader' | 'vice') {
        const token = localStorage.getItem('token');
        const updateBody = roleType === 'leader' ? { leaderId: userId } : { viceLeaderId: userId };
        try {
            const res = await fetch(`/api/community/committees/${params.id}/leaders`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(updateBody)
            });
            if (res.ok) {
                setIsLeaderModal(false);
                setIsViceModal(false);
                fetchDetails();
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handleAddMember(userId: string) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/community/committees/${params.id}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userId, position: 'Member' })
            });
            if (res.ok) {
                setShowAddMember(false);
                setSearchTerm('');
                fetchDetails();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to add member');
            }
        } catch {
            alert('Error');
        }
    }

    async function handlePositionChange(memberId: string, currentPosition: string) {
        const position = prompt('Enter new position/rank:', currentPosition);
        if (position === null) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/community/committees/${params.id}/members`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ memberId, position })
            });
            if (res.ok) fetchDetails();
        } catch (err) {
            console.error(err);
        }
    }

    async function handleRemoveMember(memberId: string) {
        if (!confirm('Are you sure you want to remove this member?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/community/committees/${params.id}/members`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ memberId })
            });
            if (res.ok) fetchDetails();
        } catch (err) {
            console.error(err);
        }
    }

    const filteredUsers = allUsers.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (!committee) {
        return (
            <div className="space-y-4 text-center py-20">
                <p className="text-gray-400">Committee not found.</p>
                <Link href="/admin/community/committees" className="text-accent underline">Back to List</Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header Info */}
            <div className="space-y-4">
                <Link
                    href="/admin/community/committees"
                    className="flex items-center text-gray-400 hover:text-white w-fit transition-colors"
                >
                    <FiArrowLeft className="mr-2" /> Back to Committees
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <span
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: committee.color }}
                            ></span>
                            <h1 className="text-3xl font-extrabold text-white">{committee.name}</h1>
                        </div>
                        <p className="text-gray-400 max-w-3xl leading-relaxed">{committee.description}</p>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-xl">
                        <FiTag className="text-accent" />
                        <span className="text-sm font-semibold capitalize text-gray-300">
                            {committee.type.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Leaders Appointing Row */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Committee Leader</span>
                            <button
                                onClick={() => setIsLeaderModal(true)}
                                className="text-xs text-accent font-bold hover:underline"
                            >
                                Appoint / Change
                            </button>
                        </div>
                        {committee.leaderId ? (
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-bold text-lg text-primary">
                                    {committee.leaderId.avatar ? (
                                        <img src={committee.leaderId.avatar} alt="Leader" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        committee.leaderId.name[0].toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold">{committee.leaderId.name}</h4>
                                    <p className="text-gray-400 text-xs">{committee.leaderId.email}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No leader assigned.</p>
                        )}
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Vice Leader</span>
                            <button
                                onClick={() => setIsViceModal(true)}
                                className="text-xs text-accent font-bold hover:underline"
                            >
                                Appoint / Change
                            </button>
                        </div>
                        {committee.viceLeaderId ? (
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-bold text-lg text-accent">
                                    {committee.viceLeaderId.avatar ? (
                                        <img src={committee.viceLeaderId.avatar} alt="Vice Leader" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        committee.viceLeaderId.name[0].toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold">{committee.viceLeaderId.name}</h4>
                                    <p className="text-gray-400 text-xs">{committee.viceLeaderId.email}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No vice leader assigned.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Member Directory within committee */}
            <div className="glass p-8 rounded-3xl space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Committee Members ({members.length})</h3>
                    <button
                        onClick={() => setShowAddMember(true)}
                        className="flex items-center bg-accent hover:bg-accent-dark text-black px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                    >
                        <FiUserPlus className="mr-2" /> Add Member
                    </button>
                </div>

                {members.length === 0 ? (
                    <p className="text-gray-500 text-center py-12 text-sm">No members inside this committee yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-gray-400 text-xs uppercase font-extrabold">
                                    <th className="py-4">Name</th>
                                    <th className="py-4">Role/Position</th>
                                    <th className="py-4">Status</th>
                                    <th className="py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {members.map((m) => (
                                    <tr key={m._id} className="text-gray-300">
                                        <td className="py-4 flex items-center space-x-3">
                                            <div className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center font-bold text-sm">
                                                {m.userId?.avatar ? (
                                                    <img src={m.userId.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    m.userId?.name?.[0].toUpperCase() || 'U'
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-white font-semibold block">{m.userId?.name}</span>
                                                <span className="text-gray-500 text-xs">{m.userId?.email}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className="bg-white/5 text-accent text-xs px-3 py-1 rounded-full font-semibold">
                                                {m.position}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${m.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                {m.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handlePositionChange(m._id, m.position)}
                                                className="px-3 py-1 text-xs bg-white/10 hover:bg-white/15 text-white rounded-lg transition-all"
                                            >
                                                Change Position
                                            </button>
                                            <button
                                                onClick={() => handleRemoveMember(m._id)}
                                                className="p-2 hover:bg-red-500/10 text-red-400 hover:text-red-500 rounded-lg transition-all inline-flex items-center"
                                                title="Remove member"
                                            >
                                                <FiUserMinus className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Leader Selection Modal */}
            {(isLeaderModal || isViceModal) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass w-full max-w-md rounded-3xl p-8 space-y-6">
                        <h2 className="text-2xl font-bold text-white">
                            Appoint {isLeaderModal ? 'Committee Leader' : 'Vice Committee Leader'}
                        </h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Search candidates by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent"
                            />
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {filteredUsers.map((u) => (
                                    <button
                                        key={u._id}
                                        onClick={() => handleAssignLeader(u._id, isLeaderModal ? 'leader' : 'vice')}
                                        className="w-full p-3 bg-white/5 hover:bg-white/10 text-left rounded-xl transition-all flex justify-between items-center text-sm"
                                    >
                                        <div>
                                            <span className="text-white block font-bold">{u.name}</span>
                                            <span className="text-gray-400 text-xs">{u.email}</span>
                                        </div>
                                        <FiShield className="text-accent" />
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => { setIsLeaderModal(false); setIsViceModal(false); setSearchTerm(''); }}
                                className="w-full py-3 bg-white/10 text-white rounded-xl font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Member Addition Modal */}
            {showAddMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass w-full max-w-md rounded-3xl p-8 space-y-6">
                        <h2 className="text-2xl font-bold text-white">Add Member to Committee</h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Search member name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent"
                            />
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {filteredUsers.map((u) => (
                                    <button
                                        key={u._id}
                                        onClick={() => handleAddMember(u._id)}
                                        className="w-full p-3 bg-white/5 hover:bg-white/10 text-left rounded-xl transition-all flex justify-between items-center text-sm"
                                    >
                                        <div>
                                            <span className="text-white block font-bold">{u.name}</span>
                                            <span className="text-gray-400 text-xs">{u.email}</span>
                                        </div>
                                        <FiUserPlus className="text-accent hover:scale-110 transition-transform" />
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => { setShowAddMember(false); setSearchTerm(''); }}
                                className="w-full py-3 bg-white/10 text-white rounded-xl font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
