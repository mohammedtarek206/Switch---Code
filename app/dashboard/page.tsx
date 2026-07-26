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
        { label: 'Admin Panel', href: '/admin/community/dashboard', icon: FiShield, color: '#00FF88', description: 'Full control over community' },
        { label: 'Permissions', href: '/admin/community/permissions', icon: FiSettings, color: '#8B5CF6', description: 'Manage RBAC roles' },
        { label: 'Activity Logs', href: '/admin/community/logs', icon: FiBarChart2, color: '#F59E0B', description: 'Security audit trail' },
        { label: 'All Members', href: '/admin/community/members', icon: FiUsers, color: '#00A3FF', description: 'Directory & scores' },
        { label: 'Recruitment', href: '/admin/community/recruitments', icon: FiTarget, color: '#EC4899', description: 'Manage applications' },
        { label: 'Events', href: '/admin/community/events', icon: FiCalendar, color: '#EAB308', description: 'Schedule & check-ins' },
    ],
    admin: [
        { label: 'Community Dashboard', href: '/admin/community/dashboard', icon: FiBarChart2, color: '#00FF88', description: 'Overview stats' },
        { label: 'Members', href: '/admin/community/members', icon: FiUsers, color: '#00A3FF', description: 'Member directory' },
        { label: 'Applications', href: '/admin/community/applications', icon: FiTarget, color: '#EC4899', description: 'Recruitment pipeline' },
        { label: 'Tasks', href: '/admin/community/tasks', icon: FiCheckSquare, color: '#8B5CF6', description: 'Kanban board' },
        { label: 'Events', href: '/admin/community/events', icon: FiCalendar, color: '#EAB308', description: 'Events manager' },
        { label: 'Leaderboard', href: '/admin/community/leaderboard', icon: FiAward, color: '#F59E0B', description: 'Rankings & awards' },
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
        { label: 'Technical Dashboard', href: '/dashboard/technical', icon: FiCpu, color: '#00A3FF', description: 'Projects & tasks' },
    ],
    committee_leader: [
        { label: 'Technical Dashboard', href: '/dashboard/technical', icon: FiCpu, color: '#00A3FF', description: 'Committee workspace' },
        { label: 'My Committee', href: '/admin/community/committees', icon: FiUsers, color: '#00FF88', description: 'Manage members' },
        { label: 'Tasks', href: '/admin/community/tasks', icon: FiCheckSquare, color: '#8B5CF6', description: 'Committee Kanban' },
    ],
    vice_committee_leader: [
        { label: 'Technical Dashboard', href: '/dashboard/technical', icon: FiCpu, color: '#00A3FF', description: 'Committee workspace' },
        { label: 'Tasks', href: '/admin/community/tasks', icon: FiCheckSquare, color: '#8B5CF6', description: 'Committee tasks' },
    ],
    member: [
        { label: 'Technical Dashboard', href: '/dashboard/technical', icon: FiCpu, color: '#00A3FF', description: 'My workspace' },
    ],
    instructor: [
        { label: 'Technical Dashboard', href: '/dashboard/technical', icon: FiCpu, color: '#00A3FF', description: 'Teaching resources' },
    ],
    mentor: [
        { label: 'Technical Dashboard', href: '/dashboard/technical', icon: FiCpu, color: '#00A3FF', description: 'Mentoring workspace' },
    ],
};

