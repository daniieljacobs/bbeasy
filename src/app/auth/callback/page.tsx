"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function CallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const code = searchParams.get('code');
        const next = searchParams.get('next') ?? '/portal/dashboard';

        if (!code) {
            router.replace('/auth/login?error=oauth_no_code');
            return;
        }

        supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
            if (error) {
                router.replace('/auth/login?error=oauth_exchange_failed');
                return;
            }
            router.replace(next);
        });
    }, [router, searchParams]);

    return (
        <div className="fixed inset-0 flex items-center justify-center font-mono">
            <Loader2 className="animate-spin text-slate-300" size={20} />
        </div>
    );
}

export default function CallbackPage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 flex items-center justify-center font-mono">
                <Loader2 className="animate-spin text-slate-300" size={20} />
            </div>
        }>
            <CallbackHandler />
        </Suspense>
    );
}
