import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body as { email?: string };
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const origin = req.headers.origin ?? 'https://littleechoes.vercel.app';

  try {
    // No webhook yet, so we don't store stripe_customer_id on profiles.
    // Look up the customer by the email they used at checkout.
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0];
    if (!customer) {
      return res.status(404).json({ error: 'No Stripe customer found for this email.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${origin}/settings`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