const ROLE_BADGE_COLORS: Record<string, string> = {
    super_admin: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    admin: 'bg-red-500/10 text-red-400 border-red-500/20',
    hr: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    pr: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    marketing: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    media: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    technical: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    committee_leader: 'bg-green-500/10 text-green-400 border-green-500/20',
    vice_committee_leader: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    member: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    instructor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    mentor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
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
            <div className="flex items-center justify-center min-h-screen bg-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-dark text-gray-400">
                <p>Session expired. <Link href="/login" className="text-accent underline">Login</Link></p>
            </div>
        );
    }

    const { role, committeeId, position } = user;
    let links: QuickLink[] = [];

    // Core Dashboard Routing Logic
    const commName = committeeId?.name || '';
    const posName = position || '';

    if (role === 'super_admin') {
        links.push({ label: 'Supreme President Board', href: '/dashboard/president', icon: FiShield, color: '#FCD34D', description: 'Monitor all committees natively' });
        links.push({ label: 'Accounts Manager', href: '/admin/community/accounts', icon: FiUser, color: '#00FF88', description: 'Provision & manage accounts' });
        links.push({ label: 'Role Permissions', href: '/admin/community/permissions', icon: FiSettings, color: '#8B5CF6', description: 'Modify RBAC constraints' });
        links.push({ label: 'Activity Overlook', href: '/admin/community/logs', icon: FiBarChart2, color: '#F59E0B', description: 'Global audit logs' });
        links.push({ label: 'All Specific Dashboards', href: '/admin/community/dashboard', icon: FiTarget, color: '#EC4899', description: 'Jump to any native dashboard' });
    } else if (role === 'president' || role === 'vice_president') {
        links.push({ label: 'Presidential Dashboard', href: '/dashboard/president', icon: FiShield, color: '#FCD34D', description: 'Monitor all operations' });
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
            color: '#00A3FF',
            description: 'Access tasks, perform assessments, and view metrics.'
        });
    }

    // Always strictly route students/learners to LMS
    if (['student', 'trainee', 'learner', 'technical_student'].includes(role)) {
        links = [{ label: 'Technical Learning Portal', href: '/learn', icon: FiCpu, color: '#06b6d4', description: 'Access your courses and videos' }];
    } else if (['instructor', 'mentor', 'committee_leader', 'admin', 'super_admin'].includes(role)) {
        // Also add LMS for dual-role users
        links.push({ label: 'Tech Education (LMS)', href: '/learn', icon: FiBookOpen, color: '#06b6d4', description: 'Switch to Learning & Education UI' });
    }

    const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <div className="min-h-screen bg-dark text-white py-12 px-4 md:px-8">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* Profile banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass p-8 rounded-3xl border border-white/5 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 blur-3xl rounded-full pointer-events-none"></div>

                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-accent/30 flex items-center justify-center font-bold text-3xl text-accent overflow-hidden shrink-0">
                        {user.avatar
                            ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            : user.name[0].toUpperCase()}
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        <p className="text-gray-400 text-xs mb-1">Welcome back 👋</p>
                        <h1 className="text-2xl font-extrabold text-white">{user.name}</h1>
                        <p className="text-gray-500 text-sm">{user.email}</p>

                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${ROLE_BADGE_COLORS[role] || ROLE_BADGE_COLORS['member']}`}>
                                {roleLabel}
                            </span>
                            {user.committeeId && (
                                <span className="text-[10px] font-bold bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded-full">
                                    {user.committeeId.name}
                                </span>
                            )}
                            {user.performanceScore !== undefined && (
                                <span className="text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded-full">
                                    ⭐ {user.performanceScore} pts
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href={`/community/members/${user._id}`}
                            className="flex items-center gap-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl transition-all">
                            <FiUser className="w-3.5 h-3.5" /> My Profile
                        </Link>
                        <button onClick={handleLogout}
                            className="flex items-center gap-1.5 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl transition-all">
                            <FiLogOut className="w-3.5 h-3.5" /> Logout
                        </button>
                    </div>
                </motion.div>

                {/* Badges strip */}
                {user.badges && user.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {user.badges.map((b, i) => (
                            <span key={i} className="text-xs font-bold px-3 py-1.5 rounded-full border"
                                style={{ backgroundColor: `${b.color || '#EAB308'}15`, borderColor: `${b.color || '#EAB308'}30`, color: b.color || '#EAB308' }}>
                                🏅 {b.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Smart quick links */}
                <div>
                    <h2 className="text-lg font-bold text-white mb-4">Your Workspace</h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {links.map((l, i) => (
                            <motion.div
                                key={l.href}
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            >
                                <Link href={l.href}
                                    className="glass p-6 rounded-2xl border border-white/5 flex flex-col gap-3 hover:bg-white/[0.04] hover:scale-[1.02] transition-all duration-200 h-full group block">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2.5 rounded-xl bg-white/5" style={{ color: l.color }}>
                                            <l.icon className="w-5 h-5" />
                                        </div>
                                        <FiArrowRight className="text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all w-4 h-4 mt-1" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">{l.label}</h3>
                                        <p className="text-gray-500 text-xs mt-0.5">{l.description}</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Community public links */}
                <div className="glass p-6 rounded-3xl border border-white/5 flex flex-wrap gap-3 items-center justify-between">
                    <div>
                        <h3 className="font-bold text-white text-sm">Community Public Pages</h3>
                        <p className="text-gray-500 text-xs">External-facing pages visible to all visitors</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: 'Community Stats', href: '/community' },
                            { label: 'Hall of Fame', href: '/community/hall-of-fame' },
                            { label: 'Committees', href: '/community/committees' },
                            { label: 'Join Us', href: '/join' },
                        ].map(l => (
                            <Link key={l.href} href={l.href}
                                className="text-xs font-bold px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 transition-all">
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
