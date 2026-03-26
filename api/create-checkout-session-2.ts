import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

const PRICES = {
  monthly: {
    unit_amount: 499, // $4.99
    nickname: 'LittleEchoes Monthly (Promo)',
    interval: 'month' as const,
  },
  yearly: {
    unit_amount: 2999, // $29.99
    nickname: 'LittleEchoes Yearly (Promo)',
    interval: 'year' as const,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plan } = req.body as { plan: 'monthly' | 'yearly' };
  if (!plan || !PRICES[plan]) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  const origin = req.headers.origin ?? 'https://littleechoes.vercel.app';
  const price = PRICES[plan];
  const value = (price.unit_amount / 100).toFixed(2);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: price.nickname },
            recurring: { interval: price.interval },
            unit_amount: price.unit_amount,
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&value=${value}`,
      cancel_url: `${origin}/pricing-2`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
