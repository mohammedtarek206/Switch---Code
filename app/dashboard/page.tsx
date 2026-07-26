'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    FiArrowRight, FiUsers, FiCheckSquare, FiCalendar, FiAward,
    FiBell, FiSettings, FiBarChart2, FiImage, FiTarget, FiCpu,
    FiShield, FiUser, FiLogOut, FiTrendingUp, FiBookOpen
} from 'react-icons/fi';
import Link from 'next/link';

interface UserData {
    _id: string;
    name: string;
    email: string;
    role: string;
    position?: string;
    permissions: string[];
    performanceScore?: number;
    committeeId?: { _id: string; name: string };
    badges?: { name: string; color: string }[];
    avatar?: string;
}

interface QuickLink {
    label: string;
    href: string;
    icon: React.ElementType;
    color: string;
    description: string;
}

const ROLE_LINKS: Record<string, QuickLink[]> = {
    super_admin: [
        { label: 'Admin Panel', href: '/admin/community/dashboard', icon: FiShield, color: '#FACC15', description: 'Full control over community' },
        { label: 'Permissions', href: '/admin/community/permissions', icon: FiSettings, color: '#8B5CF6', description: 'Manage RBAC roles' },
        { label: 'Activity Logs', href: '/admin/community/logs', icon: FiBarChart2, color: '#F59E0B', description: 'Security audit trail' },
        { label: 'All Members', href: '/admin/community/members', icon: FiUsers, color: '#3B82F6', description: 'Directory & scores' },
        { label: 'Recruitment', href: '/admin/community/recruitments', icon: FiTarget, color: '#EC4899', description: 'Manage applications' },
        { label: 'Events', href: '/admin/community/events', icon: FiCalendar, color: '#F59E0B', description: 'Schedule & check-ins' },
    ],
    admin: [
        { label: 'Community Dashboard', href: '/admin/community/dashboard', icon: FiBarChart2, color: '#2563EB', description: 'Overview stats' },
        { label: 'Members', href: '/admin/community/members', icon: FiUsers, color: '#3B82F6', description: 'Member directory' },
        { label: 'Applications', href: '/admin/community/applications', icon: FiTarget, color: '#EC4899', description: 'Recruitment pipeline' },
        { label: 'Tasks', href: '/admin/community/tasks', icon: FiCheckSquare, color: '#8B5CF6', description: 'Kanban board' },
        { label: 'Events', href: '/admin/community/events', icon: FiCalendar, color: '#F59E0B', description: 'Events manager' },
        { label: 'Leaderboard', href: '/admin/community/leaderboard', icon: FiAward, color: '#FACC15', description: 'Rankings & awards' },
    ],
    hr: [
        { label: 'HR Dashboard', href: '/dashboard/hr', icon: FiUsers, color: '#3B82F6', description: 'Manage applications' },
        { label: 'All Applications', href: '/admin/community/applications', icon: FiTarget, color: '#EC4899', description: 'Review & evaluate' },
    ],
    pr: [
        { label: 'PR Dashboard', href: '/dashboard/pr', icon: FiBell, color: '#8B5CF6', description: 'Announcements & social' },
    ],
    marketing: [
        { label: 'Marketing Dashboard', href: '/dashboard/marketing', icon: FiTrendingUp, color: '#F97316', description: 'Campaigns & reach' },
    ],
    media: [
        { label: 'Media Library', href: '/dashboard/media', icon: FiImage, color: '#EC4899', description: 'Photos & videos' },
    ],
    technical: [
        { label: 'Technical Dashboard', href: '/dashboard/technical', icon: FiCpu, color: '#2563EB', description: 'Projects & tasks' },
    ],
    committee_leader: [
        { label: 'Technical Dashboard', href: '/dashboard/technical', icon: FiCpu, color: '#2563EB', description: 'Committee workspace' },
        { label: 'My Committee', href: '/admin/community/committees', icon: FiUsers, color: '#FACC15', description: 'Manage members' },
        { label: 'Tasks', href: '/admin/community/tasks', icon: FiCheckSquare, color: '#8B5CF6', description: 'Committee Kanban' },
    ],
    vice_committee_leader: [
        { label: 'Technical Dashboard', href: '/dashboard/technical', icon: FiCpu, color: '#2563EB', description: 'Committee workspace' },
        { label: 'Tasks', href: '/admin/community/tasks', icon: FiCheckSquare, color: '#8B5CF6', description: 'Committee tasks' },
    ],
    member: [
        { label: 'Technical Dashboard', href: '/dashboard/technical', icon: FiCpu, color: '#2563EB', description: 'My workspace' },
    ],
    instructor: [
        { label: 'Technical Dashboard', href: '/dashboard/technical', icon: FiCpu, color: '#2563EB', description: 'Teaching resources' },
    ],
    mentor: [
        { label: 'Technical Dashboard', href: '/dashboard/technical', icon: FiCpu, color: '#2563EB', description: 'Mentoring workspace' },
    ],
};

