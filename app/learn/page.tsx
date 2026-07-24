'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBookOpen, FiYoutube, FiFileText, FiAward, FiCheckCircle, FiAlignLeft, FiLock } from 'react-icons/fi';
import Link from 'next/link';

export default function TechnicalLearningDashboard() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const u = JSON.parse(userStr);
            setUser(u);

            // Technical learning portal is for these specific roles ONLY
            const learningRoles = ['student', 'trainee', 'learner', 'technical_student', 'instructor', 'mentor', 'committee_leader', 'admin', 'super_admin'];
            if (!learningRoles.includes(u.role)) {
                window.location.href = '/dashboard';
            }
        }
        setLoading(false);
    }, []);

    if (loading) return null;

    const isInstructor = ['instructor', 'mentor', 'committee_leader', 'admin', 'super_admin'].includes(user?.role);
    const isCommunityStaff = ['hr', 'pr', 'marketing', 'media', 'committee_leader', 'member', 'admin', 'super_admin'].includes(user?.role);

    return (
        <div className="min-h-screen bg-dark text-white py-10 px-4 md:px-8">
            <div className="max-w-6xl mx-auto space-y-10">

                {/* Header w/ Separation Switcher */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="relative z-10">
                        <div className="inline-flex items-center bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full text-xs font-bold text-cyan-400 mb-2">
                            Switch Code LMS
                        </div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <FiBookOpen className="text-accent" /> Technical Learning Portal
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Your dedicated learning environment separated from the community management tools.</p>
                    </div>

                    <div className="relative z-10 flex gap-3">
                        {isCommunityStaff && (
                            <Link href="/dashboard" className="px-5 py-2.5 bg-dark border border-white/10 hover:border-white/20 rounded-xl font-bold text-xs text-white transition-all flex items-center gap-2">
                                Switch to Community Dashboard
                            </Link>
                        )}
                    </div>
                </div>

                {/* Dynamic Portal Body */}
                {isInstructor ? (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold border-l-4 border-accent pl-3">Instructor / Mentor View</h2>
                        <div className="grid md:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Students', val: 120, icon: FiUsers },
                                { label: 'Courses Managed', val: 3, icon: FiBookOpen },
                                { label: 'Pending Assignments', val: 45, icon: FiFileText },
                                { label: 'Draft Quizzes', val: 2, icon: FiAlignLeft },
                            ].map(s => (
                                <div key={s.label} className="glass border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[10px] text-gray-500 font-bold uppercase">{s.label}</h3>
                                        <p className="text-2xl font-extrabold text-white mt-1">{s.val}</p>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl text-accent"><s.icon className="w-5 h-5" /></div>
                                </div>
                            ))}
                        </div>

                        <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="font-bold text-white text-lg">Student Progress Tracking</h3>
                                <button className="bg-accent text-black font-bold text-xs px-4 py-2 rounded-xl">Add Assignment</button>
                            </div>
                            <div className="p-10 text-center text-gray-400 text-sm">
                                Instructor table fetching enrolled students, progress bars, last login, and assignment grades...
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold border-l-4 border-cyan-400 pl-3">My Learning Path</h2>

                        {/* Student Track Progress */}
                        <div className="glass p-8 rounded-3xl border border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h3 className="text-2xl font-extrabold text-white">Full-Stack React & Node.js</h3>
                                    <p className="text-gray-400 mt-1 text-sm">Technical Division Path • Batch 2026</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-extrabold text-cyan-400">45%</span>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Completed</p>
                                </div>
                            </div>
                            <div className="w-full h-3 bg-dark-light rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} transition={{ duration: 1 }} className="h-full bg-cyan-400 rounded-full" />
                            </div>
                        </div>

                        {/* Course Content Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { title: 'Video Lectures', icon: FiYoutube, desc: 'Watch recorded technical sessions', link: '/learn/videos', locked: false },
                                { title: 'Reading Materials', icon: FiFileText, desc: 'PDFs and documentation', link: '/learn/materials', locked: false },
                                { title: 'Quizzes', icon: FiAlignLeft, desc: 'Test your understanding', link: '/learn/quizzes', locked: false },
                                { title: 'Assignments & Projects', icon: FiCheckCircle, desc: 'Submit your practical tasks', link: '/learn/assignments', locked: false },
                                { title: 'Certificates', icon: FiAward, desc: 'Your generated track certificates', link: '/learn/certificates', locked: true },
                            ].map(item => (
                                <Link key={item.title} href={item.locked ? '#' : item.link} className={`glass p-6 rounded-3xl border border-white/5 group transition-all ${item.locked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:bg-white/[0.04]'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${item.locked ? 'bg-gray-500/10 text-gray-500' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        {item.locked && <FiLock className="text-gray-500" />}
                                    </div>
                                    <h4 className="font-bold text-white text-lg">{item.title}</h4>
                                    <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

// Ensure FiUsers is defined if we use it dynamically above
import { FiUsers } from 'react-icons/fi';
