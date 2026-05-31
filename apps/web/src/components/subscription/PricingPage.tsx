"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@oruclass/utils";
import { plans, formatPrice, type PlanId } from "@/config/plans";

export function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("quarterly");
  const router = useRouter();

  function handleGetStarted(planId: PlanId) {
    router.push(`/subscription/checkout?plan=${planId}`);
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-600 text-[12px] font-600 px-3.5 py-1.5 rounded-full mb-4">
          <Sparkles size={13} />
          Launch Offer — Limited Time Pricing
        </div>
        <h1 className="text-[28px] md:text-[36px] font-800 text-gray-900 tracking-[-0.02em] mb-3">
          Simple, transparent pricing
        </h1>
        <p className="text-[15px] text-gray-500 max-w-md mx-auto leading-relaxed">
          Choose the plan that fits your training needs. Upgrade, downgrade, or cancel anytime.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isPopular = plan.badge === "Most Popular";

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                "relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-200",
                isPopular
                  ? "border-brand-500 shadow-[0_0_0_1px_oklch(0.55_0.22_250),0_8px_30px_-4px_oklch(0.55_0.22_250_/_0.15)]"
                  : isSelected
                    ? "border-brand-300 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-700 px-3.5 py-1 rounded-full",
                    plan.badge === "Most Popular"
                      ? "bg-brand-500 text-white"
                      : "bg-amber-400 text-amber-900"
                  )}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      isPopular ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-500"
                    )}
                  >
                    <plan.icon size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-700 text-gray-900">{plan.name}</h3>
                    <p className="text-[11.5px] text-gray-400">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[13px] text-gray-400 font-500">₹</span>
                  <span className="text-[38px] font-800 text-gray-900 tracking-[-0.03em] leading-none">
                    {formatPrice(plan.perMonth)}
                  </span>
                  <span className="text-[13px] text-gray-400 font-500">/mo</span>
                </div>

                {/* Billing info */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[12.5px] text-gray-500">
                    {plan.period === "month"
                      ? "Billed monthly"
                      : plan.period === "quarter"
                        ? `₹${formatPrice(plan.price)} billed quarterly`
                        : `₹${formatPrice(plan.price)} billed yearly`}
                  </span>
                  {plan.savings && (
                    <span className="text-[11px] font-600 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Save {plan.savings}%
                    </span>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGetStarted(plan.id);
                }}
                className={cn(
                  "w-full py-2.5 rounded-xl text-[13.5px] font-600 transition-all duration-200 flex items-center justify-center gap-2 mb-5",
                  isPopular
                    ? "bg-brand-500 text-white hover:bg-brand-600 shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Get Started
                <ArrowRight size={14} />
              </button>

              {/* Features */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-600 text-gray-400 uppercase tracking-[0.06em]">
                  What&apos;s included
                </p>
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={10} className="text-brand-500" strokeWidth={3} />
                    </div>
                    <span className="text-[13px] text-gray-600 leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Signals */}
      <div className="mt-10 text-center">
        <div className="inline-flex items-center gap-6 text-[12.5px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <Check size={13} className="text-emerald-500" strokeWidth={2.5} />
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={13} className="text-emerald-500" strokeWidth={2.5} />
            Cancel anytime
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={13} className="text-emerald-500" strokeWidth={2.5} />
            7-day free trial
          </span>
        </div>
      </div>

      {/* FAQ-lite */}
      <div className="mt-12 bg-gray-50 rounded-2xl p-6 md:p-8">
        <h2 className="text-[18px] font-700 text-gray-900 mb-5">Common questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              q: "Can I switch plans later?",
              a: "Yes! Upgrade or downgrade anytime. We'll prorate the difference.",
            },
            {
              q: "Is there a free trial?",
              a: "Every plan comes with a 7-day free trial. No payment required to start.",
            },
            {
              q: "What payment methods do you accept?",
              a: "UPI, credit/debit cards, net banking, and all major wallets.",
            },
            {
              q: "Can I get a refund?",
              a: "Yes, we offer a full refund within 14 days of purchase. No questions asked.",
            },
          ].map((item) => (
            <div key={item.q}>
              <h4 className="text-[13.5px] font-600 text-gray-800 mb-1">{item.q}</h4>
              <p className="text-[13px] text-gray-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
