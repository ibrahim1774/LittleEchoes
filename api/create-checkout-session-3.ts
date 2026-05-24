import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

type PlanKey = 'basic_monthly' | 'pro_monthly' | 'pro_yearly';

const PLANS: Record<PlanKey, {
  unit_amount: number;
  nickname: string;
  interval: 'month' | 'year';
  tier: 'basic' | 'pro';
  trial_days: number;
}> = {
  basic_monthly: {
    unit_amount: 500, // $5.00
    nickname: 'LittleEchoes Basic (Audio only)',
    interval: 'month',
    tier: 'basic',
    trial_days: 0,
  },
  pro_monthly: {
    unit_amount: 1000, // $10.00
    nickname: 'LittleEchoes Pro Monthly',
    interval: 'month',
    tier: 'pro',
    trial_days: 1,
  },
  pro_yearly: {
    unit_amount: 6000, // $60.00
    nickname: 'LittleEchoes Pro Yearly',
    interval: 'year',
    tier: 'pro',
    trial_days: 1,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plan } = req.body as { plan: PlanKey };
  if (!plan || !PLANS[plan]) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  const origin = req.headers.origin ?? 'https://littleechoes.vercel.app';
  const config = PLANS[plan];
  const value = (config.unit_amount / 100).toFixed(2);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: config.nickname },
            recurring: { interval: config.interval },
            unit_amount: config.unit_amount,
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        ...(config.trial_days > 0 ? { trial_period_days: config.trial_days } : {}),
        metadata: { tier: config.tier, plan },
      },
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&tier=${config.tier}&value=${value}`,
      cancel_url: `${origin}/onboarding-3`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
