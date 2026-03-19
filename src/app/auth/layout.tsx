"use client";

import { usePathname } from 'next/navigation';

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
                <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-[2.5rem] border border-slate-100 shadow-xl p-10">
                    <div className="text-center mb-8">
                        <h1 className="font-black text-2xl tracking-tight">
                            BB<span className="text-brand">EASY</span>
                        </h1>
                    </div>
                    {children}
                </div>
            )}
        </div>
    );
}