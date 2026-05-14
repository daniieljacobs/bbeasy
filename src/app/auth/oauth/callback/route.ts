import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(`${origin}/auth/login?error=oauth_no_code`);
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
        return NextResponse.redirect(`${origin}/auth/login?error=oauth_exchange_failed`);
    }

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
        return NextResponse.redirect(`${origin}/auth/login?error=oauth_no_user`);
    }

    // Decide where to send them.
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, role, has_onboarded')
        .eq('id', user.id)
        .single();

    // Missing identity → complete profile.
    if (!profile?.full_name || !profile?.username) {
        return NextResponse.redirect(`${origin}/auth/complete-profile`);
    }

    // Profile complete but never went through the welcome flow → onboarding.
    if (!profile.has_onboarded) {
        const firstName = profile.full_name.split(' ')[0] || '';
        return NextResponse.redirect(`${origin}/auth/onboarding?name=${encodeURIComponent(firstName)}`);
    }

    // Existing user → straight to dashboard.
    const firstName = profile.full_name.split(' ')[0] || '';
    const target = profile.role === 'admin' ? '/admin/dashboard' : '/portal/dashboard';
    return NextResponse.redirect(`${origin}${target}?welcome=${encodeURIComponent(firstName)}`);
}