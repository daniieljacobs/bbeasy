import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { priceId, plan, userId } = await req.json();

        if (!priceId || !plan || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get user email from Supabase
        const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();

        const isSubscription = plan === 'monthly';

        const session = await stripe.checkout.sessions.create({
            mode: isSubscription ? 'subscription' : 'payment',
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: profile?.email,
            metadata: { user_id: userId, plan },
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/membership/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/membership`,
            ...(isSubscription && {
                subscription_data: {
                    metadata: { user_id: userId },
                }
            }),
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('Checkout error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}