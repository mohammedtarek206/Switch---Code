'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiSearch, FiFilter, FiSettings, FiTrash2, FiUserCheck, FiUserX, FiCopy, FiRefreshCw, FiCheckCircle, FiPlus } from 'react-icons/fi';
import Link from 'next/link';

export default function AccountsManagementPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [committees, setCommittees] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [committeeFilter, setCommitteeFilter] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [credentialsPopup, setCredentialsPopup] = useState<any>(null);

    const [formData, setFormData] = useState({
        _id: '', name: '', username: '', email: '', phone: '', tempPassword: '',
        role: 'member', committeeId: '', teamId: '', position: '',
        permissions: [] as string[], isActive: true, notes: '', avatar: ''
    });

    const ALL_ROLES = [
        'super_admin', 'admin', 'president', 'vice_president', 'hr', 'pr',
        'marketing', 'media', 'finance', 'operations', 'logistics', 'sponsorship',
        'technical', 'committee_leader', 'vice_committee_leader', 'instructor', 'mentor', 'member', 'student'
    ];

    const AVAILABLE_PERMISSIONS = [
        'manage_users', 'manage_committees', 'manage_teams', 'manage_tasks', 'manage_events',
        'issue_warnings', 'grant_rewards', 'view_all_reports', 'edit_system_settings'
    ];

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        const token = localStorage.getItem('token');
        try {
            const [accRes, commRes, teamRes] = await Promise.all([
                fetch('/api/community/accounts', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/community/committees'),
                fetch('/api/community/teams')
            ]);
            if (accRes.ok) setAccounts(await accRes.json());
            if (commRes.ok) setCommittees(await commRes.json());
            if (teamRes.ok) setTeams(await teamRes.json());
        } catch { } finally { setLoading(false); }
    }

    async function handleSaveAccount(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const isEditing = !!formData._id;
        const method = isEditing ? 'PUT' : 'POST';

        const payload = isEditing ? { id: formData._id, action: 'UPDATE_FULL_ACCOUNT', payload: formData } : formData;

        const res = await fetch('/api/community/accounts', {
            method,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            setIsModalOpen(false);
            if (!isEditing) {
                setCredentialsPopup({
                    name: data.name,
                    username: data.username,
                    tempPassword: formData.tempPassword,
                });
            }
            fetchData();
        } else {
            alert(data.error || 'Failed to save account');
        }
    }

    async function toggleStatus(id: string) {
        const token = localStorage.getItem('token');
        await fetch('/api/community/accounts', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id, action: 'TOGGLE_ACTIVE' })
        });
        fetchData();
    }

    async function resetPassword(id: string) {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/community/accounts', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id, action: 'RESET_PASSWORD' })
        });
        if (res.ok) {
            const data = await res.json();
            setCredentialsPopup({
                name: 'Password Reset',
                username: data.username,
                tempPassword: data.tempPassword,
            });
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this account?')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/community/accounts?id=${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            fetchData();
        } else {
            alert('Failed to delete account');
        }
    }

    function openNewModal() {
        setFormData({
            _id: '', name: '', username: '', email: '', phone: '',
            tempPassword: Math.random().toString(36).slice(-8),
            role: 'member', committeeId: '', teamId: '', position: '',
            permissions: [], isActive: true, notes: '', avatar: ''
        });
        setIsModalOpen(true);
    }

    function copyToClipboard(text: string, label: string) {
        navigator.clipboard.writeText(text);
        alert(`${label} copied to clipboard!`);
    }

    function toggleFormPermission(perm: string) {
        if (formData.permissions.includes(perm)) {
            setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm) });
        } else {
            setFormData({ ...formData, permissions: [...formData.permissions, perm] });
        }
    }

    // Filter teams based on selected committee in form, or show all teams
    const filteredFormTeams = formData.committeeId
        ? teams.filter(t => (t.committeeId?._id || t.committeeId) === formData.committeeId)
        : teams;

    const filteredAccounts = accounts.filter(acc => {
        const query = searchTerm.toLowerCase();
        const matchStr = acc.name?.toLowerCase().includes(query) || acc.username?.toLowerCase().includes(query) || acc.email?.toLowerCase().includes(query);
        const matchRole = roleFilter ? acc.role === roleFilter : true;
        const matchCommittee = committeeFilter ? (acc.committeeId?._id === committeeFilter || acc.committeeId === committeeFilter) : true;
        return matchStr && matchRole && matchCommittee;
    });

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Accounts Management</h1>
                    <p className="text-gray-400 text-sm">Provision, configure roles, assign admin-created teams, positions, and maintain access control.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href="/admin/community/teams" className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2 text-sm">
                        <FiUsers className="w-4 h-4" /> Manage Teams
                    </Link>
                    <button onClick={openNewModal} className="bg-accent text-black font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,255,136,0.3)] flex items-center gap-2 text-sm">
                        <FiPlus className="w-5 h-5" /> Create New Account
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass p-5 flex flex-col md:flex-row gap-4 border border-white/5 rounded-3xl">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" placeholder="Search by name, username, or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm" />
                </div>
                <div className="relative md:w-56">
                    <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm appearance-none">
                        <option value="">All Roles</option>
                        {ALL_ROLES.map(r => <option key={r} value={r}>{r.toUpperCase().replace(/_/g, ' ')}</option>)}
                    </select>
                </div>
                <div className="relative md:w-56">
                    <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <select value={committeeFilter} onChange={e => setCommitteeFilter(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm appearance-none">
                        <option value="">All Committees</option>
                        {committees.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Accounts Table */}
            <div className="glass border border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-white/5 border-b border-white/5 text-[10px] uppercase font-bold text-gray-400">
                            <tr>
                                <th className="p-4">Member Name</th>
                                <th className="p-4">Username & Email</th>
                                <th className="p-4">Committee & Team</th>
                                <th className="p-4">Position & Role</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4">Created Date</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                            {loading ? <tr><td colSpan={7} className="text-center p-10 text-accent">Loading accounts...</td></tr> : null}
                            {!loading && filteredAccounts.length === 0 ? <tr><td colSpan={7} className="text-center p-10 text-gray-500">No accounts found.</td></tr> : null}
                            {filteredAccounts.map(acc => (
                                <tr key={acc._id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 font-extrabold text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center font-bold text-accent">
                                                {acc.avatar ? <img src={acc.avatar} className="w-full h-full rounded-full object-cover" /> : acc.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <span>{acc.name}</span>
                                                <span className="text-xs text-gray-500 block font-normal">{acc.phone || 'No phone'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-accent font-bold">{acc.username}</span>
                                            <button onClick={() => copyToClipboard(acc.username, 'Username')} title="Copy Username" className="text-gray-500 hover:text-white"><FiCopy className="w-3.5 h-3.5" /></button>
                                        </div>
                                        <span className="text-gray-500 block text-[11px] font-normal">{acc.email || 'No email'}</span>
                                    </td>
                                    <td className="p-4 text-xs">
                                        <span className="text-primary font-bold block">{acc.committeeId?.name || 'Global'}</span>
                                        <span className="text-gray-400 font-medium">{acc.teamId?.name ? `Team: ${acc.teamId.name}` : 'No Sub-Team'}</span>
                                    </td>
                                    <td className="p-4 text-xs font-bold">
                                        <span className="uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-300 inline-block mb-1">
                                            {acc.role?.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-accent block text-[11px] font-normal">{acc.position || 'Member'}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => toggleStatus(acc._id)}
                                            className={`px-3 py-1 text-[10px] uppercase font-bold rounded-full ${acc.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                            {acc.isActive ? <FiUserCheck className="inline mr-1" /> : <FiUserX className="inline mr-1" />}
                                            {acc.isActive ? 'Active' : 'Suspended'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500">
                                        {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="p-4 text-right space-x-1 whitespace-nowrap">
                                        <button onClick={() => resetPassword(acc._id)} title="Reset Password"
                                            className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-colors"><FiRefreshCw className="w-4 h-4" /></button>
                                        <button onClick={() => { setFormData({ ...acc, committeeId: acc.committeeId?._id || acc.committeeId || '', teamId: acc.teamId?._id || acc.teamId || '' }); setIsModalOpen(true); }} title="Edit Account"
                                            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"><FiSettings className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(acc._id)} title="Delete Account"
                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"><FiTrash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Creation / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 custom-scrollbar-thin">
                        <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                            {formData._id ? 'Edit User Credentials & Team Assignment' : 'Create New Account & Assign Team'}
                        </h2>

                        <form onSubmit={handleSaveAccount} className="space-y-6 text-sm">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Core Data */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-accent border-b border-white/5 pb-2">Identity Details</h3>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-400">Full Name *</label>
                                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-400">Username (Unique) *</label>
                                        <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-400">Email Address (Optional)</label>
                                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-400">Phone Number (Optional)</label>
                                        <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent" />
                                    </div>
                                    {!formData._id && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-400">Temporary Password *</label>
                                            <input type="text" required value={formData.tempPassword} onChange={e => setFormData({ ...formData, tempPassword: e.target.value })} className="w-full p-3 bg-dark border border-accent/20 rounded-xl text-accent font-mono outline-none" />
                                        </div>
                                    )}
                                </div>

                                {/* Placement Data */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-blue-400 border-b border-white/5 pb-2">Committee, Team & Position</h3>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-400">Primary System Role *</label>
                                        <select required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent">
                                            {ALL_ROLES.map(r => <option key={r} value={r}>{r.toUpperCase().replace(/_/g, ' ')}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-400">Committee Attachment</label>
                                        <select value={formData.committeeId} onChange={e => setFormData({ ...formData, committeeId: e.target.value, teamId: '' })} className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent">
                                            <option value="">Global / Independent</option>
                                            {committees.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-400">Team (Sub-Committee)</label>
                                        <select value={formData.teamId} onChange={e => setFormData({ ...formData, teamId: e.target.value })} className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent">
                                            <option value="">No Specific Team</option>
                                            {filteredFormTeams.map(t => <option key={t._id} value={t._id}>{t.name} ({t.committeeId?.name || 'Sub-Team'})</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-400">Internal Position Title</label>
                                        <input type="text" placeholder="e.g. Leader, Member, Mentor" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-400">Administrative Notes</label>
                                        <input type="text" value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent" />
                                    </div>
                                </div>
                            </div>

                            {/* Permissions Override */}
                            <div className="space-y-2 pt-4">
                                <h3 className="font-bold text-purple-400 border-b border-white/5 pb-2">Granular Role Permissions Override</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                                    {AVAILABLE_PERMISSIONS.map(p => (
                                        <label key={p} className="flex items-center space-x-2 text-xs font-bold text-gray-400 cursor-pointer hover:text-white">
                                            <input type="checkbox" checked={formData.permissions.includes(p)} onChange={() => toggleFormPermission(p)} className="accent-accent w-4 h-4" />
                                            <span>{p.replace(/_/g, ' ').toUpperCase()}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white/5 font-bold rounded-xl text-gray-300">Cancel</button>
                                <button type="submit" className="px-6 py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-dark">Save Account</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Generated Credentials Popup */}
            {credentialsPopup && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-dark border border-accent/30 shadow-[0_0_50px_rgba(0,255,136,0.15)] w-full max-w-sm p-8 rounded-3xl text-center space-y-6">
                        <FiCheckCircle className="w-16 h-16 text-accent mx-auto" />
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">{credentialsPopup.name}</h2>
                            <p className="text-gray-400 text-xs">Credentials generated successfully. Share with member.</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl text-left space-y-3 border border-white/5 font-mono text-xs">
                            <div>
                                <span className="text-gray-500 uppercase text-[10px] font-bold block">Username</span>
                                <span className="text-accent font-bold text-sm">{credentialsPopup.username}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 uppercase text-[10px] font-bold block">Temporary Password</span>
                                <span className="text-yellow-400 font-bold text-sm">{credentialsPopup.tempPassword}</span>
                            </div>
                        </div>
                        <button onClick={() => {
                            copyToClipboard(`Username: ${credentialsPopup.username}\nTemporary Password: ${credentialsPopup.tempPassword}`, 'Credentials');
                            setCredentialsPopup(null);
                        }} className="w-full bg-accent text-black py-3 rounded-xl font-bold hover:bg-accent-dark transition-colors">
                            Copy & Close
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
