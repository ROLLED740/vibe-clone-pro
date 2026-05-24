"use client";

import { useState } from "react";
import { createCustomerPortalSession } from "../actions/stripe";
import { downgradeSubscription } from "../actions/stripe-downgrade";

export default function ManageBillingButton({ stripeCustomerId }: { stripeCustomerId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageBilling = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await createCustomerPortalSession(stripeCustomerId);
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await downgradeSubscription();
      if (res?.success) {
        alert('Subscription successfully downgraded!');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to downgrade subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4">
        <button 
          onClick={handleManageBilling} 
          disabled={loading}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Manage Billing'}
        </button>
        <button 
          onClick={handleDowngrade} 
          disabled={loading}
          className="px-4 py-2 bg-red-900/50 text-red-500 border border-red-500/50 rounded-lg text-sm font-medium hover:bg-red-900/80 transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Downgrade Subscription'}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
