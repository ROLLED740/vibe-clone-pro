"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Minus, Sparkles, Lock, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import { startCheckout } from "../actions/stripe";
import {
  PLANS,
  ENTERPRISE_PLAN,
  COMPARISON,
  FAQ,
  YEARLY_SAVINGS_PERCENT,
  type BillingInterval,
  type Plan,
} from "@/lib/plans";

const COMPARISON_COLUMNS = ["starter", "pro", "studio", "lifetime"] as const;
type ComparisonColumn = (typeof COMPARISON_COLUMNS)[number];

const COLUMN_LABELS: Record<ComparisonColumn, string> = {
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
  lifetime: "Lifetime",
};

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
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Ambient glow behind the hero */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-24 sm:pt-28">
        {/* ---------- Hero ---------- */}
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
            <Sparkles size={12} /> Pricing
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Ship the app you can already picture
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
            Start free, upgrade when your builds start shipping. Every paid plan includes the full
            Next.js export and commercial rights — cancel any time.
          </p>

          {/* Billing toggle */}
          <div className="mt-10 flex flex-col items-center gap-3">
            <div
              role="radiogroup"
              aria-label="Billing interval"
              className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1"
            >
              {(["monthly", "yearly"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={interval === value}
                  onClick={() => setInterval(value)}
                  className={`rounded-full px-6 py-2 text-sm font-semibold capitalize transition-all ${
                    interval === value
                      ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500">
              {interval === "yearly" ? (
                <span className="text-cyan-400">
                  Two months free — you&apos;re saving {YEARLY_SAVINGS_PERCENT}%
                </span>
              ) : (
                <>Switch to yearly and save {YEARLY_SAVINGS_PERCENT}%</>
              )}
            </p>
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
        <div className="mt-14 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-4">
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

        {/* ---------- Enterprise strip ---------- */}
        <section className="mt-6 flex flex-col items-start justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-white">{ENTERPRISE_PLAN.name}</h2>
            <p className="mt-1 text-sm text-zinc-400">{ENTERPRISE_PLAN.tagline}</p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
              {ENTERPRISE_PLAN.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check size={14} className="shrink-0 text-cyan-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <a
            href={ENTERPRISE_PLAN.cta.kind === "contact" ? ENTERPRISE_PLAN.cta.href : "#"}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {ENTERPRISE_PLAN.ctaLabel} <ArrowRight size={14} />
          </a>
        </section>

        {/* ---------- Trust bar ---------- */}
        <ul className="mt-12 grid grid-cols-1 gap-4 text-sm text-zinc-400 sm:grid-cols-3">
          {[
            { icon: Lock, text: "Payments handled by Stripe — we never see your card." },
            { icon: RefreshCw, text: "Cancel any time, keep access through the paid period." },
            { icon: ShieldCheck, text: "Your generated code is yours on every paid plan." },
          ].map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4"
            >
              <Icon size={16} className="mt-0.5 shrink-0 text-cyan-500" />
              {text}
            </li>
          ))}
        </ul>

        {/* ---------- Comparison table ---------- */}
        <section className="mt-24">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Compare every plan</h2>
          <p className="mt-3 text-center text-sm text-zinc-500">
            Everything each tier includes, side by side.
          </p>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th scope="col" className="w-2/5 px-6 py-4 font-medium text-zinc-400">
                    Feature
                  </th>
                  {COMPARISON_COLUMNS.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className={`px-6 py-4 text-center font-semibold ${
                        column === "pro" ? "text-cyan-400" : "text-white"
                      }`}
                    >
                      {COLUMN_LABELS[column]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((group) => (
                  <React.Fragment key={group.section}>
                    <tr>
                      <th
                        scope="colgroup"
                        colSpan={COMPARISON_COLUMNS.length + 1}
                        className="border-t border-white/10 bg-white/[0.015] px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
                      >
                        {group.section}
                      </th>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.label} className="border-t border-white/5">
                        <th scope="row" className="px-6 py-4 font-normal text-zinc-300">
                          {row.label}
                        </th>
                        {COMPARISON_COLUMNS.map((column) => (
                          <td key={column} className="px-6 py-4 text-center text-zinc-300">
                            <ComparisonCell value={row.values[column]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="mt-24">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Questions, answered</h2>
          <div className="mx-auto mt-10 max-w-3xl divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.02]">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-white">
                  {item.q}
                  <span className="shrink-0 text-cyan-500 transition-transform group-open:rotate-45">
                    <PlusIcon />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------- Final CTA ---------- */}
        <section className="mt-24 rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/[0.07] to-transparent px-6 py-14 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Still deciding?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400">
            Starter is free forever. Run a few builds on your own prompts, then pick a plan when it
            earns it.
          </p>
          <Link
            href={isSignedIn ? "/editor" : "/sign-up"}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-cyan-400"
          >
            {isSignedIn ? "Open the editor" : "Start building free"} <ArrowRight size={16} />
          </Link>
        </section>

        <footer className="mt-20 flex flex-col items-center gap-4 border-t border-white/5 pt-10 text-[11px] uppercase tracking-[0.15em] text-zinc-600 md:flex-row md:justify-center md:gap-6">
          <Link href="/privacy" className="transition-colors hover:text-cyan-400">
            Privacy Policy
          </Link>
          <span className="hidden text-white/10 md:inline">•</span>
          <Link href="/terms" className="transition-colors hover:text-cyan-400">
            Terms of Service
          </Link>
          <span className="hidden text-white/10 md:inline">•</span>
          <span>© {new Date().getFullYear()} VibeClonePro</span>
        </footer>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ComparisonCell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <>
        <Check size={16} className="mx-auto text-cyan-500" aria-hidden="true" />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus size={16} className="mx-auto text-zinc-700" aria-hidden="true" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <>{value}</>;
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
  // Lifetime is a single price regardless of the toggle, so it shows no suffix.
  const suffix = plan.oneTime ? null : price === 0 ? "/forever" : "/month";

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${
        plan.highlight
          ? "border-2 border-cyan-500 bg-[#0A0F14] shadow-[0_0_40px_rgba(6,182,212,0.15)] lg:-my-2"
          : "border border-white/10 bg-white/[0.02] hover:border-cyan-500/30"
      }`}
    >
      {plan.badge && (
        <span
          className={`absolute -top-3 left-8 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${
            plan.highlight ? "bg-cyan-400 text-black" : "border border-cyan-500/40 bg-[#0A0F14] text-cyan-400"
          }`}
        >
          {plan.badge}
        </span>
      )}

      <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
      <p className="mt-1 min-h-[40px] text-sm text-zinc-500">{plan.tagline}</p>

      <div className="mt-6">
        <span className="text-4xl font-bold text-white">${price}</span>
        {suffix && <span className="ml-1 text-sm text-zinc-500">{suffix}</span>}
        <p className="mt-1 h-4 text-[11px] uppercase tracking-wider text-zinc-500">{note ?? ""}</p>
      </div>

      <div className="mt-6">
        <PlanButton
          plan={plan}
          isSignedIn={isSignedIn}
          isCurrent={isCurrent}
          isPending={isPending}
          disabled={disabled}
          onCheckout={onCheckout}
        />
      </div>

      <p className="mt-8 text-sm font-medium text-white">{plan.meter}</p>
      <ul className="mt-4 space-y-3 text-sm text-zinc-400">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <Check size={16} className="mt-0.5 shrink-0 text-cyan-500" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
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
    "w-full rounded-lg py-3 text-center text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50";
  const primary = "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]";
  const secondary = "border border-white/20 text-white hover:bg-white/10";

  if (isCurrent) {
    return (
      <button type="button" disabled className={`${base} border border-cyan-500/40 text-cyan-400`}>
        Current plan
      </button>
    );
  }

  if (plan.cta.kind === "contact") {
    return (
      <a href={plan.cta.href} className={`${base} ${secondary} block`}>
        {plan.ctaLabel}
      </a>
    );
  }

  if (plan.cta.kind === "signup") {
    return (
      <Link href={isSignedIn ? "/editor" : "/sign-up"} className={`${base} ${secondary} block`}>
        {isSignedIn ? "Go to editor" : plan.ctaLabel}
      </Link>
    );
  }

  // Signed-out visitors go through auth first; checkout needs a user to attach to.
  if (!isSignedIn) {
    return (
      <Link
        href={`/sign-in?redirect_url=/pricing`}
        className={`${base} ${plan.highlight ? primary : secondary} block`}
      >
        {plan.ctaLabel}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onCheckout}
      disabled={disabled}
      className={`${base} ${plan.highlight ? primary : secondary}`}
    >
      {isPending ? "Redirecting…" : plan.ctaLabel}
    </button>
  );
}
