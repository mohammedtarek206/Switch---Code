'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

const SHELL_PREFIXES = ['/admin', '/dashboard', '/instructor', '/learn', '/profile'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPortal = SHELL_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

    return (
        <>
            {!isPortal && <Navbar />}
            <main className={!isPortal ? 'pt-20' : ''}>{children}</main>
            {!isPortal && <Footer />}
        </>
    );
}
