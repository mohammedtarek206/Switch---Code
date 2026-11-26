'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedApplicantDashboardPage() {
    const router = useRouter();
    useEffect(() => {
        const token = localStorage.getItem('token');
        router.replace(token ? '/dashboard' : '/login');
    }, [router]);
    return <div className="min-h-screen bg-[#07111F]" />;
}
