'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('جاري التحقق من البريد الإلكتروني...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('رابط التحقق غير مكتمل.');
            return;
        }
        fetch('/api/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        })
            .then(async (res) => {
                const data = await res.json();
                if (res.ok) {
                    setStatus('success');
                    setMessage(data.message || 'تم تأكيد البريد الإلكتروني بنجاح!');
                } else {
                    setStatus('error');
                    setMessage(data.error || 'فشل التحقق من البريد الإلكتروني.');
                }
            })
            .catch(() => {
                setStatus('error');
                setMessage('حدث خطأ في الاتصال بالخادم.');
            });
    }, [token]);

    return (
        <div className="min-h-screen bg-[#07111F] flex items-center justify-center px-4">
            <div className="max-w-md w-full glass-panel rounded-3xl p-8 text-center border border-blue-500/20">
                {status === 'loading' && <FiLoader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />}
                {status === 'success' && <FiCheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />}
                {status === 'error' && <FiAlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />}
                <h1 className="text-xl font-bold text-white mb-2">تأكيد البريد الإلكتروني</h1>
                <p className="text-sm text-slate-300 mb-6">{message}</p>
                <Link href="/login" className="btn-primary-blue px-6 py-3 text-sm inline-block">
                    الذهاب إلى تسجيل الدخول
                </Link>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#07111F]" />}>
            <VerifyEmailContent />
        </Suspense>
    );
}
