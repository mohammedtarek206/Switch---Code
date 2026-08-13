'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiUsers, FiGrid, FiCalendar, FiArrowLeft, FiRefreshCw,
    FiCheckCircle, FiAlertCircle, FiInfo, FiHome, FiSearch,
    FiLoader, FiUser, FiBell
} from 'react-icons/fi';
import Link from 'next/link';

interface DashboardData {
    applicant: {
        name: string;
        applicationCode: string;
        email: string;
        phone?: string;
        university?: string;
        faculty?: string;
        status: string;
        adminNote?: string;
        appliedAt: string;
        acceptedAt: string;
    };
    committee: {
        _id: string;
        name: string;
        color?: string;
        description?: string;
        type?: string;
        membersCount: number;
        members: Array<{ name: string; role?: string; position?: string; avatar?: string; username?: string }>;
    };
    announcements: Array<{ _id: string; title: string; body: string; createdAt: string }>;
}

type PageState =
    | { phase: 'auth' }          // Show login form
    | { phase: 'loading' }       // Fetching data
    | { phase: 'success'; data: DashboardData }
    | { phase: 'error'; message: string; code?: number };

export default function ApplicantCommitteeDashboard() {
    const [pageState, setPageState] = useState<PageState>({ phase: 'auth' });
    const [code, setCode] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // On mount, restore session from sessionStorage to avoid re-entry
    useEffect(() => {
        const saved = sessionStorage.getItem('applicant_cd_session');
        if (saved) {
            try {
                const { code: c, identifier: i } = JSON.parse(saved);
                setCode(c);
                setIdentifier(i);
                fetchDashboard(c, i, true);
            } catch {
                sessionStorage.removeItem('applicant_cd_session');
            }
        }
    }, []);

    async function fetchDashboard(appCode: string, id: string, silent = false) {
        if (!silent) setSubmitting(true);
        setPageState({ phase: 'loading' });

        // 6-second timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        try {
            const res = await fetch('/api/applicant/committee-dashboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationCode: appCode, identifier: id }),
                signal: controller.signal,
                cache: 'no-store',
            });

            clearTimeout(timeout);
            const result = await res.json();

            if (res.ok) {
                setPageState({ phase: 'success', data: result });
                // Save session for page refresh
                sessionStorage.setItem('applicant_cd_session', JSON.stringify({ code: appCode, identifier: id }));
            } else {
                setPageState({ phase: 'error', message: result.error || 'حدث خطأ غير متوقع.', code: res.status });
            }
        } catch (err: any) {
            clearTimeout(timeout);
            if (err?.name === 'AbortError') {
                setPageState({ phase: 'error', message: 'انتهت مهلة الاتصال بالخادم. تحقق من اتصالك بالإنترنت وأعد المحاولة.' });
            } else {
                setPageState({ phase: 'error', message: 'حدث خطأ في الاتصال بالشبكة.' });
            }
        } finally {
            setSubmitting(false);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        fetchDashboard(code.trim().toUpperCase(), identifier.trim());
    }

    function handleRetry() {
        if (code && identifier) {
            fetchDashboard(code, identifier);
        } else {
            setPageState({ phase: 'auth' });
        }
    }

    function handleLogout() {
        sessionStorage.removeItem('applicant_cd_session');
        setCode('');
        setIdentifier('');
        setPageState({ phase: 'auth' });
    }

    // ─── LOADING STATE ──────────────────────────────────────────────────────
    if (pageState.phase === 'loading') {
        return (
            <div className="min-h-screen bg-[#07111F] flex flex-col items-center justify-center gap-6 text-white">
                <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-gold" />
                <p className="text-gray-400 font-bold text-lg">جاري تحميل لوحة التحكم...</p>
            </div>
        );
    }

    // ─── ERROR STATE ──────────────────────────────────────────────────────────
    if (pageState.phase === 'error') {
        const { message, code: errCode } = pageState;
        let icon = <FiAlertCircle className="w-16 h-16 text-red-400 mx-auto" />;
        let title = 'حدث خطأ';
        let sub = message;

        if (errCode === 401) { icon = <FiAlertCircle className="w-16 h-16 text-yellow-400 mx-auto" />; title = 'يجب تسجيل الدخول'; }
        if (errCode === 403) { icon = <FiAlertCircle className="w-16 h-16 text-orange-400 mx-auto" />; title = 'غير مسموح بالدخول'; }
        if (errCode === 404) { icon = <FiSearch className="w-16 h-16 text-blue-400 mx-auto" />; title = 'لم يتم العثور على الطلب'; }
        if (errCode === 500) { icon = <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto" />; title = 'خطأ في الخادم'; }

        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-10 text-center space-y-6 text-white">
                    {icon}
                    <h2 className="text-2xl font-black">{title}</h2>
                    <p className="text-gray-400 text-sm leading-relaxed">{sub}</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleRetry}
                            className="w-full py-3.5 bg-gold text-black font-extrabold rounded-xl flex items-center justify-center gap-2">
                            <FiRefreshCw /> إعادة المحاولة
                        </button>
                        <button onClick={handleLogout}
                            className="w-full py-3 bg-white/5 border border-white/10 text-gray-300 font-bold rounded-xl">
                            العودة لصفحة الدخول
                        </button>
                        <Link href="/join/track"
                            className="w-full py-3 text-center text-sm text-gray-500 hover:text-gray-300 transition-colors underline">
                            متابعة الطلب
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ─── AUTH FORM STATE ───────────────────────────────────────────────────────
    if (pageState.phase === 'auth') {
        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center p-4">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 border border-gold/20 rounded-2xl mb-4">
                            <FiGrid className="w-8 h-8 text-gold" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-white">لوحة تحكم اللجنة</h1>
                        <p className="text-gray-400 text-sm mt-2">للطلاب المقبولين فقط</p>
                    </div>

                    <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl space-y-5">
                        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400 block">كود التقديم (Application Code)</label>
                                <input
                                    type="text"
                                    required
                                    value={code}
                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                    placeholder="APP-2026-XXXXXXXX"
                                    className="w-full p-4 bg-[#07111F] border border-white/10 rounded-xl text-white outline-none focus:border-gold text-center font-mono tracking-widest text-sm"
                                    dir="ltr"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400 block">البريد الإلكتروني أو رقم الهاتف</label>
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    placeholder="email@example.com أو 010..."
                                    className="w-full p-4 bg-[#07111F] border border-white/10 rounded-xl text-white outline-none focus:border-gold text-center font-mono text-sm"
                                    dir="ltr"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-gold hover:bg-yellow-400 text-black font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50"
                            >
                                {submitting ? <><FiRefreshCw className="animate-spin" /> جاري التحقق...</> : 'دخول لوحة التحكم'}
                            </button>
                        </form>

                        <div className="pt-4 border-t border-white/5 text-center">
                            <Link href="/join/track" className="text-sm text-gold hover:underline flex items-center justify-center gap-1.5">
                                <FiSearch className="w-3.5 h-3.5" /> متابعة حالة طلبي
                            </Link>
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-600 mt-6">
                        <Link href="/" className="hover:text-gray-400 transition-colors">← الصفحة الرئيسية</Link>
                    </p>
                </motion.div>
            </div>
        );
    }

    // ─── SUCCESS / DASHBOARD STATE ─────────────────────────────────────────────
    const { data } = pageState;
    const { applicant, committee, announcements } = data;

    return (
        <div className="min-h-screen bg-[#07111F] text-white">
            {/* Header */}
            <div className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 px-4 md:px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <FiHome className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">لوحة تحكم اللجنة</div>
                        <h1 className="text-lg font-extrabold text-white">{committee.name}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchDashboard(code, identifier, true)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="تحديث"
                    >
                        <FiRefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="text-xs text-gray-500 hover:text-red-400 font-bold transition-colors px-3 py-2 rounded-xl hover:bg-red-500/10"
                    >
                        خروج
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8" dir="rtl">

                {/* Welcome Banner */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-green-900/30 via-slate-900/50 to-green-900/30 border border-green-500/20 rounded-3xl p-6 flex items-center justify-between gap-4">
                    <div>
                        <div className="text-[10px] text-green-400 uppercase font-black tracking-widest mb-1">✅ تم قبولك بنجاح</div>
                        <h2 className="text-2xl font-black text-white">أهلاً بك، {applicant.name.split(' ')[0]}!</h2>
                        <p className="text-green-200 text-sm mt-1">مرحباً بك في <strong>{committee.name}</strong>. نسعد بانضمامك.</p>
                    </div>
                    <div className="text-5xl hidden sm:block">🎉</div>
                </motion.div>

                {/* Stats Row */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'اسم اللجنة', value: committee.name, icon: FiGrid, color: 'text-gold' },
                        { label: 'نوع اللجنة', value: committee.type || 'عامة', icon: FiInfo, color: 'text-blue-400' },
                        { label: 'عدد الأعضاء', value: `${committee.membersCount}+`, icon: FiUsers, color: 'text-green-400' },
                        { label: 'حالة طلبك', value: 'مقبول ✓', icon: FiCheckCircle, color: 'text-green-400' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-2">
                            <div className={`text-xs font-bold uppercase tracking-wider ${stat.color}`}>
                                <stat.icon className="inline w-3.5 h-3.5 ml-1" />{stat.label}
                            </div>
                            <div className="text-xl font-extrabold text-white">{stat.value}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Two-column layout */}
                <div className="grid md:grid-cols-2 gap-6">

                    {/* Applicant Info */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 space-y-4">
                        <h3 className="font-bold text-white flex items-center gap-2"><FiUser className="text-gold" /> بياناتي</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'الاسم', value: applicant.name },
                                { label: 'كود التقديم', value: applicant.applicationCode, mono: true },
                                { label: 'البريد الإلكتروني', value: applicant.email },
                                { label: 'رقم الهاتف', value: applicant.phone || 'غير محدد' },
                                { label: 'الجامعة', value: applicant.university || 'غير محدد' },
                                { label: 'الكلية', value: applicant.faculty || 'غير محدد' },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{item.label}</span>
                                    <span className={`text-sm font-bold text-white text-left ${(item as any).mono ? 'font-mono text-gold' : ''}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                        {applicant.adminNote && (
                            <div className="p-3 bg-gold/5 border border-gold/20 rounded-xl">
                                <div className="text-xs font-bold text-gold mb-1">رسالة من الإدارة:</div>
                                <p className="text-sm text-gray-300">{applicant.adminNote}</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Committee Info */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                        className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 space-y-4">
                        <h3 className="font-bold text-white flex items-center gap-2"><FiGrid className="text-gold" /> لجنتي — {committee.name}</h3>
                        {committee.description && (
                            <p className="text-sm text-gray-400 leading-relaxed">{committee.description}</p>
                        )}
                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                <FiUsers className="inline w-3.5 h-3.5 ml-1" /> أعضاء اللجنة ({committee.membersCount})
                            </div>
                            {committee.members.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {committee.members.map((member, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-bold text-gold text-sm flex-shrink-0">
                                                {member.avatar
                                                    ? <img src={member.avatar} className="w-full h-full rounded-full object-cover" alt={member.name} />
                                                    : (member.name?.[0] || '?')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{member.name}</p>
                                                <p className="text-[10px] text-gray-500">{member.position || member.role?.replace(/_/g, ' ')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">لا يوجد أعضاء مسجلون بعد.</p>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Announcements */}
                {announcements.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 space-y-4">
                        <h3 className="font-bold text-white flex items-center gap-2"><FiBell className="text-blue-400" /> الإعلانات والأخبار</h3>
                        <div className="space-y-3">
                            {announcements.map(ann => (
                                <div key={ann._id} className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <p className="font-bold text-white text-sm">{ann.title}</p>
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                            {new Date(ann.createdAt).toLocaleDateString('ar-EG')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{ann.body}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Next Steps CTA */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="bg-gradient-to-br from-gold/10 via-transparent to-gold/5 border border-gold/20 rounded-3xl p-6 text-center space-y-4">
                    <h3 className="font-black text-xl text-white">🚀 ماذا بعد القبول؟</h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                        ستتواصل معك الإدارة عبر البريد الإلكتروني للتنسيق وإضافتك رسمياً إلى قنوات اللجنة والمجموعات.
                        في حال تأخر التواصل، يمكنك التواصل عبر صفحة اتصل بنا.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link href="/contact"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-black font-extrabold rounded-xl text-sm transition-all hover:bg-yellow-400">
                            تواصل مع الإدارة
                        </Link>
                        <Link href="/join/track"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl text-sm hover:bg-white/10 transition-all">
                            <FiSearch /> متابعة الطلب
                        </Link>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
