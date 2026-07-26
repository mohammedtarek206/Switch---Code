'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiStar, FiCalendar, FiUsers, FiFlag, FiSliders } from 'react-icons/fi';
import Link from 'next/link';

interface AwardWinner {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
    email: string;
    committeeId?: {
        name: string;
    };
}

interface Award {
    _id: string;
    type: string;
    label: string;
    month: number;
    year: number;
    winnerId?: AwardWinner;
}

export default function HallOfFamePage() {
    const [lang, setLang] = useState<'en' | 'ar'>('ar');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [awards, setAwards] = useState<Award[]>([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);

    // Translations
    const t = {
        en: {
            title: "Community Hall Of Fame",
            subtitle: "Honoring our exceptional scholars, mentors, leaders, and contributors across history.",
            dateSelector: "Select Achievement Cycle",
            noAwards: "No awards recorded for the selected cycle. Check back later!",
            category: "Honorable Designation",
            winner: "Inducted Scholar",
            committee: "Organizers Group",
            points: "Points",
            monthName: (m: number) => `Month ${m}`,
        },
        ar: {
            title: "لوحة شرف الكوميونتي (Hall of Fame)",
            subtitle: "تكريم للأعضاء، القادة، والمدربين المتميزين الذين قادوا مسيرة العطاء عبر التاريخ.",
            dateSelector: "اختر دورة الإنجازات والأعضاء الأوائل",
            noAwards: "لم يتم تسجيل أي جوائز شرفية لهذه الدورة التاريخية بعد.",
            category: "الفئة والوسام الشرفي",
            winner: "العضو الفائز بالتكريم",
            committee: "اللجنة المنظم إليها",
            points: "نقطة",
            monthName: (m: number) => {
                const names = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
                return names[m - 1] || `شهر ${m}`;
            }
        }
    };

    async function fetchAwards() {
        setLoading(true);
        try {
            const res = await fetch(`/api/community/awards?month=${month}&year=${year}`);
            if (res.ok) {
                setAwards(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAwards();
    }, [month, year]);

    const cur = t[lang];

    return (
        <div className={`min-h-screen transition-colors duration-300 py-16 px-4 md:px-8 ${theme === 'dark' ? 'bg-[#07111F] text-white' : 'bg-white text-dark-light'
            }`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

            {/* Nav toggles */}
            <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
                <Link href="/community" className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} hover:underline`}>
                    &larr; {lang === 'ar' ? 'رجوع للإحصائيات العامة' : 'Back to Statistics'}
                </Link>
                <div className="flex gap-2 text-xs">
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="px-3.5 py-1.5 bg-slate-900 border border-blue-500/20 border border-blue-500/30 rounded-xl font-bold">
                        {theme === 'dark' ? 'Light Theme ☀️' : 'Dark Theme 🌙'}
                    </button>
                    <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="px-3.5 py-1.5 bg-slate-900 border border-blue-500/20 border border-blue-500/30 rounded-xl font-bold font-mono">
                        {lang === 'ar' ? 'English' : 'العربية'}
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto space-y-12">
                {/* Banner Title */}
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="inline-flex bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] uppercase font-bold tracking-widest px-4 py-1.5 rounded-full"
                    >
                        🏆 Legendary Standing
                    </motion.div>
                    <h1 className="text-3xl md:text-5xl font-extrabold">{cur.title}</h1>
                    <p className={`text-sm max-w-xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {cur.subtitle}
                    </p>
                </div>

                {/* Date Selector Timeline */}
                <div className="glass-panel p-6 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <span className="font-bold text-sm text-gray-400">{cur.dateSelector}</span>
                    <div className="flex space-x-2 gap-2 justify-end">
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="bg-black/30 text-white text-xs p-3 rounded-xl border border-blue-500/20 outline-none"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{cur.monthName(i + 1)}</option>
                            ))}
                        </select>

                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="bg-black/30 text-white text-xs p-3 rounded-xl border border-blue-500/20 outline-none"
                        >
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-gold"></div>
                    </div>
                ) : awards.length === 0 ? (
                    <div className="glass-panel p-12 rounded-3xl text-center text-gray-500 text-sm">
                        <FiSliders className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                        <p>{cur.noAwards}</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {awards.map((a, idx) => (
                            <motion.div
                                key={a._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="glass-panel p-6 rounded-3xl border border-blue-500/20 flex flex-col justify-between"
                                style={{ borderTop: '3px solid #EAB308' }}
                            >
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-full uppercase font-bold">
                                            {a.type.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-gray-500 text-[10px]">{a.month}/{a.year}</span>
                                    </div>
                                    <h4 className="font-extrabold text-white text-sm my-3">{a.label}</h4>
                                </div>

                                {a.winnerId ? (
                                    <div className="flex items-center space-x-3 gap-3 border-t border-blue-500/20 pt-4 mt-4">
                                        <div className="w-9 h-9 bg-slate-900 border border-blue-500/20 rounded-full flex items-center justify-center font-bold text-xs text-gold">
                                            {a.winnerId.avatar ? (
                                                <img src={a.winnerId.avatar} alt="Winner" className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                a.winnerId.name[0].toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-white font-bold block text-xs">{a.winnerId.name}</span>
                                            <span className="text-gray-500 text-[10px] block">{a.winnerId.committeeId?.name || 'Technical'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-xs italic">Anonymous / Committee Inducted</p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
