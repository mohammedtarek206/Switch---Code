'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiCode, FiClock, FiUser, FiMail, FiPhone, FiBookOpen, FiLogOut, FiRefreshCw, FiInfo } from 'react-icons/fi';
import Link from 'next/link';

interface ApplicationData {
    _id: string;
    applicationCode: string;
    name: string;
    email: string;
    phone?: string;
    university?: string;
    faculty?: string;
    status: string;
    adminNote?: string;
    committeeId?: { name: string; color?: string };
    recruitmentId?: { name: string };
    formData?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; ar: string; cls: string; icon: string }> = {
    pending: { label: 'Pending', ar: 'قيد المراجعة', cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: '⏳' },
    reviewing: { label: 'Reviewing', ar: 'تحت المراجعة', cls: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: '🔍' },
    interview: { label: 'Interview', ar: 'مرحلة المقابلة', cls: 'text-purple-400 bg-purple-500/10 border-purple-500/30', icon: '🗣️' },
    accepted: { label: 'Accepted', ar: 'مقبول ✓', cls: 'text-green-400 bg-green-500/10 border-green-500/30', icon: '✅' },
    rejected: { label: 'Rejected', ar: 'غير مقبول', cls: 'text-red-400 bg-red-500/10 border-red-500/30', icon: '❌' },
    waiting: { label: 'Waiting', ar: 'قائمة الانتظار', cls: 'text-gray-400 bg-gray-500/10 border-gray-500/30', icon: '⏰' },
};

export default function ApplicantDashboard() {
    const router = useRouter();
    const [app, setApp] = useState<ApplicationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    async function fetchApp(silent = false) {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const token = localStorage.getItem('applicantToken');
            if (!token) { router.push('/applicant/login'); return; }

            const res = await fetch('/api/applicant/me', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });

            if (res.status === 401) { localStorage.removeItem('applicantToken'); router.push('/applicant/login'); return; }
            if (res.ok) setApp(await res.json());
        } catch { /* silent */ } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => { fetchApp(); }, []);

    function logout() {
        localStorage.removeItem('applicantToken');
        localStorage.removeItem('applicantData');
        router.push('/applicant/login');
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
            </div>
        );
    }

    if (!app) return null;

    const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;

    return (
        <div className="min-h-screen bg-dark text-white">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-3xl" />
            </div>

            {/* Navbar */}
            <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between backdrop-blur-sm sticky top-0 z-10 bg-dark/80">
                <div className="flex items-center gap-2">
                    <FiCode className="text-accent w-5 h-5" />
                    <span className="font-bold text-white">My Application</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => fetchApp(true)} disabled={refreshing} className="text-gray-400 hover:text-white transition-colors">
                        <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={logout} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors">
                        <FiLogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
                {/* Welcome */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-extrabold">Welcome, {app.name.split(' ')[0]} 👋</h1>
                    <p className="text-gray-400 text-sm mt-1">Here's the live status of your application.</p>
                </motion.div>

                {/* Status Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`glass p-8 rounded-3xl border ${sc.cls} text-center space-y-3`}
                >
                    <div className="text-5xl">{sc.icon}</div>
                    <div>
                        <div className="text-xs uppercase font-bold text-gray-400 tracking-widest mb-1">Application Status</div>
                        <div className={`text-3xl font-extrabold ${sc.cls.split(' ')[0]}`}>{sc.ar}</div>
                        <div className="text-gray-400 text-sm mt-1">{sc.label}</div>
                    </div>
                    {app.adminNote && (
                        <div className="flex items-start gap-2 text-left p-4 bg-white/5 rounded-xl mt-4 text-sm">
                            <FiInfo className="shrink-0 mt-0.5 text-accent" />
                            <div>
                                <div className="text-xs font-bold text-gray-400 mb-1">Message from Admin:</div>
                                <div className="text-gray-300">{app.adminNote}</div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass p-6 rounded-3xl border border-white/5 space-y-4"
                >
                    <h2 className="font-bold text-white flex items-center gap-2"><FiUser className="text-accent" /> Application Details</h2>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        {[
                            { icon: FiCode, label: 'Application Code', value: app.applicationCode, mono: true },
                            { icon: FiBookOpen, label: 'Committee', value: app.committeeId?.name || 'N/A', color: app.committeeId?.color },
                            { icon: FiMail, label: 'Email', value: app.email },
                            { icon: FiPhone, label: 'Phone', value: app.phone || 'N/A' },
                            { icon: FiUser, label: 'University', value: app.university || 'N/A' },
                            { icon: FiUser, label: 'Faculty', value: app.faculty || 'N/A' },
                        ].map(({ icon: Icon, label, value, mono, color }) => (
                            <div key={label} className="bg-white/3 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase mb-1">
                                    <Icon className="w-3.5 h-3.5" /> {label}
                                </div>
                                <div
                                    className={`font-bold ${mono ? 'font-mono text-accent text-sm' : 'text-white'}`}
                                    style={color ? { color } : {}}
                                >
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 text-xs text-gray-500 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1.5"><FiClock /> Applied: {new Date(app.createdAt).toLocaleString()}</div>
                        <div className="flex items-center gap-1.5"><FiClock /> Last Updated: {new Date(app.updatedAt).toLocaleString()}</div>
                    </div>
                </motion.div>

                {/* Status Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass p-6 rounded-3xl border border-white/5"
                >
                    <h2 className="font-bold text-white mb-4">Application Journey</h2>
                    <div className="flex items-center justify-between relative">
                        <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10 z-0" />
                        {['pending', 'reviewing', 'interview', 'accepted'].map((s, i) => {
                            const stages = ['pending', 'reviewing', 'interview', 'accepted', 'rejected', 'waiting'];
                            const currentIdx = stages.indexOf(app.status);
                            const stageIdx = stages.indexOf(s);
                            const isActive = app.status === s;
                            const isDone = currentIdx > stageIdx && app.status !== 'rejected';
                            const cfg = STATUS_CONFIG[s];
                            return (
                                <div key={s} className="relative z-10 flex flex-col items-center gap-1.5 text-center flex-1">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${isActive ? cfg.cls.replace('bg-', 'bg-').replace('text-', 'border-2 border-').split(' ').join(' ') : isDone ? 'bg-green-500 border-green-500 text-black' : 'bg-dark border-white/10 text-gray-600'}`}>
                                        {isDone ? '✓' : i + 1}
                                    </div>
                                    <div className={`text-xs font-semibold ${isActive ? cfg.cls.split(' ')[0] : isDone ? 'text-green-400' : 'text-gray-600'}`}>
                                        {cfg.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {(app.status === 'rejected' || app.status === 'waiting') && (
                        <div className={`mt-4 p-3 rounded-xl border text-sm text-center ${STATUS_CONFIG[app.status].cls}`}>
                            Status: {STATUS_CONFIG[app.status].ar}
                        </div>
                    )}
                </motion.div>

                <div className="text-center">
                    <Link href="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">← Back to Homepage</Link>
                </div>
            </div>
        </div>
    );
}
