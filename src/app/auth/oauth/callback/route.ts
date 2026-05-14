import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(`${origin}/auth/login?error=oauth_no_code`);
    }

    // PKCE verifier lives in browser localStorage — hand off to client page for exchange
    return NextResponse.redirect(
        `${origin}/auth/oauth/complete?code=${encodeURIComponent(code)}`
    );
}
