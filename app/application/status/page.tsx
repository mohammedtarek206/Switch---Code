'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DeprecatedApplicationStatusPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            router.replace('/dashboard');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-[#07111F] flex items-center justify-center px-4 text-center">
            <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-blue-500/20 space-y-4">
                <h1 className="text-xl font-extrabold text-white">أصبح التسجيل في Switch Code فورياً!</h1>
                <p className="text-sm text-slate-300 leading-relaxed">
                    تم إلغاء نظام انتظار الطلبات وكود المتابعة. يمكنك الآن إنشاء حسابك أو تسجيل الدخول مباشرة للوصول إلى لوحة التحكم الخاصة بك.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                    <Link href="/login" className="btn-primary-blue px-6 py-2.5 text-xs">
                        تسجيل الدخول
                    </Link>
                    <Link href="/register" className="btn-secondary-navy px-6 py-2.5 text-xs">
                        إنشاء حساب جديد
                    </Link>
                </div>
            </div>
        </div>
    );
}
