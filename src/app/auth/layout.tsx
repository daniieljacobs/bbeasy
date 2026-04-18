"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Add login to this check so it breaks out of the small card
    const isFullscreen = pathname.includes('onboarding') || pathname.includes('login');

    return (
        <div className="h-screen overflow-hidden flex items-center justify-center px-4">
            {isFullscreen ? (
                <div className="w-full max-w-5xl flex justify-center">
                    {children}
                </div>
            ) : (
                <div className="w-full max-w-md  p-10">

                    {children}
                </div>
            )}
        </div>
    );
}