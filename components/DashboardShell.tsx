'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    FiHome, FiBookOpen, FiYoutube, FiFileText, FiCalendar, FiUser,
    FiUsers, FiCheckSquare, FiShield, FiLogOut, FiMenu, FiX, FiAward,
    FiBriefcase, FiTarget, FiLayers, FiRepeat
} from 'react-icons/fi';
import NotificationBell from './NotificationBell';
import { formatGoogleDriveImageUrl } from '@/lib/googleDrive';
import { getDashboardRouteForRole } from '@/lib/roleRoutes';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    president: 'President',
    vice_president: 'Vice President',
    student: 'Student',
    instructor: 'Instructor',
    mentor: 'Mentor',
    committee_leader: 'Committee Head',
    vice_committee_leader: 'Vice Head',
    member: 'Committee Member',
    hr: 'HR Committee',
    pr: 'PR & Partnerships',
    media: 'Media',
    marketing: 'Marketing',
    technical: 'Technical',
};

function getNavItemsForRole(role: string): NavItem[] {
    if (['super_admin', 'admin', 'president', 'vice_president'].includes(role)) {
        return [
            { label: 'Admin Center', href: '/admin/community/dashboard', icon: FiShield },
            { label: 'Users Management', href: '/admin/community/users', icon: FiUsers },
            { label: 'Leadership', href: '/admin/community/leadership', icon: FiAward },
            { label: 'Committees', href: '/admin/community/committees', icon: FiLayers },
            { label: 'Tracks & LMS', href: '/admin/lms', icon: FiBookOpen },
            { label: 'Events', href: '/admin/community/events', icon: FiCalendar },
            { label: 'Profile', href: '/profile', icon: FiUser },
        ];
    }

    if (role === 'student') {
        return [
            { label: 'Student Dashboard', href: '/learn', icon: FiHome },
            { label: 'My Tracks', href: '/learn/tracks', icon: FiLayers },
            { label: 'Learning Videos', href: '/learn/videos', icon: FiYoutube },
            { label: 'Materials', href: '/learn/materials', icon: FiFileText },
            { label: 'Assignments', href: '/learn/assignments', icon: FiCheckSquare },
            { label: 'Events', href: '/events', icon: FiCalendar },
            { label: 'Profile', href: '/profile', icon: FiUser },
        ];
    }

    if (role === 'instructor' || role === 'mentor') {
        return [
            { label: 'Instructor Dashboard', href: '/instructor/dashboard', icon: FiAward },
            { label: 'Events', href: '/events', icon: FiCalendar },
            { label: 'Profile', href: '/profile', icon: FiUser },
        ];
    }

    if (role === 'committee_leader') {
        return [
            { label: 'Head Dashboard', href: '/dashboard/committee/head', icon: FiShield },
            { label: 'Committee Workspace', href: '/dashboard/committee', icon: FiUsers },
            { label: 'Events', href: '/events', icon: FiCalendar },
            { label: 'Profile', href: '/profile', icon: FiUser },
        ];
    }

    if (role === 'vice_committee_leader') {
        return [
            { label: 'Vice Head Dashboard', href: '/dashboard/committee/vice-head', icon: FiAward },
            { label: 'Committee Workspace', href: '/dashboard/committee', icon: FiUsers },
            { label: 'Events', href: '/events', icon: FiCalendar },
            { label: 'Profile', href: '/profile', icon: FiUser },
        ];
    }

    const items: NavItem[] = [
        { label: 'Committee Workspace', href: '/dashboard/committee', icon: FiUsers },
    ];

    if (role === 'hr') {
        items.push({ label: 'HR Onboarding & Follow-up', href: '/dashboard/hr/onboarding', icon: FiTarget });
    }
    if (role === 'pr') {
        items.push({ label: 'PR & Partnerships', href: '/dashboard/pr/leads', icon: FiBriefcase });
    }

    items.push(
        { label: 'Events', href: '/events', icon: FiCalendar },
        { label: 'Profile', href: '/profile', icon: FiUser }
    );

    return items;
}

function inferActiveRoleFromPath(pathname: string, fallbackRole: string, roles: string[]): string {
    if (pathname.startsWith('/learn') && roles.includes('student')) return 'student';
    if (pathname.startsWith('/instructor') && (roles.includes('instructor') || roles.includes('mentor'))) {
        return 'instructor';
    }
    if (pathname.startsWith('/dashboard/hr') && roles.includes('hr')) return 'hr';
    if (pathname.startsWith('/dashboard/pr') && roles.includes('pr')) return 'pr';
    if (pathname.startsWith('/dashboard/committee/head') && (roles.includes('committee_leader') || roles.includes('admin') || roles.includes('super_admin'))) {
        return 'committee_leader';
    }
    if (pathname.startsWith('/dashboard/committee/vice-head') && (roles.includes('vice_committee_leader') || roles.includes('admin') || roles.includes('super_admin'))) {
        return 'vice_committee_leader';
    }
    if (pathname.startsWith('/dashboard/committee')) {
        const commRole = roles.find((r) =>
            ['committee_leader', 'vice_committee_leader', 'member', 'hr', 'pr', 'media', 'marketing', 'technical'].includes(r)
        );
        if (commRole) return commRole;
    }
    if (pathname.startsWith('/admin')) {
        const adm = roles.find((r) => ['super_admin', 'admin', 'president', 'vice_president'].includes(r));
        if (adm) return adm;
    }
    return fallbackRole;
}

