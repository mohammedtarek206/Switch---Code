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
        { title: 'Event Applications', icon: FiFileText, href: '/admin/community/events/applications' },
        { title: 'Tasks', icon: FiFileText, href: '/admin/community/tasks' },
        { title: 'Members', icon: FiUsers, href: '/admin/community/members' },
        { title: 'Announcements', icon: FiFileText, href: '/admin/community/announcements' },
        { title: 'Leaderboard & Awards', icon: FiAward, href: '/admin/community/leaderboard' },
        { title: 'Activity Logs', icon: FiBook, href: '/admin/community/logs' },
        { title: 'Permissions', icon: FiKey, href: '/admin/community/permissions' },
    ];

    return (
        <div className="min-h-screen bg-[#07111F] text-white flex">
            {/* Sidebar */}
            <aside className={`
                fixed md:relative z-40 h-screen transition-all duration-300
                ${sidebarOpen ? 'w-72' : 'w-0 md:w-20'}
                bg-[#0B1220]/80 backdrop-blur-xl border-r border-blue-500/20 flex flex-col shadow-xl shadow-blue-900/10
            `}>
                <div className="p-6 flex items-center justify-between overflow-hidden whitespace-nowrap">
                    <h2 className={`font-black tracking-tight text-2xl text-blue-500 flex items-center gap-2 ${!sidebarOpen && 'md:hidden'}`}>
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-gold flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <span className="text-sm font-black">SC</span>
                        </div>
                        Witch Code
                    </h2>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-gold transition-colors">
                        {sidebarOpen ? <FiX className="md:hidden" /> : <FiMenu />}
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar-thin pb-6">
                    <div className="space-y-1.5">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center p-3.5 rounded-2xl transition-all font-bold text-sm
                                        ${isActive
                                            ? 'bg-blue-600/10 text-blue-500 shadow-glow-blue border border-blue-500/30'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'}
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 min-w-[20px] ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
                                    <span className={`ml-4 ${!sidebarOpen && 'md:hidden'}`}>
                                        {item.title}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="pt-6 border-t border-blue-500/20 mt-6 space-y-1.5">
                        {sidebarOpen && (
                            <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gold"></span> Community
                            </p>
                        )}
                        {communityItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center p-3.5 rounded-2xl transition-all font-bold text-sm
                                        ${isActive
                                            ? 'bg-gold/10 text-gold shadow-glow-gold border border-gold/30'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'}
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 min-w-[20px] ${isActive ? 'text-gold' : 'text-slate-500'}`} />
                                    <span className={`ml-4 ${!sidebarOpen && 'md:hidden'}`}>
                                        {item.title}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                <div className="p-4 border-t border-blue-500/20 bg-slate-900/50">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center p-3.5 text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-2xl font-bold transition-all overflow-hidden text-sm uppercase tracking-wider"
                    >
                        <FiLogOut className="w-5 h-5 min-w-[20px]" />
                        <span className={`ml-4 ${!sidebarOpen && 'md:hidden'}`}>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto p-4 md:p-8 bg-gradient-radial from-[#07111F] to-[#0B1220]">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
