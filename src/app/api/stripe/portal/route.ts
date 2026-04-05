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
        const { userId } = await req.json();

        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .single();

        if (!subscription?.stripe_customer_id) {
            return NextResponse.json({ error: 'No customer found' }, { status: 404 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/membership`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('Portal error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}