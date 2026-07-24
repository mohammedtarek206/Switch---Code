'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiKey, FiUsers, FiSearch, FiCheckSquare, FiX, FiFilter } from 'react-icons/fi';

export default function PermissionsManagerPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [targetUser, setTargetUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const rolesList = [
        'super_admin', 'admin', 'president', 'vice_president',
        'hr', 'pr', 'marketing', 'media', 'technical',
        'instructor', 'mentor', 'committee_leader', 'vice_committee_leader', 'member', 'student'
    ];

    const permissionsList = [
        { value: 'manage_committees', label: 'Manage Committees (Assign members/leaders)' },
        { value: 'manage_recruitment', label: 'Manage Recruitment Cycles & Setup Forms' },
        { value: 'view_applications', label: 'View Recruitment Applications & Candidates' },
        { value: 'manage_applications', label: 'Score and Manage Application Decisions' },
        { value: 'manage_events', label: 'Schedule Events & Manage Attendance Logs' },
        { value: 'manage_tasks', label: 'Formulate, Assign, and Status-Move Tasks' },
        { value: 'manage_announcements', label: 'Publish Broadcasts and Announcements' },
        { value: 'manage_badges', label: 'Construct and Manage Gamification Badges' },
        { value: 'manage_awards', label: 'Publish Scholar and Monthly Standings Awards' },
        { value: 'manage_scores', label: 'Manually Override and Manage Member scores' },
        { value: 'manage_permissions', label: 'Grant/Revoke Roles and Custom Permissions' },
        { value: 'view_logs', label: 'Audit security logs and activity audits' }
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/community/accounts', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setUsers(await res.json());
        } catch (err) { }
        finally { setLoading(false); }
    }

    async function handleTogglePermission(perm: string) {
        if (!targetUser) return;

        const currentPerms = targetUser.permissions || [];
        const newPerms = currentPerms.includes(perm)
            ? currentPerms.filter((p: string) => p !== perm)
            : [...currentPerms, perm];

        // Optimistic UI Update
        const updatedUser = { ...targetUser, permissions: newPerms };
        setTargetUser(updatedUser);
        setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));

        // Auto Save
        const token = localStorage.getItem('token');
        await fetch('/api/community/permissions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ userId: targetUser._id, role: targetUser.role, permissions: newPerms })
        });
    }

    async function handleRoleChange(newRole: string) {
        if (!targetUser) return;
        const updatedUser = { ...targetUser, role: newRole };
        setTargetUser(updatedUser);
        setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));

        // Auto Save
        const token = localStorage.getItem('token');
        await fetch('/api/community/permissions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ userId: targetUser._id, role: newRole, permissions: targetUser.permissions || [] })
        });
    }

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRole = roleFilter ? u.role === roleFilter : true;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Roles & Permissions Map</h1>
                <p className="text-gray-400">Search members and granularly assign specific access rights.</p>
            </div>

            <div className="glass p-6 rounded-3xl space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-4 top-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search user by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                        />
                    </div>
                    <div className="relative">
                        <FiFilter className="absolute left-4 top-4 text-gray-500" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full md:w-64 pl-12 pr-4 py-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm appearance-none">
                            <option value="">All Roles</option>
                            {rolesList.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').toUpperCase()}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    {loading ? (
                        <div className="text-center py-10 text-accent"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent mx-auto"></div></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredUsers.map((u) => (
                                <button
                                    key={u._id}
                                    onClick={() => setTargetUser(u)}
                                    className="p-4 hover:bg-white/10 text-left rounded-xl transition-all flex flex-col gap-2 bg-white/5 border border-white/5"
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <span className="text-white block font-bold text-sm">{u.name}</span>
                                        <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded uppercase font-bold">{u.role.replace(/_/g, ' ')}</span>
                                    </div>
                                    <span className="text-gray-500 text-xs block">{u.committeeId?.name || 'Global User'} {u.position && `• ${u.position}`}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Target Modal */}
            {targetUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 space-y-6 custom-scrollbar-thin relative">
                        <button onClick={() => setTargetUser(null)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white"><FiX /></button>

                        <div>
                            <h2 className="text-2xl font-bold text-white leading-tight">{targetUser.name}</h2>
                            <p className="text-gray-500 text-sm">{targetUser.email || targetUser.username}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400">System Base Role</label>
                            <select
                                value={targetUser.role}
                                onChange={(e) => handleRoleChange(e.target.value)}
                                className="w-full p-4 bg-dark border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                            >
                                {rolesList.map(r => <option key={r} value={r}>{r.toUpperCase().replace(/_/g, ' ')}</option>)}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-gray-400 block pb-2 border-b border-white/10">Granular Permissions (Auto-Saves on Click)</label>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {permissionsList.map((perm) => {
                                    const isGranted = (targetUser.permissions || []).includes(perm.value);
                                    return (
                                        <button
                                            key={perm.value}
                                            onClick={() => handleTogglePermission(perm.value)}
                                            className={`flex items-start text-left p-4 rounded-xl border transition-all ${isGranted ? 'border-accent/50 bg-accent/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                                        >
                                            <div className={`mt-0.5 mr-3 flex-shrink-0 ${isGranted ? 'text-accent' : 'text-gray-500'}`}>
                                                <FiCheckSquare className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold ${isGranted ? 'text-accent' : 'text-gray-400'}`}>{perm.label.split(' (')[0]}</p>
                                                <p className="text-[10px] text-gray-500 mt-1">{perm.label}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </div>
    );
}
