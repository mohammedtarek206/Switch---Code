'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiUsers, FiPlus, FiSearch, FiEdit, FiTrash2, FiEye, FiEyeOff,
    FiLinkedin, FiGithub, FiTwitter, FiMail, FiExternalLink, FiImage, FiCheck
} from 'react-icons/fi';
import Link from 'next/link';
import { formatGoogleDriveImageUrl } from '@/lib/googleDrive';

interface Member {
    _id?: string;
    name: string;
    role: string;
    category: 'leadership' | 'technical' | 'hr' | 'media' | 'pr' | 'other';
    bio: string;
    avatar: string;
    committee: string;
    team: string;
    order: number;
    isVisible: boolean;
    socials: {
        linkedin: string;
        github: string;
        twitter: string;
        email: string;
    };
}

export default function PublicTeamAdminPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Member>({
        name: '',
        role: '',
        category: 'leadership',
        bio: '',
        avatar: '',
        committee: '',
        team: '',
        order: 0,
        isVisible: true,
        socials: { linkedin: '', github: '', twitter: '', email: '' }
    });

    const CATEGORIES = [
        { id: 'leadership', label: 'Leadership & Board' },
        { id: 'technical', label: 'Technical & Engineering' },
        { id: 'hr', label: 'HR & People' },
        { id: 'media', label: 'Media & Design' },
        { id: 'pr', label: 'PR & Marketing' },
        { id: 'other', label: 'Other Staff' },
    ];

    useEffect(() => {
        fetchMembers();
    }, []);

    async function fetchMembers() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/community/public-team?adminMode=true', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch (err) {
            console.error('Failed to load team showcase:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const isEditing = !!formData._id;
        const method = isEditing ? 'PUT' : 'POST';

        const payload = isEditing ? { id: formData._id, ...formData } : formData;

        try {
            const res = await fetch('/api/community/public-team', {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchMembers();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save member');
            }
        } catch {
            alert('A network error occurred');
        }
    }

    async function toggleVisibility(member: Member) {
        const token = localStorage.getItem('token');
        try {
            await fetch('/api/community/public-team', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id: member._id, isVisible: !member.isVisible })
            });
            fetchMembers();
        } catch { }
    }

    async function handleDelete(id?: string) {
        if (!id || !confirm('Are you sure you want to remove this member from the public showcase?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/community/public-team?id=${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchMembers();
        } catch { }
    }

    function openNewModal() {
        setFormData({
            name: '',
            role: '',
            category: 'leadership',
            bio: '',
            avatar: '',
            committee: '',
            team: '',
            order: members.length + 1,
            isVisible: true,
            socials: { linkedin: '', github: '', twitter: '', email: '' }
        });
        setIsModalOpen(true);
    }

    function openEditModal(m: Member) {
        setFormData({
            ...m,
            socials: {
                linkedin: m.socials?.linkedin || '',
                github: m.socials?.github || '',
                twitter: m.socials?.twitter || '',
                email: m.socials?.email || '',
            }
        });
        setIsModalOpen(true);
    }

    const filteredMembers = members.filter(m => {
        const matchSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.role?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = categoryFilter === 'all' || m.category === categoryFilter;
        return matchSearch && matchCat;
    });

    const previewAvatarUrl = formatGoogleDriveImageUrl(formData.avatar);

    return (
        <div className="space-y-6 pb-16 text-white">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-1">Public Team Showcase</h1>
                    <p className="text-gray-400 text-sm">Manage team members displayed on the public /team footer page with Google Drive photos.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href="/team" target="_blank" className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2">
                        <FiExternalLink className="w-4 h-4 text-accent" /> View Public Page
                    </Link>
                    <button onClick={openNewModal} className="bg-accent text-black font-bold px-6 py-2.5 rounded-xl hover:scale-105 transition-transform text-xs shadow-[0_0_20px_rgba(0,255,136,0.3)] flex items-center gap-2">
                        <FiPlus className="w-4 h-4" /> Add Team Member
                    </button>
                </div>
            </div>

            {/* Filter controls */}
            <div className="glass p-5 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" placeholder="Search team members by name or role..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm" />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setCategoryFilter('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${categoryFilter === 'all' ? 'bg-accent text-black' : 'bg-white/5 text-gray-400'}`}>
                        All ({members.length})
                    </button>
                    {CATEGORIES.map(c => (
                        <button key={c.id} onClick={() => setCategoryFilter(c.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${categoryFilter === c.id ? 'bg-accent text-black' : 'bg-white/5 text-gray-400'}`}>
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid display */}
            {loading ? (
                <div className="text-center py-20 text-accent font-bold">Loading team showcase...</div>
            ) : filteredMembers.length === 0 ? (
                <div className="glass p-12 text-center text-gray-500 rounded-3xl border border-white/5">
                    No team members added yet. Click "+ Add Team Member" to create one.
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredMembers.map(m => {
                        const avatarUrl = formatGoogleDriveImageUrl(m.avatar);
                        return (
                            <div key={m._id} className={`glass rounded-3xl p-6 border transition-all relative flex flex-col justify-between ${m.isVisible ? 'border-white/5 hover:border-accent/30' : 'border-red-500/20 opacity-60'}`}>
                                <div className="space-y-4 text-center">
                                    {/* Action badges */}
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                                            #{m.order || 0} {m.category}
                                        </span>
                                        <button onClick={() => toggleVisibility(m)} title={m.isVisible ? 'Hide from public page' : 'Show on public page'}
                                            className={`p-1.5 rounded-lg border transition-colors ${m.isVisible ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                            {m.isVisible ? <FiEye className="w-3.5 h-3.5" /> : <FiEyeOff className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>

                                    {/* Photo preview */}
                                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-accent p-1 overflow-hidden shadow-lg">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt={m.name} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-dark-light flex items-center justify-center font-extrabold text-2xl text-accent">
                                                {m.name[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="font-extrabold text-white text-base">{m.name}</h3>
                                        <p className="text-accent text-xs font-semibold capitalize">{m.role}</p>
                                        {(m.committee || m.team) && (
                                            <p className="text-gray-500 text-[11px] mt-1">{m.committee} {m.team ? `• ${m.team}` : ''}</p>
                                        )}
                                    </div>

                                    <p className="text-gray-400 text-xs line-clamp-2">{m.bio || 'No bio provided.'}</p>
                                </div>

                                {/* Actions footer */}
                                <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                                    <div className="flex gap-2 text-gray-500 text-xs">
                                        {m.socials?.linkedin && <FiLinkedin title="LinkedIn" />}
                                        {m.socials?.github && <FiGithub title="GitHub" />}
                                        {m.socials?.email && <FiMail title="Email" />}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditModal(m)} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors">
                                            <FiEdit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(m._id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors">
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 custom-scrollbar-thin">
                        <h2 className="text-2xl font-extrabold text-white mb-6 border-b border-white/10 pb-4">
                            {formData._id ? 'Edit Showcase Team Member' : 'Add New Member to Public Showcase'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400">Full Name *</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Ahmed Hassan" className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400">Role / Job Title *</label>
                                    <input type="text" required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        placeholder="e.g. Founder & CEO / Head of HR" className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent" />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400">Showcase Category *</label>
                                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                        className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent">
                                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400">Display Order #</label>
                                    <input type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                        className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent" />
                                </div>
                            </div>

                            {/* Google Drive Photo Input with Instant Live Preview */}
                            <div className="space-y-2 bg-accent/5 p-4 rounded-2xl border border-accent/20">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-accent flex items-center gap-1.5">
                                        <FiImage className="w-4 h-4" /> Photo (Direct URL or Google Drive Link)
                                    </label>
                                    <span className="text-[10px] text-gray-400">Google Drive shareable links supported!</span>
                                </div>
                                <input type="url" value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                                    placeholder="Paste Google Drive file link (e.g. https://drive.google.com/file/d/...)"
                                    className="w-full p-3 bg-dark border border-white/10 rounded-xl text-white outline-none focus:border-accent text-xs font-mono" />

                                {formData.avatar && (
                                    <div className="flex items-center gap-3 pt-2">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-accent/30 bg-black shrink-0">
                                            {previewAvatarUrl ? (
                                                <img src={previewAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">N/A</div>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-gray-400">
                                            <p className="text-green-400 font-bold flex items-center gap-1"><FiCheck className="w-3.5 h-3.5" /> Drive Link Converted</p>
                                            <p className="truncate max-w-md font-mono text-[10px] text-gray-500">{previewAvatarUrl}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400">Committee Name (Optional)</label>
                                    <input type="text" value={formData.committee} onChange={e => setFormData({ ...formData, committee: e.target.value })}
                                        placeholder="e.g. Human Resources" className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400">Sub-Team Name (Optional)</label>
                                    <input type="text" value={formData.team} onChange={e => setFormData({ ...formData, team: e.target.value })}
                                        placeholder="e.g. Recruitment Team" className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400">Biography / Short Summary</label>
                                <textarea rows={2} value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Brief background or achievements..." className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent" />
                            </div>

                            {/* Socials */}
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <h4 className="text-xs font-bold text-gray-300">Social Media Handles</h4>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <input type="url" placeholder="LinkedIn URL" value={formData.socials.linkedin} onChange={e => setFormData({ ...formData, socials: { ...formData.socials, linkedin: e.target.value } })}
                                        className="p-2.5 bg-dark-light border border-white/10 rounded-xl text-xs text-white" />
                                    <input type="url" placeholder="GitHub URL" value={formData.socials.github} onChange={e => setFormData({ ...formData, socials: { ...formData.socials, github: e.target.value } })}
                                        className="p-2.5 bg-dark-light border border-white/10 rounded-xl text-xs text-white" />
                                    <input type="url" placeholder="Twitter / X URL" value={formData.socials.twitter} onChange={e => setFormData({ ...formData, socials: { ...formData.socials, twitter: e.target.value } })}
                                        className="p-2.5 bg-dark-light border border-white/10 rounded-xl text-xs text-white" />
                                    <input type="email" placeholder="Contact Email" value={formData.socials.email} onChange={e => setFormData({ ...formData, socials: { ...formData.socials, email: e.target.value } })}
                                        className="p-2.5 bg-dark-light border border-white/10 rounded-xl text-xs text-white" />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input type="checkbox" id="visibleCheck" checked={formData.isVisible} onChange={e => setFormData({ ...formData, isVisible: e.target.checked })}
                                    className="w-4 h-4 accent-accent" />
                                <label htmlFor="visibleCheck" className="text-xs font-bold text-gray-300 cursor-pointer">
                                    Visible on Public Showcase Page (/team)
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white/5 font-bold rounded-xl text-gray-300">Cancel</button>
                                <button type="submit" className="px-6 py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-dark">Save Team Member</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
