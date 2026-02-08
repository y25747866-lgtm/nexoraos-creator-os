import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers (Whop sends from different origin)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-whop-signature');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Get raw body for signature verification
  const body = await getRawBody(req);
  const signature = req.headers['x-whop-signature'] as string;
  if (!signature) {
    return res.status(401).json({ error: 'Missing x-whop-signature header' });
  }
  // Verify HMAC signature
  const expectedSignature = createHmac('sha256', WHOP_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  let payload;
  try {
    payload = JSON.parse(body.toString());
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  const event = payload.event;
  const data = payload.data;
  // Handle relevant Whop events
  if (event === 'payment.succeeded' || event === 'subscription.created' || event === 'subscription.updated') {
    const userEmail = data.customer_email || data.user_email;
    const planId = data.plan_id;
    const whopUserId = data.user_id;
    if (!userEmail) {
      return res.status(400).json({ error: 'Missing email in payload' });
    }
    // Save to the 'subscriptions' table
    const { error } = await supabase.from('subscriptions').upsert(
      {
        plan: planId,
        status: 'active',
        whop_user_id: whopUserId,
        user_id: null, // set later if you have Supabase auth user ID
        created_at: new Date().toISOString(),
        expires_at: null, // or calculate from plan duration
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'whop_user_id' } // upsert on whop_user_id to avoid duplicates
    );
    if (error) {
      console.error('Supabase upsert error:', error);
      return res.status(500).json({ error: 'Failed to save subscription' });
    }
    return res.status(200).json({ success: true, message: 'Subscription recorded' });
  }
  // Ignore other events
  return res.status(200).json({ success: true, message: 'Event ignored' });
}
// Helper to get raw body (required for signature verification)
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
  }
