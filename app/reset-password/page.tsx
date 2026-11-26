'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiLock, FiCheckCircle } from 'react-icons/fi';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, confirmPassword }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'فشل تحديث كلمة المرور.');
            } else {
                setDone(true);
            }
        } catch {
            setError('حدث خطأ في الاتصال.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#07111F] flex items-center justify-center px-4">
            <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-blue-500/20">
                <h1 className="text-2xl font-extrabold text-white text-center mb-6">تعيين كلمة مرور جديدة</h1>
                {done ? (
                    <div className="text-center space-y-4">
                        <FiCheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                        <p className="text-sm text-slate-200">تم تحديث كلمة المرور بنجاح!</p>
                        <Link href="/login" className="btn-primary-blue px-6 py-2.5 text-sm inline-block">
                            تسجيل الدخول
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
                                {error}
                            </div>
                        )}
                        <div className="relative">
                            <FiLock className="absolute left-3 top-3.5 text-gray-400" />
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)"
                                className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                            />
                        </div>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-3.5 text-gray-400" />
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="تأكيد كلمة المرور"
                                className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="w-full btn-primary-blue py-3 text-sm">
                            {loading ? 'جاري التحديث...' : 'حفظ كلمة المرور'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#07111F]" />}>
            <ResetPasswordForm />
        </Suspense>
    );
}
