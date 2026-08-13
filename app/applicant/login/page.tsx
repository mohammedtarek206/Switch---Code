'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect old /applicant/login to the new unified tracking page
export default function ApplicantLoginRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/join/track');
    }, [router]);

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center text-white text-lg font-bold">
            جاري التحويل...
        </div>
    );
}
