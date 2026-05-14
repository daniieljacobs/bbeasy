"use client";

import { useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function OAuthCompleteInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const code = searchParams.get('code');

        (async () => {
            if (code) {
                // PKCE flow: only exchange if we don't already have a session
                // (guards against React Strict Mode double-firing this effect)
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) {
                        router.replace('/auth/login?error=oauth_exchange_failed');
                        return;
                    }
                }
            }
            // Implicit flow: Supabase JS picks up the hash fragment automatically on load.
            // Either way, session should be set by now.

            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) {
                router.replace('/auth/login?error=oauth_no_user');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, username, role, has_onboarded')
                .eq('id', user.id)
                .single();

            if (!profile?.full_name || !profile?.username) {
                router.replace('/auth/complete-profile');
                return;
            }

            if (!profile.has_onboarded) {
                const firstName = profile.full_name.split(' ')[0] || '';
                router.replace(`/auth/onboarding?name=${encodeURIComponent(firstName)}`);
                return;
            }

            const firstName = profile.full_name.split(' ')[0] || '';
            const target = profile.role === 'admin' ? '/admin/dashboard' : '/portal/dashboard';
            router.replace(`${target}?welcome=${encodeURIComponent(firstName)}`);
        })();
    }, [router, searchParams]);

    return (
        <div className="fixed inset-0 flex items-center justify-center font-mono">
            <Loader2 className="animate-spin text-slate-300" size={20} />
        </div>
    );
}

export default function OAuthCompletePage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 flex items-center justify-center font-mono">
                <Loader2 className="animate-spin text-slate-300" size={20} />
            </div>
        }>
            <OAuthCompleteInner />
        </Suspense>
    );
}
