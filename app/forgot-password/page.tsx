'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiMail, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'حدث خطأ');
            } else {
                setSent(true);
            }
        } catch {
            setError('تعذر الاتصال بالخادم.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#07111F] flex items-center justify-center px-4">
            <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-blue-500/20">
                <h1 className="text-2xl font-extrabold text-white text-center mb-2">استعادة كلمة المرور</h1>
                <p className="text-xs text-slate-400 text-center mb-6">
                    أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
                </p>

                {sent ? (
                    <div className="text-center space-y-4">
                        <FiCheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                        <p className="text-sm text-slate-200">
                            إذا كان البريد الإلكتروني مسجلاً لدينا، ستصلك رسالة تحتوي على رابط إعادة التعيين.
                        </p>
                        <Link href="/login" className="btn-primary-blue px-6 py-2.5 text-sm inline-block">
                            العودة لتسجيل الدخول
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
                            <FiMail className="absolute left-3 top-3.5 text-gray-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary-blue py-3 text-sm flex items-center justify-center gap-2"
                        >
                            {loading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'} <FiArrowRight />
                        </button>
                        <div className="text-center">
                            <Link href="/login" className="text-xs text-slate-400 hover:text-white">
                                العودة لتسجيل الدخول
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
