'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiGrid, FiArrowRight, FiUsers, FiCpu } from 'react-icons/fi';
import Link from 'next/link';

interface Leader {
    name: string;
}

interface Committee {
    _id: string;
    name: string;
    description: string;
    color?: string;
    leaderId?: Leader;
}

export default function CommitteesDirectoryPage() {
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState<'en' | 'ar'>('ar');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        async function fetchCommittees() {
            try {
                const res = await fetch('/api/community/committees');
                if (res.ok) {
                    setCommittees(await res.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchCommittees();
    }, []);

    const t = {
        en: {
            title: "Committees Directory",
            subtitle: "Explore our specialized divisions driving tech education and platforms.",
            viewDetails: "Explore Committee",
            leader: "Committee Leader",
        },
        ar: {
            title: "دليل اللجان التخصصية",
            subtitle: "استكشف اللجان والأقسام التي تقود التدريب والمشاريع البرمجية بالكوميونتي.",
            viewDetails: "استكشف اللجنة",
            leader: "قائد اللجنة",
        }
    };

    const cur = t[lang];

    return (
        <div className={`min-h-screen transition-colors duration-300 py-16 px-4 md:px-8 ${theme === 'dark' ? 'bg-[#07111F] text-white' : 'bg-white text-dark-light'
            }`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

            <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
                <Link href="/community" className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} hover:underline`}>
                    &larr; {lang === 'ar' ? 'الرجوع للإحصائيات' : 'Back to Statistics'}
                </Link>
                <div className="flex gap-2">
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="px-3.5 py-1.5 bg-slate-900 border border-blue-500/20 border border-blue-500/30 rounded-xl text-xs font-bold">
                        {theme === 'dark' ? 'Light Theme ☀️' : 'Dark Theme 🌙'}
                    </button>
                    <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="px-3.5 py-1.5 bg-slate-900 border border-blue-500/20 border border-blue-500/30 rounded-xl text-xs font-bold font-mono">
                        {lang === 'ar' ? 'English' : 'العربية'}
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl md:text-5xl font-extrabold">{cur.title}</h1>
                    <p className={`text-sm max-w-xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {cur.subtitle}
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-gold"></div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {committees.map((c, idx) => (
                            <motion.div
                                key={c._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="glass-panel p-6 rounded-3xl border border-blue-500/20 flex flex-col justify-between"
                                style={{ borderTop: `4px solid ${c.color || '#00A3FF'}` }}
                            >
                                <div>
                                    <div className="flex items-center space-x-3 gap-3 mb-4">
                                        <div className="p-2 bg-slate-900 border border-blue-500/20 rounded-xl text-blue-500" style={{ color: c.color }}>
                                            <FiGrid className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white">{c.name}</h3>
                                    </div>

                                    <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-6">{c.description}</p>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-blue-500/20">
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>{cur.leader}</span>
                                        <span className="text-white font-bold">{c.leaderId?.name || 'Unassigned'}</span>
                                    </div>

                                    <Link
                                        href={`/community/committees/${c._id}`}
                                        className="w-full flex items-center justify-center p-3 bg-slate-900 border border-blue-500/20 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all border border-blue-500/20"
                                    >
                                        {cur.viewDetails} <FiArrowRight className="ml-1.5" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
