'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiAlertCircle, FiArrowRight } from 'react-icons/fi';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/admin/dashboard');
            } else {
                setError(data.error || 'Invalid credentials. Please try again.');
            }
        } catch (err) {
            setError('Connection error. Please check your internet.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#050505] flex items-center justify-center p-4 overflow-hidden">
            {/* Background Animations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-[440px]"
            >
                {/* Logo Area */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-xl shadow-primary/20 mb-6"
                    >
                        <span className="text-white font-black text-2xl uppercase">SC</span>
                    </motion.div>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">ADMIN PORTAL</h1>
                    <p className="text-gray-500 font-medium">Enter your credentials to manage Switch Code</p>
                </div>

                <div className="glass p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative">
                    {/* Decorative line */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"></div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center mb-6 text-sm font-medium"
                        >
                            <FiAlertCircle className="mr-3 text-lg flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FiMail className="text-gray-500 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all outline-none"
                                    placeholder="admin@switchcode.tech"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Secure Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FiLock className="text-gray-500 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all outline-none"
                                    placeholder="••••••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full bg-white text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-xl"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Sign In To Dashboard</span>
                                    <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-sm text-gray-600">
                    Switch Code Platform Administration v1.0
                </p>
            </motion.div>
        </div>
    );
}
