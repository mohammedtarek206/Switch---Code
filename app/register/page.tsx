'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiMail, FiUser, FiKey, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        code: ''
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                // Automatically save token and route to smart dashboard
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/dashboard');
            } else {
                setError(data.error || 'Failed to register account');
            }
        } catch {
            setError('A network error occurred.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-dark flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <h2 className="mt-6 text-center text-4xl font-extrabold text-white">
                    Join <span className="text-accent">Switch Code</span>
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Enter your official community access code to proceed.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
            >
                <div className="glass py-8 px-4 sm:px-10 rounded-3xl border border-white/5">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm text-center font-bold">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300">Target Role Code</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                    <FiKey className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="EX: WC-H8X9B2N"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-dark-light text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors uppercase font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300">Full Name</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                    <FiUser className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-dark-light text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300">Email address</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                    <FiMail className="h-5 w-5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="name@university.edu"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-dark-light text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300">Password</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                    <FiLock className="h-5 w-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    minLength={6}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-dark-light text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-black bg-accent hover:bg-accent-dark focus:outline-none disabled:opacity-50 transition-colors"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                                ) : (
                                    <>
                                        Complete Registration <FiArrowRight className="ml-2" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-[#2D2D2D] text-gray-500 font-bold rounded-xl glass border border-white/5">
                                    Already have an account?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Link href="/login" className="w-full flex justify-center py-3 px-4 border border-white/10 rounded-xl shadow-sm text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-colors">
                                Sign in to your account
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
