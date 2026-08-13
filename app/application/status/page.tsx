'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiCode, FiMail, FiPhone, FiClock, FiInfo, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';

interface TrackResult {
    applicationCode: string;
    name: string;
    status: string;
    adminNote?: string | null;
    committee?: { name: string; color?: string };
    appliedAt: string;
    lastUpdated: string;
}

const STATUS_CONFIG: Record<string, { label: string; ar: string; cls: string; icon: string }> = {
    pending: { label: 'Pending', ar: 'قيد المراجعة', cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: '⏳' },
    reviewing: { label: 'Reviewing', ar: 'تحت المراجعة', cls: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: '🔍' },
    interview: { label: 'Interview', ar: 'مرحلة المقابلة', cls: 'text-purple-400 bg-purple-500/10 border-purple-500/30', icon: '🗣️' },
    accepted: { label: 'Accepted', ar: 'مقبول ✓', cls: 'text-green-400 bg-green-500/10 border-green-500/30', icon: '✅' },
    rejected: { label: 'Rejected', ar: 'غير مقبول', cls: 'text-red-400 bg-red-500/10 border-red-500/30', icon: '❌' },
    waiting: { label: 'Waiting', ar: 'قائمة الانتظار', cls: 'text-gray-400 bg-gray-500/10 border-gray-500/30', icon: '⏰' },
};

export default function ApplicationStatusPage() {
    const [code, setCode] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<TrackResult | null>(null);

    async function handleTrack(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setResult(null);
        setLoading(true);
        try {
            const res = await fetch('/api/applicant/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationCode: code.trim().toUpperCase(), identifier: identifier.trim() }),
            });
            const data = await res.json();
            if (res.ok) setResult(data);
            else setError(data.error || 'Application not found.');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    const sc = result ? (STATUS_CONFIG[result.status] || STATUS_CONFIG.pending) : null;

    return (
        <div className="min-h-screen bg-dark text-white flex flex-col items-center justify-center p-4">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-lg space-y-8">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-accent/10 border border-accent/20 rounded-2xl mb-4">
                        <FiSearch className="w-6 h-6 text-accent" />
                    </div>
                    <h1 className="text-3xl font-extrabold">Track Application</h1>
                    <p className="text-gray-400 text-sm">Enter your Application Code and Email / Phone to check your status</p>
                </motion.div>

                {/* Form */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <form onSubmit={handleTrack} className="glass p-8 rounded-3xl border border-white/5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-gray-400">Application Code</label>
                            <div className="relative">
                                <FiCode className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" />
                                <input
                                    type="text"
                                    required
                                    value={code}
                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                    placeholder="APP-2026-XXXXXXXX"
                                    className="w-full pl-11 pr-4 py-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm font-mono tracking-wider"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-gray-400">Email or Phone</label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    placeholder="your@email.com or 01012345678"
                                    className="w-full pl-11 pr-4 py-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                                <FiAlertCircle className="shrink-0" /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent hover:bg-accent-dark text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <><FiSearch /> Check Status</>
                            )}
                        </button>
                    </form>
                </motion.div>

                {/* Result */}
                <AnimatePresence>
                    {result && sc && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className={`glass p-8 rounded-3xl border ${sc.cls} space-y-5`}
                        >
                            <div className="text-center space-y-2">
                                <div className="text-5xl">{sc.icon}</div>
                                <h2 className="text-xl font-bold text-white">{result.name}</h2>
                                <code className="text-xs text-accent font-mono bg-accent/10 px-3 py-1 rounded-full">{result.applicationCode}</code>
                            </div>

                            <div className={`text-center p-4 rounded-2xl border ${sc.cls}`}>
                                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Application Status</div>
                                <div className={`text-2xl font-extrabold ${sc.cls.split(' ')[0]}`}>{sc.ar}</div>
                                <div className="text-sm text-gray-400 mt-0.5">{sc.label}</div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3 text-sm">
                                {result.committee && (
                                    <div className="bg-white/5 rounded-xl p-3">
                                        <div className="text-xs text-gray-500 font-semibold uppercase mb-1">Committee</div>
                                        <div className="font-bold" style={{ color: result.committee.color || 'white' }}>
                                            {result.committee.name}
                                        </div>
                                    </div>
                                )}
                                <div className="bg-white/5 rounded-xl p-3">
                                    <div className="text-xs text-gray-500 font-semibold uppercase mb-1">Applied</div>
                                    <div className="font-bold text-white text-xs">{new Date(result.appliedAt).toLocaleString()}</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 sm:col-span-2">
                                    <div className="text-xs text-gray-500 font-semibold uppercase mb-1">Last Updated</div>
                                    <div className="font-bold text-white text-xs">{new Date(result.lastUpdated).toLocaleString()}</div>
                                </div>
                            </div>

                            {result.adminNote && (
                                <div className="flex items-start gap-2 p-4 bg-white/5 rounded-xl text-sm">
                                    <FiInfo className="shrink-0 mt-0.5 text-accent" />
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 mb-1">Message from Admin</div>
                                        <div className="text-gray-300">{result.adminNote}</div>
                                    </div>
                                </div>
                            )}

                            <div className="text-center pt-2 border-t border-white/5">
                                <Link href="/applicant/login" className="text-sm text-accent hover:underline">
                                    Login for full dashboard →
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="text-center">
                    <Link href="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">← Back to Homepage</Link>
                    {' · '}
                    <Link href="/applicant/login" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Login to Dashboard</Link>
                </div>
            </div>
        </div>
    );
}
