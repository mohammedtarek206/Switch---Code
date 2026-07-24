'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiGrid, FiUsers, FiAward, FiCalendar, FiCpu, FiPlus, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';

interface User {
    _id: string;
    name: string;
    avatar?: string;
    performanceScore?: number;
}

interface CommitteeDetail {
    _id: string;
    name: string;
    description: string;
    color?: string;
    leaderId?: {
        name: string;
        avatar?: string;
    };
    viceLeaderId?: {
        name: string;
        avatar?: string;
    };
}

export default function CommitteeDetailPage({ params }: { params: { id: string } }) {
    const [committee, setCommittee] = useState<CommitteeDetail | null>(null);
    const [members, setMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState<'en' | 'ar'>('ar');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        async function fetchCommitteeData() {
            try {
                const [commRes, memRes] = await Promise.all([
                    fetch(`/api/community/committees/${params.id}`),
                    fetch(`/api/community/committees/${params.id}/members`)
                ]);

                if (commRes.ok) setCommittee(await commRes.json());
                if (memRes.ok) setMembers(await memRes.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchCommitteeData();
    }, [params.id]);

    const t = {
        en: {
            leader: "Committee Leader",
            viceLeader: "Vice Leader",
            membersCount: "Members Subscribed",
            activityRate: "Activity Factor",
            attendanceRate: "Attendance Performance",
            overview: "Committee Overview & Goals",
            membersTitle: "Assigned Volunteers",
            eventsTitle: "Latest Seminars & Events",
            projectsTitle: "Special Projects",
            achievementsTitle: "Committee Achievements",
            points: "points",
            noMembers: "No active volunteer members in this committee yet.",
        },
        ar: {
            leader: "قائد اللجنة",
            viceLeader: "نائب قائد اللجنة",
            membersCount: "إجمالي الأعضاء باللجنة",
            activityRate: "نسبة النشاط والفاعلية",
            attendanceRate: "متوسط نسبة حضور اللقاءات",
            overview: "عن اللجنة وأهدافها الأساسية",
            membersTitle: "فريق عمل اللجنة والمتطوعين",
            eventsTitle: "الفعاليات والأنشطة الأخيرة",
            projectsTitle: "مشاريع اللجنة وحلولها البرمجية",
            achievementsTitle: "أبرز الإنجازات والوسائل التعلمية",
            points: "نقطة",
            noMembers: "لا يوجد أعضاء نشطين مسجلين في هذه اللجنة حالياً.",
        }
    };

    const cur = t[lang];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (!committee) {
        return (
            <div className="min-h-screen bg-dark flex flex-col justify-center items-center text-gray-400">
                <FiAlertCircle className="w-12 h-12 mb-4 text-gray-500" />
                <p>Committee not found.</p>
                <Link href="/community/committees" className="text-accent underline mt-2">Back</Link>
            </div>
        );
    }

    const headerColor = committee.color || '#00A3FF';

    return (
        <div className={`min-h-screen transition-colors duration-300 pb-20 ${theme === 'dark' ? 'bg-dark text-white' : 'bg-white text-dark-light'
            }`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

            {/* Hero Banner header */}
            <div className="relative h-60 w-full overflow-hidden bg-black/40">
                <div className="absolute inset-0 opacity-40 bg-gradient-to-tr" style={{ background: `linear-gradient(135deg, ${headerColor}20, ${headerColor}05)` }}></div>
                <div className="absolute bottom-6 left-6 right-6 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-4 z-10 px-4 md:px-0">
                    <div className="space-y-2">
                        <Link href="/community/committees" className="flex items-center text-xs text-gray-400 hover:text-white mb-2">
                            <FiArrowLeft className="mr-1.5 ml-1.5" /> {lang === 'ar' ? 'العودة للجان' : 'Back to Directory'}
                        </Link>
                        <h1 className="text-4xl font-extrabold text-white">{committee.name}</h1>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-bold">
                            {theme === 'dark' ? 'Light Theme ☀️' : 'Dark Theme 🌙'}
                        </button>
                        <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-bold">
                            {lang === 'ar' ? 'English' : 'العربية'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-0 mt-12 grid lg:grid-cols-3 gap-8">
                {/* Core content description */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Overview */}
                    <div className="glass p-8 rounded-3xl space-y-4">
                        <h3 className="text-xl font-bold flex items-center">
                            <FiGrid className="mr-2 ml-2 text-accent" /> {cur.overview}
                        </h3>
                        <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {committee.description}
                        </p>
                    </div>

                    {/* Members team */}
                    <div className="glass p-8 rounded-3xl space-y-6">
                        <h3 className="text-xl font-bold flex items-center">
                            <FiUsers className="mr-2 ml-2 text-accent" /> {cur.membersTitle} ({members.length})
                        </h3>
                        {members.length === 0 ? (
                            <p className="text-gray-500 text-xs italic">{cur.noMembers}</p>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {members.map((m) => (
                                    <div key={m._id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center space-x-3 gap-3">
                                            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center font-bold text-xs text-accent">
                                                {m.avatar ? (
                                                    <img src={m.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    m.name[0].toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-white font-bold block text-sm">{m.name}</span>
                                                <span className="text-gray-500 text-xs">{lang === 'ar' ? 'عضو نشط باللجنة' : 'Active Member'}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-yellow-500 font-extrabold">{m.performanceScore || 0} pts</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Projects showcase */}
                    <div className="glass p-8 rounded-3xl space-y-4">
                        <h3 className="text-xl font-bold flex items-center">
                            <FiCpu className="mr-2 ml-2 text-accent" /> {cur.projectsTitle}
                        </h3>
                        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl text-center text-xs text-gray-500">
                            {lang === 'ar' ? 'مشاريع الـ Hackathon القادمة وحلول اللجنة قيد التطوير حالياً.' : 'Upcoming Hackathon prototypes & systems are in active development cycles.'}
                        </div>
                    </div>
                </div>

                {/* Sidebar Leaders & Metrics */}
                <div className="space-y-6">
                    {/* Leaders stack */}
                    <div className="glass p-8 rounded-3xl space-y-6">
                        <h3 className="text-lg font-bold border-b border-white/5 pb-3">Leaders in Command</h3>

                        {/* Leader */}
                        <div className="space-y-2">
                            <span className="text-xs text-gray-500 block uppercase font-bold">{cur.leader}</span>
                            <div className="flex items-center space-x-3 gap-3 p-3 bg-white/5 rounded-xl">
                                <div className="w-9 h-9 bg-accent/20 text-accent rounded-full flex items-center justify-center font-bold text-xs">
                                    {committee.leaderId?.name ? committee.leaderId.name[0].toUpperCase() : '?'}
                                </div>
                                <span className="font-extrabold text-white text-sm">{committee.leaderId?.name || 'Vacant / Appointing'}</span>
                            </div>
                        </div>

                        {/* Vice Leader */}
                        <div className="space-y-2">
                            <span className="text-xs text-gray-500 block uppercase font-bold">{cur.viceLeader}</span>
                            <div className="flex items-center space-x-3 gap-3 p-3 bg-white/5 rounded-xl">
                                <div className="w-9 h-9 bg-primary/20 text-primary-light rounded-full flex items-center justify-center font-bold text-xs">
                                    {committee.viceLeaderId?.name ? committee.viceLeaderId.name[0].toUpperCase() : '?'}
                                </div>
                                <span className="font-extrabold text-white text-sm">{committee.viceLeaderId?.name || 'Vacant / Appointing'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Metrics */}
                    <div className="glass p-8 rounded-3xl space-y-5">
                        <h3 className="text-lg font-bold border-b border-white/5 pb-3">Performance Indexes</h3>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>{cur.activityRate}</span>
                                <span className="text-white font-bold">92%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-accent" style={{ width: '92%' }}></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>{cur.attendanceRate}</span>
                                <span className="text-white font-bold">88%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: '88%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
