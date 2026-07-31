"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { startCheckout } from "../actions/stripe";
import {
  PLANS,
  FAQ,
  INCLUDED_IN_ALL_PLANS,
  YEARLY_SAVINGS_PERCENT,
  type BillingInterval,
  type Plan,
  type PlanFeature,
} from "@/lib/plans";

interface PricingTableProps {
  isSignedIn: boolean;
  /** Plan the signed-in user is already on, if any. */
  currentPlanId?: string | null;
}

export default function PricingTable({ isSignedIn, currentPlanId }: PricingTableProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleCheckout = (plan: Plan) => {
    setError(null);
    setPendingPlan(plan.id);
    startTransition(async () => {
      try {
        const res = await startCheckout(plan.id, interval);
        if (res?.url) {
          window.location.href = res.url;
          return;
        }
        setError("Checkout did not return a URL. Please try again.");
      } catch (err) {
        console.error("Checkout failed:", err);
        setError(err instanceof Error ? err.message : "Could not start checkout. Please try again.");
      } finally {
        setPendingPlan(null);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:pt-20">
        {/* ---------- Hero ---------- */}
        <header className="text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Turn one idea into a month of scroll-stopping video.
          </h1>

          {/* Billing toggle */}
          <div
            role="radiogroup"
            aria-label="Billing interval"
            className="mt-8 inline-flex items-center rounded-xl bg-[#1C1C1F] p-1"
          >
            {(["monthly", "yearly"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={interval === value}
                onClick={() => setInterval(value)}
                className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-base font-semibold capitalize transition-all ${
                  interval === value ? "bg-[#33333A] text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {value}
                {value === "yearly" && (
                  <span className="text-sm font-medium text-zinc-400">
                    Save {YEARLY_SAVINGS_PERCENT}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mx-auto mt-10 max-w-lg rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-center text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {/* ---------- Plan cards ---------- */}
        <div className="mt-12 grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              interval={interval}
              isSignedIn={isSignedIn}
              isCurrent={currentPlanId === plan.id}
              isPending={pendingPlan === plan.id}
              disabled={pendingPlan !== null}
              onCheckout={() => handleCheckout(plan)}
            />
          ))}
        </div>

        {/* ---------- Social proof ----------
            Intentionally unpopulated: fill CUSTOMER_LOGOS with logos you have
            permission to display. Real brands must not be listed as customers
            unless they actually are. */}
        <SocialProof />

        {/* ---------- Included in all plans ---------- */}
        <section className="mt-24">
          <div className="text-center">
            <div className="text-4xl" aria-hidden="true">
              ⭐
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Included in all plans:
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUDED_IN_ALL_PLANS.map((item) => (
              <article
                key={item.title}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#141416] p-4"
              >
                {item.ribbon && (
                  <span className="absolute -right-10 top-5 z-10 w-40 rotate-45 bg-[#FFE812] py-1 text-center text-[11px] font-black uppercase tracking-wider text-black">
                    {item.ribbon}
                  </span>
                )}

                <div className="aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-[#1E1E22] to-[#0F0F11]">
                  {item.media ? (
                    <video
                      className="h-full w-full object-cover"
                      src={item.media}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl opacity-30">
                      ✦
                    </div>
                  )}
                </div>

                <span className="mt-4 inline-block rounded-full bg-[#B9F8CF] px-3 py-1 text-xs font-semibold text-[#0B3D22]">
                  {item.tag}
                </span>
                <h3 className="mt-3 text-lg font-bold">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="mt-24">
          <h2 className="text-center text-3xl font-black tracking-tight sm:text-4xl">
            Questions, answered
          </h2>
          <div className="mx-auto mt-10 max-w-3xl divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-[#141416]">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-white">
                  {item.q}
                  <span className="shrink-0 text-[#06b6d4] transition-transform group-open:rotate-45">
                    <PlusIcon />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="mt-20 flex flex-col items-center gap-4 border-t border-white/5 pt-10 text-[11px] uppercase tracking-[0.15em] text-zinc-600 md:flex-row md:justify-center md:gap-6">
          <Link href="/privacy" className="transition-colors hover:text-[#06b6d4]">
            Privacy Policy
          </Link>
          <span className="hidden text-white/10 md:inline">•</span>
          <Link href="/terms" className="transition-colors hover:text-[#06b6d4]">
            Terms of Service
          </Link>
          <span className="hidden text-white/10 md:inline">•</span>
          <span>© {new Date().getFullYear()} VibeClonePro</span>
        </footer>
      </div>
    </div>
  );
}

/**
 * Customer logo strip. Add entries only for brands that are genuinely
 * customers and whose marks you're permitted to use — the section hides itself
 * while the list is empty.
 */
const CUSTOMER_LOGOS: { name: string; src: string }[] = [];

function SocialProof() {
  if (CUSTOMER_LOGOS.length === 0) return null;

  return (
    <section className="mt-20 text-center">
      <h2 className="text-xl font-bold">Teams already using VibeClonePro</h2>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-70">
        {CUSTOMER_LOGOS.map((logo) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={logo.name} src={logo.src} alt={logo.name} className="h-7 w-auto" />
        ))}
      </div>
    </section>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

interface PlanCardProps {
  plan: Plan;
  interval: BillingInterval;
  isSignedIn: boolean;
  isCurrent: boolean;
  isPending: boolean;
  disabled: boolean;
  onCheckout: () => void;
}

function PlanCard({ plan, interval, isSignedIn, isCurrent, isPending, disabled, onCheckout }: PlanCardProps) {
  const price = plan.price[interval];
  const note = plan.priceNote?.[interval];
  const featured = plan.accent === "featured";

  return (
    <div className={featured ? "overflow-hidden rounded-2xl" : ""}>
      {plan.ribbon && (
        <div className="bg-[#FFE812] py-2.5 text-center text-sm font-black uppercase tracking-wide text-black">
          {plan.ribbon}
        </div>
      )}

      <div
        className={`flex h-full flex-col p-7 ${
          featured
            ? "bg-[#2A2FE0] text-white"
            : "rounded-2xl border border-white/10 bg-[#141416]"
        } ${plan.ribbon ? "" : "rounded-2xl"}`}
      >
        <h2 className={`text-lg font-medium ${featured ? "text-white" : "text-zinc-200"}`}>
          {plan.name}
        </h2>

        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-6xl font-black tracking-tight">${price}</span>
          {price !== 0 && (
            <span className={`text-lg ${featured ? "text-white/80" : "text-zinc-400"}`}>/mo</span>
          )}
        </div>

        <p className={`mt-2 text-base ${featured ? "text-white/90" : "text-zinc-400"}`}>
          {plan.tagline}
        </p>
        <p className={`mt-1 h-4 text-xs ${featured ? "text-white/60" : "text-zinc-500"}`}>
          {interval === "yearly" ? note ?? "" : ""}
        </p>

        <div className="mt-5">
          <PlanButton
            plan={plan}
            isSignedIn={isSignedIn}
            isCurrent={isCurrent}
            isPending={isPending}
            disabled={disabled}
            onCheckout={onCheckout}
          />
        </div>

        {plan.featuresHeading && (
          <p className="mt-7 font-bold">{plan.featuresHeading}</p>
        )}

        <ul className={`mt-6 space-y-3.5 text-[15px] ${plan.featuresHeading ? "mt-3" : ""}`}>
          {plan.features.map((feature) => (
            <FeatureRow key={feature.label} feature={feature} featured={featured} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function FeatureRow({ feature, featured }: { feature: PlanFeature; featured: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <Check size={18} className={`mt-0.5 shrink-0 ${featured ? "text-white" : "text-zinc-300"}`} />
      <span className={featured ? "text-white" : "text-zinc-200"}>
        {feature.wasLabel && (
          <span className={`mr-1.5 line-through ${featured ? "text-white/60" : "text-zinc-500"}`}>
            {feature.wasLabel}
          </span>
        )}
        <span
          className={[
            feature.emphasis ? "font-bold" : "",
            feature.tooltip ? "cursor-help underline decoration-dotted underline-offset-4" : "",
          ].join(" ")}
          title={feature.tooltip}
        >
          {feature.label}
        </span>
        {feature.badge && (
          <span className="ml-2 inline-block whitespace-nowrap rounded bg-[#FFE812] px-2 py-0.5 text-[11px] font-black text-black">
            {feature.badge}
          </span>
        )}
      </span>
    </li>
  );
}

function PlanButton({
  plan,
  isSignedIn,
  isCurrent,
  isPending,
  disabled,
  onCheckout,
}: Omit<PlanCardProps, "interval">) {
  const base =
    "block w-full rounded-lg py-3.5 text-center text-base font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60";
  // The featured card sits on blue, so its CTA switches to green for contrast.
  const style =
    plan.accent === "featured"
      ? "bg-[#22C55E] text-white hover:bg-[#1FB355]"
      : "bg-[#06A8C4] text-white hover:bg-[#0895AE]";

  if (isCurrent) {
    return (
      <button type="button" disabled className={`${base} border border-white/30 bg-transparent`}>
        Current plan
      </button>
    );
  }

  if (plan.cta.kind === "contact") {
    return (
      <a href={plan.cta.href} className={`${base} ${style}`}>
        {plan.ctaLabel}
      </a>
    );
  }

  if (plan.cta.kind === "signup") {
    return (
      <Link href={isSignedIn ? "/studio" : "/sign-up"} className={`${base} ${style}`}>
        {isSignedIn ? "Open Studio" : plan.ctaLabel}
      </Link>
    );
  }

  // Signed-out visitors go through auth first; checkout needs a user to attach to.
  if (!isSignedIn) {
    return (
      <Link href="/sign-in?redirect_url=/pricing" className={`${base} ${style}`}>
        {plan.ctaLabel}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onCheckout} disabled={disabled} className={`${base} ${style}`}>
      {isPending ? "Redirecting…" : plan.ctaLabel}
    </button>
  );
}
