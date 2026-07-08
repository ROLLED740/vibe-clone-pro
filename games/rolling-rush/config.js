// Deployment configuration. Safe to commit: the Supabase anon key is a
// public client key (row-level security protects the data), and payment
// links are public URLs. NEVER put the service-role key or any Stripe
// secret key in this file — those belong only in Supabase function secrets.

// From Supabase dashboard → Project Settings → API.
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

// Stripe Payment Links (Stripe dashboard → Payment Links), one per pack.
// Leave empty until the stripe-webhook edge function is deployed.
export const STRIPE_PAYMENT_LINKS = {
  'pack-s': '',
  'pack-m': '',
  'pack-l': '',
};

export const CLOUD_ENABLED = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
