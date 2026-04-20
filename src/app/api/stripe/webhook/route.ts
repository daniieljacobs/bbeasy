import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Use service role to bypass RLS for webhook updates
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXAM_PASS_EXPIRY = new Date('2026-07-31T23:59:59Z');

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    try {
        switch (event.type) {

            // ── Monthly subscription created or renewed ──
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.user_id;
                if (!userId) break;

                const isSubscription = session.mode === 'subscription';
                const isPayment = session.mode === 'payment';

                if (isSubscription && session.subscription) {
                    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
                    const item = sub.items.data[0];
                    await supabase.from('subscriptions').upsert({
                        user_id: userId,
                        stripe_customer_id: session.customer as string,
                        stripe_subscription_id: sub.id,
                        plan: 'monthly',
                        status: 'active',
                        current_period_start: new Date(item.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(item.current_period_end * 1000).toISOString(),
                    }, { onConflict: 'stripe_subscription_id' });

                    await supabase.from('profiles').update({ role: 'pro' }).eq('id', userId);
                }

                if (isPayment) {
                    // Exam pass — one time payment
                    await supabase.from('subscriptions').insert({
                        user_id: userId,
                        stripe_customer_id: session.customer as string,
                        stripe_subscription_id: session.payment_intent as string,
                        plan: 'annual',
                        status: 'active',
                        current_period_start: new Date().toISOString(),
                        current_period_end: EXAM_PASS_EXPIRY.toISOString(),
                    });

                    await supabase.from('profiles').update({ role: 'pro' }).eq('id', userId);
                }
                break;
            }

            // ── Monthly subscription updated (e.g. renewal, payment failed) ──
            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription;
                const item = sub.items.data[0];
                await supabase.from('subscriptions')
                    .update({
                        status: sub.status === 'active' ? 'active' : sub.status,
                        current_period_start: new Date(item.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(item.current_period_end * 1000).toISOString(),
                    })
                    .eq('stripe_subscription_id', sub.id);
                break;
            }

            // ── Monthly subscription canceled ──
            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription;

                await supabase.from('subscriptions')
                    .update({ status: 'canceled' })
                    .eq('stripe_subscription_id', sub.id);

                // Find user and downgrade — they already had access until period end
                // Stripe only fires this after the period ends so it's safe to downgrade now
                const { data: subscription } = await supabase
                    .from('subscriptions')
                    .select('user_id')
                    .eq('stripe_subscription_id', sub.id)
                    .single();

                if (subscription) {
                    await supabase.from('profiles')
                        .update({ role: 'free' })
                        .eq('id', subscription.user_id);
                }
                break;
            }
        }
    } catch (err) {
        console.error('Webhook handler error:', err);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}