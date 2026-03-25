import type { VercelRequest, VercelResponse } from '@vercel/node';

const PIXEL_ID = '26490568997297314';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { value, currency, eventId, eventSourceUrl } = req.body as {
    value: number;
    currency: string;
    eventId: string;
    eventSourceUrl: string;
  };

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: eventSourceUrl,
        action_source: 'website',
        custom_data: { value, currency },
      },
    ],
  };

  const fbRes = await fetch(
    `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${process.env.FB_ACCESS_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  const data = await fbRes.json();
  return res.status(fbRes.ok ? 200 : 500).json(data);
}