export default function DashboardShell({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<{
        name?: string;
        role?: string;
        roles?: string[];
        avatar?: string;
        position?: string;
        committeeId?: { name?: string };
    } | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {}
        }
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => (r.ok ? r.json() : null))
                .then((fresh) => {
                    if (fresh && fresh._id) {
                        setUser(fresh);
                        localStorage.setItem('user', JSON.stringify(fresh));
                    }
                })
                .catch(() => {});
        }
    }, []);

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    }

    const allRoles = Array.from(
        new Set([user?.role, ...(user?.roles || [])].filter(Boolean) as string[])
    );
    const activeRole = inferActiveRoleFromPath(pathname, user?.role || 'student', allRoles);
    const navItems = getNavItemsForRole(activeRole);

    return (
        <div className="min-h-screen bg-[#07111F] text-white flex">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#0B1220]/95 backdrop-blur-xl border-r border-blue-500/20 flex flex-col transition-transform duration-200 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                }`}
            >
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-gold font-black text-sm">
                            SC
                        </div>
                        <div>
                            <div className="font-extrabold text-sm text-white">Switch Code</div>
                            <div className="text-[10px] text-blue-400 uppercase tracking-wider">Community</div>
                        </div>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden text-slate-400 hover:text-white"
                    >
                        <FiX />
                    </button>
                </div>

                {/* Personalized User Identity Card */}
                {user && (
                    <div className="mx-4 mt-4 p-3 rounded-2xl bg-gradient-to-br from-blue-950/60 to-slate-900/80 border border-blue-500/20 flex items-center gap-3">
                        {user.avatar ? (
                            <img
                                src={formatGoogleDriveImageUrl(user.avatar)}
                                alt={user.name || 'User'}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gold shrink-0"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center font-black text-sm text-gold shrink-0">
                                {(user.name?.trim()?.[0] || 'U').toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-xs font-extrabold text-white truncate">{user.name}</div>
                            <div className="text-[10px] font-bold text-gold uppercase truncate">
                                {ROLE_LABELS[activeRole] || activeRole}
                            </div>
                            {user.committeeId?.name && activeRole !== 'student' && activeRole !== 'instructor' && (
                                <div className="text-[10px] text-blue-300 truncate">{user.committeeId.name}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Role Switcher for multi-role users */}
                {allRoles.length > 1 && (
                    <div className="px-4 pt-4 pb-2 border-b border-white/10">
                        <label className="text-[10px] uppercase tracking-wider text-gold font-bold flex items-center gap-1 mb-1.5">
                            <FiRepeat /> Role Switcher
                        </label>
                        <select
                            value={activeRole}
                            onChange={(e) => {
                                const targetRole = e.target.value;
                                router.push(getDashboardRouteForRole(targetRole, allRoles));
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-500/30 text-xs font-bold text-white outline-none"
                        >
                            {allRoles.map((r) => (
                                <option key={r} value={r}>
                                    {ROLE_LABELS[r] || r}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    active
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-2">
                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
                    >
                        <FiHome /> الموقع الرئيسي
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors"
                    >
                        <FiLogOut /> تسجيل الخروج
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-20 bg-[#07111F]/85 backdrop-blur-xl border-b border-blue-500/20 px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300"
                        >
                            <FiMenu />
                        </button>
                        <h1 className="text-base sm:text-lg font-extrabold text-white truncate">{title}</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <Link href="/profile" className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-900/70 border border-white/10 hover:border-blue-500/40">
                            {user?.avatar ? (
                                <img
                                    src={formatGoogleDriveImageUrl(user.avatar)}
                                    alt={user.name || 'User'}
                                    className="w-7 h-7 rounded-full object-cover border border-gold/60"
                                />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-blue-600/30 flex items-center justify-center text-xs font-bold text-blue-300">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                            )}
                            <div className="hidden sm:block text-left">
                                <div className="text-xs font-bold text-white leading-tight">{user?.name || 'User'}</div>
                                <div className="text-[10px] text-slate-400 uppercase">{ROLE_LABELS[activeRole] || activeRole}</div>
                            </div>
                        </Link>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
