'use client';
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, Lock } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CheckoutForm = ({ price, onSuccess }: { price: number, onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/dashboard',
      },
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* FIXED: Removed the invalid 'options' prop. Theme is inherited from parent. */}
      <PaymentElement />
      
      {error && <div className="text-red-500 text-xs">{error}</div>}
      <button 
        disabled={!stripe || loading}
        className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
      >
        {loading ? 'Processing...' : `Pay $${price}`} <Lock size={14} />
      </button>
    </form>
  );
};

export default function CheckoutModal({ isOpen, onClose, price }: { isOpen: boolean, onClose: () => void, price: number }) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/stripe/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: price * 100 }), 
      })
      .then(res => res.json())
      .then(data => setClientSecret(data.clientSecret));
    }
  }, [isOpen, price]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A0F14] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#05080a]">
          <h3 className="text-white font-medium flex items-center gap-2"><Lock size={14} className="text-cyan-500"/> Secure Checkout</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20}/></button>
        </div>
        <div className="p-6">
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
              <CheckoutForm price={price} onSuccess={onClose} />
            </Elements>
          ) : (
            <div className="flex justify-center py-8"><span className="animate-spin text-cyan-500">⟳</span></div>
          )}
        </div>
        <div className="bg-black/50 p-3 text-center border-t border-gray-800">
          <p className="text-[10px] text-gray-500 flex items-center justify-center gap-2">
            Powered by Stripe • 256-bit SSL Encryption
          </p>
        </div>
      </div>
    </div>
  );
}