const ROLE_BADGE_COLORS: Record<string, string> = {
    super_admin: 'bg-yellow-500/10 text-gold border-yellow-500/30',
    admin: 'bg-red-500/10 text-red-400 border-red-500/30',
    hr: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    pr: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    marketing: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    media: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    technical: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    committee_leader: 'bg-green-500/10 text-green-400 border-green-500/30',
    vice_committee_leader: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    member: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    instructor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    mentor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
};

export default function SmartDashboardPage() {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/login'; return; }

        const userStr = localStorage.getItem('user');
        if (userStr) {
            try { setUser(JSON.parse(userStr)); } catch { }
        }

        async function fetchMe() {
            try {
                const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                }
            } catch { }
            finally { setLoading(false); }
        }
        fetchMe();
    }, []);

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#07111F]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#07111F] text-slate-400">
                <p>Session expired. <Link href="/login" className="text-gold underline">Login</Link></p>
            </div>
        );
    }

    const { role, committeeId, position } = user;
    let links: QuickLink[] = [];

    const commName = committeeId?.name || '';
    const posName = position || '';

    if (role === 'super_admin') {
        links.push({ label: 'Supreme President Board', href: '/dashboard/president', icon: FiShield, color: '#FACC15', description: 'Monitor all committees natively' });
        links.push({ label: 'Accounts Manager', href: '/admin/community/accounts', icon: FiUser, color: '#3B82F6', description: 'Provision & manage accounts' });
        links.push({ label: 'Role Permissions', href: '/admin/community/permissions', icon: FiSettings, color: '#8B5CF6', description: 'Modify RBAC constraints' });
        links.push({ label: 'Activity Overlook', href: '/admin/community/logs', icon: FiBarChart2, color: '#F59E0B', description: 'Global audit logs' });
        links.push({ label: 'All Specific Dashboards', href: '/admin/community/dashboard', icon: FiTarget, color: '#EC4899', description: 'Jump to any native dashboard' });
    } else if (role === 'president' || role === 'vice_president') {
        links.push({ label: 'Presidential Dashboard', href: '/dashboard/president', icon: FiShield, color: '#FACC15', description: 'Monitor all operations' });
    } else if (role === 'hr') {
        links.push({ label: `HR ${posName} Dashboard`, href: '/dashboard/hr', icon: FiUsers, color: '#3B82F6', description: 'Manage members & applications' });
    } else if (role === 'pr') {
        links.push({ label: `PR ${posName} Dashboard`, href: '/dashboard/pr', icon: FiBell, color: '#8B5CF6', description: 'Manage socials & announcements' });
    } else if (role === 'marketing') {
        links.push({ label: `Marketing ${posName} Dashboard`, href: '/dashboard/marketing', icon: FiTrendingUp, color: '#F97316', description: 'Campaigns & reach' });
    } else if (role === 'media') {
        links.push({ label: `Media ${posName} Dashboard`, href: '/dashboard/media', icon: FiImage, color: '#EC4899', description: 'Media library & covers' });
    } else if (['committee_leader', 'vice_committee_leader', 'member', 'technical'].includes(role)) {
        links.push({
            label: `${commName || 'Committee'} ${posName || 'Workspace'}`,
            href: '/dashboard/committee',
            icon: FiCpu,
            color: '#2563EB',
            description: 'Access tasks, perform assessments, and view metrics.'
        });
    }

    if (['student', 'trainee', 'learner', 'technical_student'].includes(role)) {
        links = [{ label: 'Technical Learning Portal', href: '/learn', icon: FiCpu, color: '#2563EB', description: 'Access your courses and videos' }];
    } else if (['instructor', 'mentor', 'committee_leader', 'admin', 'super_admin'].includes(role)) {
        links.push({ label: 'Tech Education (LMS)', href: '/learn', icon: FiBookOpen, color: '#2563EB', description: 'Switch to Learning & Education UI' });
    }

    const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <div className="min-h-screen bg-[#07111F] text-white py-12 px-4 md:px-8">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* Profile banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-8 rounded-[2.5rem] flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-3xl rounded-full pointer-events-none"></div>

                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-gold flex items-center justify-center font-black text-4xl text-gold overflow-hidden shrink-0 shadow-glow-gold">
                        {user.avatar
                            ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            : user.name[0].toUpperCase()}
                    </div>

                    <div className="flex-1 text-center sm:text-left z-10">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Welcome back 👋</p>
                        <h1 className="text-3xl font-black text-white">{user.name}</h1>
                        <p className="text-slate-400 text-sm font-medium mt-1">{user.email}</p>

                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${ROLE_BADGE_COLORS[role] || ROLE_BADGE_COLORS['member']}`}>
                                {roleLabel}
                            </span>
                            {user.committeeId && (
                                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-900 border border-blue-500/30 text-blue-300 px-3 py-1.5 rounded-full">
                                    {user.committeeId.name}
                                </span>
                            )}
                            {user.performanceScore !== undefined && (
                                <span className="text-[10px] font-black uppercase tracking-widest bg-yellow-500/10 text-gold border border-yellow-500/30 px-3 py-1.5 rounded-full">
                                    ⭐ {user.performanceScore} pts
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 z-10 w-full sm:w-auto">
                        <Link href={`/community/members/${user._id}`}
                            className="btn-primary-blue flex items-center justify-center gap-2 text-xs uppercase tracking-widest px-6 py-3.5">
                            <FiUser className="w-4 h-4" /> My Profile
                        </Link>
                        <button onClick={handleLogout}
                            className="bg-slate-900 hover:bg-red-500/10 border border-blue-500/20 hover:border-red-500/30 text-slate-300 hover:text-red-400 px-6 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest">
                            <FiLogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </motion.div>

                {/* Badges strip */}
                {user.badges && user.badges.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        {user.badges.map((b, i) => (
                            <span key={i} className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border flex items-center shadow-lg"
                                style={{ backgroundColor: `${b.color || '#EAB308'}15`, borderColor: `${b.color || '#EAB308'}40`, color: b.color || '#EAB308', boxShadow: `0 4px 15px -3px ${b.color || '#EAB308'}30` }}>
                                🏅 {b.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Smart quick links */}
                <div className="z-10 relative">
                    <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider text-slate-200">Your Workspace Apps</h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {links.map((l, i) => (
                            <motion.div
                                key={l.href}
                                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            >
                                <Link href={l.href}
                                    className="glass-card p-6 rounded-3xl flex flex-col gap-4 h-full group block relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="p-3.5 rounded-2xl bg-slate-900 border border-blue-500/20 shadow-md group-hover:scale-110 transition-transform" style={{ color: l.color }}>
                                            <l.icon className="w-6 h-6" />
                                        </div>
                                        <FiArrowRight className="text-slate-500 group-hover:text-gold group-hover:translate-x-1.5 transition-all w-5 h-5 mt-1" />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="font-black text-white text-base group-hover:text-gold transition-colors">{l.label}</h3>
                                        <p className="text-slate-400 text-xs mt-1.5 leading-snug font-medium">{l.description}</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Community public links */}
                <div className="glass-panel p-8 rounded-3xl flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div>
                        <h3 className="font-black text-white text-lg">Community Public Pages</h3>
                        <p className="text-slate-400 text-sm mt-1">External-facing pages visible to all visitors</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { label: 'Community Stats', href: '/community' },
                            { label: 'Hall of Fame', href: '/community/hall-of-fame' },
                            { label: 'Committees', href: '/community/committees' },
                            { label: 'Join Us', href: '/join' },
                        ].map(l => (
                            <Link key={l.href} href={l.href}
                                className="text-xs font-black uppercase tracking-widest px-5 py-3 rounded-xl bg-slate-900 border border-blue-500/30 text-slate-300 hover:text-gold hover:border-gold transition-all shadow-md">
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
