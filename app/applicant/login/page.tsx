'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiCode, FiLock, FiArrowRight, FiAlertCircle, FiSearch } from 'react-icons/fi';
import Link from 'next/link';

export default function ApplicantLoginPage() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/applicant/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationCode: code.trim().toUpperCase(), password }),
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('applicantToken', data.token);
                localStorage.setItem('applicantData', JSON.stringify(data.application));
                router.push('/applicant/dashboard');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-dark text-white flex items-center justify-center p-4">
            {/* Background glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Logo / Brand */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl mb-4">
                        <FiCode className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white">Track Your Application</h1>
                    <p className="text-gray-400 text-sm mt-2">Login with your Application Code & Password</p>
                </div>

                <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm"
                        >
                            <FiAlertCircle className="shrink-0" /> {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-gray-400">Application Code</label>
                            <div className="relative">
                                <FiCode className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" />
                                <input
                                    id="application-code"
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
                            <label className="text-xs font-bold uppercase text-gray-400">Password</label>
                            <div className="relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="applicant-password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Your temporary password"
                                    className="w-full pl-11 pr-4 py-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent hover:bg-accent-dark text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-60"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>Login <FiArrowRight /></>
                            )}
                        </button>
                    </form>

                    <div className="text-center pt-2 border-t border-white/5">
                        <p className="text-xs text-gray-500 mb-3">Don&apos;t have your code?</p>
                        <Link
                            href="/application/status"
                            className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                        >
                            <FiSearch className="w-3.5 h-3.5" /> Track by Code + Email
                        </Link>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-600 mt-6">
                    <Link href="/" className="hover:text-gray-400 transition-colors">← Back to Homepage</Link>
                </p>
            </motion.div>
        </div>
    );
}
