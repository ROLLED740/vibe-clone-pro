// Deployment configuration. Safe to commit: the Supabase anon key is a
// public client key (row-level security protects the data), and payment
// links are public URLs. NEVER put the service-role key or any Stripe
// secret key in this file — those belong only in Supabase function secrets.

// From Supabase dashboard → Project Settings → API.
export const SUPABASE_URL = 'https://dnugwyvptzjkzblaffrw.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudWd3eXZwdHpqa3pibGFmZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NTM4NzQsImV4cCI6MjA5OTEyOTg3NH0.GVU3j71JC5M3_vqPvJYAP-2JB43z2lPLjq3vRLIWjUM';

// Stripe Payment Links (Stripe dashboard → Payment Links), one per pack.
// Leave empty until the stripe-webhook edge function is deployed.
export const STRIPE_PAYMENT_LINKS = {
  'pack-s': '',
  'pack-m': '',
  'pack-l': '',
};

// Cloud features (accounts, leaderboard, payments) need real outbound network
// access. The claude.ai artifact preview runs under a CSP that blocks external
// requests, so the artifact build sets window.__RR_NO_CLOUD to keep those
// buttons hidden there — they light up only on a real host (GitHub Pages,
// itch.io, your own domain).
export const CLOUD_ENABLED = () =>
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
  && !(typeof window !== 'undefined' && window.__RR_NO_CLOUD);
