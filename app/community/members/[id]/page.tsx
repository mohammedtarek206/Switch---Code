'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiAward, FiBook, FiBriefcase, FiAlertCircle, FiMessageSquare, FiSliders } from 'react-icons/fi';
import Link from 'next/link';

interface Badge {
    _id: string;
    name: string;
    description: string;
    color?: string;
    icon?: string;
}

interface MemberProfile {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    position?: string;
    performanceScore?: number;
    bio?: string;
    skills?: string[];
    badges?: Badge[];
    committeeId?: {
        name: string;
    };
}

export default function MemberPublicProfilePage({ params }: { params: { id: string } }) {
    const [profile, setProfile] = useState<MemberProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState<'en' | 'ar'>('ar');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        async function fetchPublicProfile() {
            try {
                const res = await fetch(`/api/community/members/${params.id}`);
                if (res.ok) {
                    setProfile(await res.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchPublicProfile();
    }, [params.id]);

    const t = {
        en: {
            back: "Back to Directory",
            bio: "Professional Summary",
            skills: "Specialized Skillsets",
            badges: "Earned Badges",
            performance: "Global Score Board",
            points: "Points",
            tasks: "Completed Assignments",
            attendance: "Attendance Index",
            noBio: "No professional bio provided yet.",
            noSkills: "Skills list is empty.",
            noBadges: "No gamified badges earned yet."
        },
        ar: {
            back: "العودة لدليل الكوميونتي",
            bio: "نبذة عن العضو",
            skills: "المهارات التخصصية",
            badges: "الأوسمة والشارات المكتسبة",
            performance: "مركز تفاعل وتقييم العضو",
            points: "نقطة",
            tasks: "المهام المكتملة",
            attendance: "نسبة حضور الفعاليات والورش",
            noBio: "لا يوجد نبذة تعريفية مسجلة بعد.",
            noSkills: "قائمة المهارات فارغة حالياً.",
            noBadges: "لم يحصل العضو على أي أوسمة تكريمية حتى الآن."
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

    if (!profile) {
        return (
            <div className="min-h-screen bg-dark flex flex-col justify-center items-center text-gray-500">
                <FiAlertCircle className="w-12 h-12 mb-4 text-gray-600" />
                <p>User profile not found.</p>
                <Link href="/community" className="text-accent underline mt-2">Home</Link>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 py-16 px-4 md:px-8 ${theme === 'dark' ? 'bg-dark text-white' : 'bg-white text-dark-light'
            }`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

            {/* Nav bar */}
            <div className="max-w-4xl mx-auto flex justify-between items-center mb-10">
                <Link href="/community" className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} hover:underline`}>
                    &larr; {cur.back}
                </Link>
                <div className="flex gap-2">
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold">
                        {theme === 'dark' ? 'Light Theme ☀️' : 'Dark Theme 🌙'}
                    </button>
                    <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold font-mono">
                        {lang === 'ar' ? 'English' : 'العربية'}
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Core Profile Card banner */}
                <div className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-6 gap-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>

                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center font-bold text-3xl text-accent border border-white/10 overflow-hidden shadow-xl">
                        {profile.avatar ? (
                            <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            profile.name[0].toUpperCase()
                        )}
                    </div>

                    <div className="text-center sm:text-left space-y-2">
                        <h1 className="text-3xl font-extrabold text-white leading-tight">{profile.name}</h1>
                        <p className="text-xs text-accent font-semibold uppercase tracking-wider">
                            {profile.committeeId?.name || 'Volunteer Core'} • {profile.position || profile.role.replace('_', ' ')}
                        </p>
                        <p className="text-gray-500 text-xs">{profile.email}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Bio */}
                        <div className="glass p-8 rounded-3xl space-y-3">
                            <h3 className="font-bold text-white text-md border-b border-white/5 pb-2">{cur.bio}</h3>
                            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {profile.bio || cur.noBio}
                            </p>
                        </div>

                        {/* Skills */}
                        <div className="glass p-8 rounded-3xl space-y-3">
                            <h3 className="font-bold text-white text-md border-b border-white/5 pb-2">{cur.skills}</h3>
                            {!profile.skills || profile.skills.length === 0 ? (
                                <p className="text-gray-500 text-xs italic">{cur.noSkills}</p>
                            ) : (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {profile.skills.map((skill) => (
                                        <span key={skill} className="bg-white/5 border border-white/5 text-gray-300 text-xs px-3 py-1.5 rounded-xl font-medium">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Badges */}
                        <div className="glass p-8 rounded-3xl space-y-3">
                            <h3 className="font-bold text-white text-md border-b border-white/5 pb-2">{cur.badges}</h3>
                            {!profile.badges || profile.badges.length === 0 ? (
                                <p className="text-gray-500 text-xs italic">{cur.noBadges}</p>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                                    {profile.badges.map((b) => (
                                        <div
                                            key={b._id}
                                            className="p-3 bg-white/5 border-l-4 rounded-xl flex items-center justify-between"
                                            style={{ borderLeftColor: b.color || '#EAB308' }}
                                        >
                                            <div>
                                                <span className="text-white text-xs font-bold block">{b.name}</span>
                                                <span className="text-[10px] text-gray-500 block leading-tight">{b.description}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Summary Index */}
                    <div className="space-y-6">
                        <div className="glass p-8 rounded-3xl space-y-6">
                            <h3 className="text-md font-bold border-b border-white/5 pb-2">{cur.performance}</h3>

                            <div className="text-center py-4 bg-white/5 rounded-2xl">
                                <FiAward className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                                <span className="text-gray-400 text-[10px] uppercase font-bold block">Current Points Total</span>
                                <span className="text-2xl font-extrabold text-white mt-1 block">{profile.performanceScore || 0} pts</span>
                            </div>

                            <div className="space-y-4 text-xs">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-gray-500">Attendance Index</span>
                                    <span className="font-bold text-white">88%</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-gray-500">Tasks Complete Ratio</span>
                                    <span className="font-bold text-white">95%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
