'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiUser, FiArrowRight, FiShield, FiImage, FiPhone } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Login Phase
    const [identifier, setIdentifier] = useState(''); // Email, Phone or Username
    const [password, setPassword] = useState('');

    // Setup Phase (First Time)
    const [mustSetup, setMustSetup] = useState(false);
    const [setupData, setSetupData] = useState({
        newPassword: '', phone: '', avatarUrl: ''
    });

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            console.log('[Frontend Login] Initiating auth request for identifier:', identifier);
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password: password.trim() })
            });
            const data = await res.json();
            if (res.ok) {
                console.log('[Frontend Login] Login successful. Saving token and user metadata.');
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                if (data.mustChangePassword) {
                    console.log('[Frontend Login] Change password flag detected. Switching to Complete Profile onboarding UI.');
                    setMustSetup(true);
                } else {
                    const adminRoles = ['admin', 'super_admin', 'president', 'vice_president'];
                    if (adminRoles.includes(data.user?.role)) {
                        router.push('/admin/community/accounts');
                    } else {
                        router.push('/dashboard');
                    }
                }
            } else {
                console.warn('[Frontend Login] Auth failed:', data.error);
                setError(data.error || 'Invalid Identity or Password');
            }
        } catch (err: any) {
            console.error('[Frontend Login] Network error:', err);
            setError(err.message || 'A network error occurred during login');
        } finally { setLoading(false); }
    }

    async function handleAccountSetup(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const token = localStorage.getItem('token');
            console.log('[Frontend Setup] Submitting profile setup payload...');
            const res = await fetch('/api/auth/complete-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(setupData)
            });
            const data = await res.json();
            if (res.ok) {
                console.log('[Frontend Setup] Setup completed successfully. Updating local session...');
                if (data.token) localStorage.setItem('token', data.token);
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

                const userRole = data.user?.role;
                const adminRoles = ['admin', 'super_admin', 'president', 'vice_president'];

                if (adminRoles.includes(userRole)) {
                    router.replace('/admin/community/accounts');
                } else {
                    router.replace('/dashboard');
                }
            } else {
                console.error('[Frontend Setup] Setup rejected by backend:', data.error);
                setError(data.error || 'Failed to complete setup');
            }
        } catch (err: any) {
            console.error('[Frontend Setup] Runtime exception during setup:', err);
            setError(err.message || 'A network error occurred during account setup');
        } finally { setLoading(false); }
    }

    return (
        <div className="min-h-screen bg-dark flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <h2 className="mt-6 text-center text-4xl font-extrabold text-white">
                    {mustSetup ? 'Complete Your Profile' : 'Access Your Portal'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    {mustSetup ? 'Welcome! Let\'s secure your account and add some final details.' : 'Authenticate to sync with your dashboard.'}
                </p>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="glass py-8 px-4 sm:px-10 rounded-3xl border border-white/5 shadow-2xl">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm text-center font-bold mb-5">
                            {error}
                        </div>
                    )}

                    {!mustSetup ? (
                        <form className="space-y-5" onSubmit={handleLogin}>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300">Target Identity (Username / Email / Phone)</label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><FiUser className="h-5 w-5" /></div>
                                    <input type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-dark-light text-white outline-none focus:border-accent" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300">Access Key (Password)</label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><FiLock className="h-5 w-5" /></div>
                                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-dark-light text-white outline-none focus:border-accent" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-bold text-black bg-accent hover:bg-accent-dark disabled:opacity-50 transition-transform hover:scale-[1.02]">
                                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black" /> : <>Initiate Login <FiArrowRight className="ml-2" /></>}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form className="space-y-4" onSubmit={handleAccountSetup}>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300">1. Master Password (Mandatory)</label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-accent"><FiShield className="h-5 w-5" /></div>
                                    <input type="password" required minLength={6} placeholder="Replace temporary password" value={setupData.newPassword} onChange={(e) => setSetupData({ ...setupData, newPassword: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-3 border border-accent/30 rounded-xl bg-accent/5 text-white outline-none focus:border-accent" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300">2. Contact Telephone (Optional)</label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><FiPhone className="h-5 w-5" /></div>
                                    <input type="tel" placeholder="WhatsApp / Mobile" value={setupData.phone} onChange={(e) => setSetupData({ ...setupData, phone: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-dark-light text-white outline-none focus:border-accent" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300">3. Profile Avatar URL (Optional)</label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><FiImage className="h-5 w-5" /></div>
                                    <input type="url" placeholder="https://..." value={setupData.avatarUrl} onChange={(e) => setSetupData({ ...setupData, avatarUrl: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-dark-light text-white outline-none focus:border-accent" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-bold text-black bg-accent hover:bg-accent-dark shadow-[0_0_15px_rgba(0,255,136,0.3)]">
                                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black" /> : <>Finalize Integration</>}
                                </button>
                            </div>
                        </form>
                    )}

                    {!mustSetup && (
                        <div className="mt-8 text-center text-xs text-gray-500 border-t border-white/5 pt-6">
                            <p>Internal Community Portal</p>
                            <p>Self-registration is disabled. Request credentials from your supervisor.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
