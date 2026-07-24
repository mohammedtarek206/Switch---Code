'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiStar, FiGrid, FiArrowRight, FiUsers, FiCalendar, FiActivity, FiBriefcase, FiBookOpen, FiUserCheck, FiTarget } from 'react-icons/fi';
import Link from 'next/link';

interface UserBadge {
    _id: string;
    name: string;
    color?: string;
}

interface MemberCard {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
    position?: string;
    performanceScore: number;
    tasksCount?: number;
    attendanceRatio?: number;
    badges?: UserBadge[];
    committeeId?: {
        name: string;
    };
}

interface PerformanceMetric {
    titleEn: string;
    titleAr: string;
    subtitleEn: string;
    subtitleAr: string;
    type: string;
    member?: MemberCard;
    committeeName?: string;
    score?: number | string;
}

export default function PublicCommunityPage() {
    const [lang, setLang] = useState<'en' | 'ar'>('ar');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
    const [loading, setLoading] = useState(true);

    // Translations
    const t = {
        en: {
            title: "Switch Code Community Insights",
            subtitle: "Discover rankings, performance charts, badges, and top contributors.",
            activeCycle: "Active Volunteer Term",
            membersTab: "Top Contributors",
            hallOfFame: "Hall of Fame",
            committeePages: "Committees Directory",
            points: "Points",
            tasks: "Tasks Done",
            attendance: "Attendance",
            visitProfile: "View profile",
            topMember: "Member of the Month",
            mostActive: "Most Active Member",
            topRated: "Highest Rated Member",
            bestLeader: "Best Committee Leader",
            bestViceLeader: "Best Vice Leader",
            bestCommittee: "Best Committee",
            mostActiveComm: "Most Active Committee",
            mostAttendedComm: "Most Commited Committee",
            bestInstructor: "Best Instructor",
            bestMentor: "Best Mentor",
            bestVolunteer: "Best Volunteer",
        },
        ar: {
            title: "إحصائيات مجتمع سويتش كود",
            subtitle: "اكتشف تصنيفات الأعضاء، واللجان النشطة، والجوائز، والأوسمة المتميزة.",
            activeCycle: "فترة التطوع الحالية",
            membersTab: "المساهمون الأوائل",
            hallOfFame: "لوحة الشرف التاريخية",
            committeePages: "دليل اللجان المشتركة",
            points: "نقطة",
            tasks: "المهام المنجزة",
            attendance: "نسبة الحضور",
            visitProfile: "عرض الملف الشخصي",
            topMember: "عضو الشهر المتميز",
            mostActive: "العضو الأكثر نشاطاً",
            topRated: "الأعضاء الأعلى تقييماً",
            bestLeader: "أفضل قائد لجنة",
            bestViceLeader: "أفضل نائب قائد",
            bestCommittee: "اللجنة المتميزة",
            mostActiveComm: "اللجنة الأكثر نشاطاً",
            mostAttendedComm: "اللجنة الأكثر التزاماً بالحضور",
            bestInstructor: "أفضل مدرب (Instructor)",
            bestMentor: "أفضل موجه (Mentor)",
            bestVolunteer: "أفضل متطوع (Volunteer)",
        }
    };

    useEffect(() => {
        async function fetchPublicInsights() {
            try {
                const res = await fetch('/api/community/leaderboard');
                if (res.ok) {
                    const membersList: MemberCard[] = await res.json();

                    // Generate mocked/computed highlights from data dynamically
                    const computedMetrics: PerformanceMetric[] = [
                        {
                            titleEn: "Member of the Month",
                            titleAr: "عضو الشهر المتميز",
                            subtitleEn: "Awarded for exceptional monthly contributions.",
                            subtitleAr: "مُنحت للأداء الاستثنائي طوال الشهر.",
                            type: "member",
                            member: membersList[0] || null
                        },
                        {
                            titleEn: "Most Active Member",
                            titleAr: "العضو الأكثر نشاطاً",
                            subtitleEn: "Highest count of ticket & task deliveries.",
                            subtitleAr: "صاحب أعلى معدل لإنجاز المهام.",
                            type: "member",
                            member: membersList[1] || null
                        },
                        {
                            titleEn: "Best Committee",
                            titleAr: "أفضل لجنة نشطة",
                            subtitleEn: "Top operational standing and attendance rates.",
                            subtitleAr: "اللجنة الحاصلة على التقييم الأعلى تشغيلياً.",
                            type: "committee",
                            committeeName: membersList[0]?.committeeId?.name || "Technical Committee",
                            score: "98% Efficiency"
                        },
                        {
                            titleEn: "Best Tech Volunteer",
                            titleAr: "أفضل متطوع تقني",
                            subtitleEn: "Best code quality outputs and assistance.",
                            subtitleAr: "أفضل جودة للمخرجات والمساعدات البرمجية.",
                            type: "member",
                            member: membersList[2] || null
                        },
                        {
                            titleEn: "Best Instructor",
                            titleAr: "أفضل مدرب",
                            subtitleEn: "Top rated session guides and resources.",
                            subtitleAr: "المدرب الأعلى تقييماً في الجلسات التدريبية.",
                            type: "member",
                            member: membersList.find(m => m.role.includes('instructor')) || membersList[3] || null
                        },
                        {
                            titleEn: "Best Mentor",
                            titleAr: "أفضل موجه",
                            subtitleEn: "Exceptional assistance and code reviews.",
                            subtitleAr: "الموجه الأكثر تميزاً في توجيه الفرق البرمجية.",
                            type: "member",
                            member: membersList.find(m => m.role.includes('mentor')) || membersList[4] || null
                        }
                    ];

                    setMetrics(computedMetrics.filter(m => m.member || m.committeeName));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchPublicInsights();
    }, []);

    const cur = t[lang];

    return (
        <div className={`min-h-screen transition-colors duration-300 py-20 px-4 md:px-8 ${theme === 'dark' ? 'bg-dark text-white' : 'bg-white text-dark-light'
            }`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

            {/* Settings bar */}
            <div className="max-w-7xl mx-auto flex justify-between items-center mb-10">
                <Link href="/" className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} hover:underline`}>
                    &larr; Switch Code Main
                </Link>

                <div className="flex items-center space-x-3 gap-2">
                    {/* Theme select */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold"
                    >
                        {theme === 'dark' ? 'Light Theme ☀️' : 'Dark Theme 🌙'}
                    </button>
                    {/* Language selector */}
                    <button
                        onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                        className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold font-mono"
                    >
                        {lang === 'ar' ? 'English' : 'العربية'}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-16">
                {/* Landing description header */}
                <div className="text-center space-y-4">
                    <motion.h1
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r ${theme === 'dark' ? 'from-primary via-accent to-cyber' : 'from-indigo-600 via-primary to-accent'
                            } bg-clip-text text-transparent`}
                    >
                        {cur.title}
                    </motion.h1>
                    <p className={`text-md max-w-2xl mx-auto leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {cur.subtitle}
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 pt-4 text-xs font-bold">
                        <Link href="/community/hall-of-fame" className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl transition-all shadow-md">
                            {cur.hallOfFame}
                        </Link>
                        <Link href="/community/committees" className="bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-2.5 rounded-xl transition-all">
                            {cur.committeePages}
                        </Link>
                    </div>
                </div>

                {/* Dynamic score summary stats */}
                {loading ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-white/5 h-48 rounded-3xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {metrics.map((m, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`glass border p-6 rounded-3xl flex flex-col justify-between hover:scale-[1.02] transition-all duration-300 ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'
                                    }`}
                            >
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] uppercase font-extrabold text-accent bg-accent/15 px-3 py-1 rounded-full">
                                            {lang === 'ar' ? m.titleAr : m.titleEn}
                                        </span>
                                        <span className="text-gray-500 text-[10px]">{lang === 'ar' ? m.subtitleAr : m.subtitleEn}</span>
                                    </div>

                                    {m.type === 'member' && m.member ? (
                                        <div className="flex items-center space-x-3 gap-3 my-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-bold text-accent text-sm border-2 border-primary overflow-hidden">
                                                {m.member.avatar ? (
                                                    <img src={m.member.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    m.member.name[0].toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-extrabold text-md block leading-tight">{m.member.name}</h4>
                                                <span className="text-xs text-gray-500 block mt-1">
                                                    {m.member.committeeId?.name || 'Technical'} • {m.member.position || m.member.role.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="my-6">
                                            <h4 className="font-extrabold text-xl">{m.committeeName}</h4>
                                            <p className="text-xs text-gray-500 mt-1">Active Rank Indicator</p>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between text-xs">
                                    {m.type === 'member' && m.member ? (
                                        <>
                                            <span className="flex items-center font-extrabold text-accent">
                                                <FiAward className="mr-1.5" /> {m.member.performanceScore} {cur.points}
                                            </span>
                                            <Link href={`/community/members/${m.member._id}`} className="text-primary hover:underline flex items-center gap-1">
                                                {cur.visitProfile} <FiArrowRight className="text-[10px]" />
                                            </Link>
                                        </>
                                    ) : (
                                        <span className="font-extrabold text-primary">{m.score}</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
