'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

const NO_NAVBAR_PATHS = ['/login'];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const showNavbar = !NO_NAVBAR_PATHS.includes(pathname);

    if (!showNavbar) {
        // Login page — full screen, no navbar, no padding
        return <>{children}</>;
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 pb-12">
                <div className="max-w-7xl mx-auto page-enter">
                    {children}
                </div>
            </main>
        </>
    );
}
