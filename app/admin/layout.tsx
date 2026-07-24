'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FiLayout,
    FiBook,
    FiKey,
    FiUsers,
    FiLogOut,
    FiMenu,
    FiX,
    FiFileText,
    FiImage,
    FiGrid,
    FiAward
} from 'react-icons/fi';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [authorized, setAuthorized] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            const ALLOWED_ROLES = [
                'admin', 'super_admin', 'president', 'vice_president',
                'hr', 'pr', 'marketing', 'media', 'technical',
                'committee_leader', 'vice_committee_leader', 'instructor', 'mentor'
            ];

            if (!token || !user || !ALLOWED_ROLES.includes(user.role)) {
                router.push('/admin/login');
            } else {
                setAuthorized(true);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            router.push('/admin/login');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
    };

    const isLoginPage = pathname === '/admin/login';

    if (!authorized && !isLoginPage) return null;

    if (isLoginPage) return <>{children}</>;

    const menuItems = [
        { title: 'Overview', icon: FiLayout, href: '/admin/dashboard' },
        { title: 'Tracks', icon: FiBook, href: '/admin/tracks' },
        { title: 'Exams', icon: FiFileText, href: '/admin/exams' },
        { title: 'Results', icon: FiAward, href: '/admin/results' },
        { title: 'Partners', icon: FiImage, href: '/admin/partners' },
        { title: 'Projects', icon: FiGrid, href: '/admin/projects' },
        { title: 'Students', icon: FiUsers, href: '/admin/students' },
    ];

    const communityItems = [
        { title: 'Public Team Showcase', icon: FiImage, href: '/admin/community/public-team' },
        { title: 'Accounts Management', icon: FiUsers, href: '/admin/community/accounts' },
        { title: 'Teams Management', icon: FiUsers, href: '/admin/community/teams' },
        { title: 'Community DB', icon: FiLayout, href: '/admin/community/dashboard' },
        { title: 'Committees', icon: FiGrid, href: '/admin/community/committees' },
        { title: 'Recruitments', icon: FiFileText, href: '/admin/community/recruitments' },
        { title: 'Applications', icon: FiUsers, href: '/admin/community/applications' },
        { title: 'Events', icon: FiBook, href: '/admin/community/events' },
        { title: 'Tasks', icon: FiFileText, href: '/admin/community/tasks' },
        { title: 'Members', icon: FiUsers, href: '/admin/community/members' },
        { title: 'Announcements', icon: FiFileText, href: '/admin/community/announcements' },
        { title: 'Leaderboard & Awards', icon: FiAward, href: '/admin/community/leaderboard' },
        { title: 'Activity Logs', icon: FiBook, href: '/admin/community/logs' },
        { title: 'Permissions', icon: FiKey, href: '/admin/community/permissions' },
    ];

    return (
        <div className="min-h-screen bg-dark flex">
            {/* Sidebar */}
            <aside className={`
        fixed md:relative z-40 h-screen transition-all duration-300
        ${sidebarOpen ? 'w-64' : 'w-0 md:w-20'}
        bg-dark-light border-r border-white/5 flex flex-col
      `}>
                <div className="p-6 flex items-center justify-between overflow-hidden whitespace-nowrap">
                    <h2 className={`font-bold text-xl text-primary ${!sidebarOpen && 'md:hidden'}`}>
                        Witch Code <span className="text-white">Admin</span>
                    </h2>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
                        {sidebarOpen ? <FiX className="md:hidden" /> : <FiMenu />}
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar-thin">
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                      flex items-center p-3 rounded-xl transition-all
                      ${isActive
                                            ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(0,163,255,0.2)]'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                    `}
                                >
                                    <item.icon className="w-5 h-5 min-w-[20px]" />
                                    <span className={`ml-4 font-medium ${!sidebarOpen && 'md:hidden'}`}>
                                        {item.title}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="pt-4 border-t border-white/5 mt-4 space-y-1">
                        {sidebarOpen && (
                            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Community
                            </p>
                        )}
                        {communityItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                      flex items-center p-3 rounded-xl transition-all
                      ${isActive
                                            ? 'bg-accent/20 text-accent shadow-[0_0_15px_rgba(0,255,136,0.1)]'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                    `}
                                >
                                    <item.icon className="w-5 h-5 min-w-[20px]" />
                                    <span className={`ml-4 font-medium ${!sidebarOpen && 'md:hidden'}`}>
                                        {item.title}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center p-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all overflow-hidden"
                    >
                        <FiLogOut className="w-5 h-5 min-w-[20px]" />
                        <span className={`ml-4 font-medium ${!sidebarOpen && 'md:hidden'}`}>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
