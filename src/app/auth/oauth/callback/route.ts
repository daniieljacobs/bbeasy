import { createServerClient } from '@supabase/ssr';
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
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
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

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, role, has_onboarded')
        .eq('id', user.id)
        .single();

    if (!profile?.full_name || !profile?.username) {
        return NextResponse.redirect(`${origin}/auth/complete-profile`);
    }

    if (!profile.has_onboarded) {
        const firstName = profile.full_name.split(' ')[0] || '';
        return NextResponse.redirect(`${origin}/auth/onboarding?name=${encodeURIComponent(firstName)}`);
    }

    const firstName = profile.full_name.split(' ')[0] || '';
    const target = profile.role === 'admin' ? '/admin/dashboard' : '/portal/dashboard';
    return NextResponse.redirect(`${origin}${target}?welcome=${encodeURIComponent(firstName)}`);
}
