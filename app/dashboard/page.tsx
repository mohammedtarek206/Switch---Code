'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardRouteForRole } from '@/lib/roleRoutes';

export default function SmartDashboardRouterPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.replace('/login');
            return;
        }

        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const parsed = JSON.parse(userStr);
                const route = getDashboardRouteForRole(parsed.role, parsed.roles);
                if (route && route !== '/dashboard') {
                    router.replace(route);
                }
            } catch {}
        }

        fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.status === 401) {
                    router.replace('/login');
                    return null;
                }
                return res.json();
            })
            .then((fresh) => {
                if (!fresh || !fresh._id) return;
                localStorage.setItem('user', JSON.stringify(fresh));
                const target = getDashboardRouteForRole(fresh.role, fresh.roles);
                router.replace(target === '/dashboard' ? '/learn' : target);
            })
            .catch(() => {
                router.replace('/login');
            });
    }, [router]);

    return (
        <div className="min-h-screen bg-[#07111F] flex flex-col items-center justify-center gap-3 text-slate-300">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
            <p className="text-xs font-semibold">جاري توجيهك إلى لوحة التحكم الخاصة بك...</p>
        </div>
    );
}
