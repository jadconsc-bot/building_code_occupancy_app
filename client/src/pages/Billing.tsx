/**
 * Billing & Subscription
 * BuildingConnected-inspired: dark navy hero, clean white cards, bold typography.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Loader2, Zap, Building2, CreditCard, Shield, FileText } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { FoundingMemberBanner } from "@/components/FoundingMemberBanner";

const ROLE_LABEL: Record<string, string> = {
  free:         "Free",
  home_user:    "Home User",
  basic:        "Basic",
  professional: "Professional",
  org_admin:    "Team",
  rule_editor:  "Rule Editor",
  admin:        "Admin",
};

export default function Billing() {
  const [, setLocation] = useLocation();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [teamWaitlistSubmitted, setTeamWaitlistSubmitted] = useState(false);

  const { data: me } = trpc.auth.me.useQuery();
  const { data: counter } = trpc.subscriptions.getFoundingCounter.useQuery();

  const checkoutMutation = trpc.subscriptions.createCheckoutSession.useMutation({
    onError: (err) => {
      toast.error(err.message ?? "Failed to start checkout");
      setCheckingOut(null);
    },
  });
  const portalMutation = trpc.subscriptions.createPortalSession.useMutation({
    onSuccess: (data) => { window.location.href = data.url; },
    onError: (err) => toast.error(err.message ?? "Failed to open billing portal"),
  });
  const waitlistMutation = trpc.subscriptions.joinTeamWaitlist.useMutation({
    onSuccess: () => {
      toast.success("You're on the list! We'll notify you when Team launches.");
      setTeamWaitlistSubmitted(true);
      setWaitlistEmail("");
    },
    onError: (err) => toast.error(err.message ?? "Failed to join waitlist"),
  });

  const currentRole = me?.role ?? "free";
  const isPro = currentRole === "professional" || currentRole === "org_admin" || currentRole === "admin";
  const isFoundingMember = (me as any)?.isFoundingMember;
  const pct = counter ? Math.min((counter.claimed / counter.cap) * 100, 100) : 24.7;

  async function handleUpgrade(planType: "pro_monthly" | "pro_annual") {
    setCheckingOut(planType);
    try {
      const result = await checkoutMutation.mutateAsync({ planType });
      if (result.checkoutUrl) window.location.href = result.checkoutUrl;
    } catch {
      // handled by onError
    }
  }

  function handleTeamWaitlist() {
    if (!waitlistEmail.trim()) return;
    waitlistMutation.mutate({ email: waitlistEmail, source: "billing_page" });
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── SECTION 1: Dark navy hero ──────────────────────────────────────── */}
      <div className="bg-[#1B3A6B] text-white px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Plans & Pricing</h1>
              <p className="text-blue-200 mt-1 text-lg">
                Built for Canadian construction professionals.
              </p>
            </div>
            {me && (
              <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm">
                <span className="text-blue-200">Current plan: </span>
                <span className="font-bold text-white">{ROLE_LABEL[currentRole] ?? currentRole}</span>
                {isFoundingMember && (
                  <span className="ml-2 bg-amber-400 text-black text-xs font-bold px-2 py-0.5 rounded">
                    FOUNDING
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Founding member urgency bar */}
          {!isPro && (
            <div className="mt-6 bg-white/10 border border-white/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-300 font-semibold text-sm">
                  ⚡ Founding Member Rate — Lock in $49/mo forever
                </span>
                <span className="text-white text-sm font-bold">
                  {counter?.claimed ?? 247} / {counter?.cap ?? 1000}
                </span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-blue-200 text-xs mt-1.5">
                {counter?.remaining ?? 753} spots remaining at founding rate
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 2: Pricing cards ───────────────────────────────────────── */}
      <div className="bg-gray-50 px-6 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Home Report card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="h-1 bg-gray-300" />
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="text-lg font-bold text-[#1B3A6B]">Home Report</span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-extrabold text-gray-900">$29</span>
                <span className="text-gray-500 text-sm ml-2">one-time</span>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                Part 9 compliance report for secondary suites, decks &amp; garage conversions.
              </p>
              <ul className="space-y-2.5 flex-1 mb-6">
                {[
                  "Instant compliance check",
                  "AB & ON code coverage",
                  "Downloadable PDF report",
                  "30-day download access",
                  "No subscription required",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-[#0696D7] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full border-[#1B3A6B] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white transition-colors"
                variant="outline"
                onClick={() => setLocation("/home")}
              >
                Get a Report →
              </Button>
            </div>
          </div>

          {/* Pro card — featured */}
          <div className="bg-white rounded-xl shadow-lg border border-[#0696D7] flex flex-col overflow-hidden relative">
            <div className="h-1 bg-[#0696D7]" />
            <div className="absolute top-4 right-4">
              <span className="bg-[#0696D7] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {isPro ? "YOUR PLAN" : "MOST POPULAR"}
              </span>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-[#0696D7]" />
                <span className="text-lg font-bold text-[#1B3A6B]">Pro</span>
              </div>
              <div className="mb-1">
                {isFoundingMember ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-gray-900">$29</span>
                    <span className="text-gray-400 line-through text-lg">$79</span>
                    <span className="text-gray-500 text-sm">/mo</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-4xl font-extrabold text-gray-900">$79</span>
                    <span className="text-gray-500 text-sm ml-2">/month</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-5">or $69/mo billed annually</p>
              <ul className="space-y-2.5 flex-1 mb-6">
                {[
                  "Unlimited projects",
                  "PDF permit package export",
                  "Fire assembly drawings",
                  "Drawing analyzer (AI)",
                  "NBC wood frame span tables",
                  "Zone & bylaw lookup",
                  "APS / BuildingConnected integration",
                  "Priority support",
                  "All future features",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-[#0696D7] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {!isPro ? (
                <div className="space-y-2">
                  <Button
                    className="w-full bg-[#0696D7] hover:bg-[#057ab8] text-white font-bold py-3 text-base"
                    onClick={() => handleUpgrade("pro_monthly")}
                    disabled={!!checkingOut}
                  >
                    {checkingOut === "pro_monthly"
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…</>
                      : "Start Pro →"}
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleUpgrade("pro_annual")}
                    disabled={!!checkingOut}
                  >
                    {checkingOut === "pro_annual"
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…</>
                      : "Annual — $69/mo, save 13%"}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                >
                  {portalMutation.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening…</>
                    : "Manage Subscription"}
                </Button>
              )}
            </div>
          </div>

          {/* Team card — coming soon */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
            <div className="h-1 bg-amber-400" />
            <div className="absolute top-4 right-4">
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">
                Q4 2026
              </span>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-amber-600" />
                <span className="text-lg font-bold text-[#1B3A6B]">Team</span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-extrabold text-gray-400">$149</span>
                <span className="text-gray-400 text-sm ml-2">/month</span>
              </div>
              <p className="text-xs text-gray-400 mb-5">Multi-seat pricing available</p>
              <ul className="space-y-2.5 flex-1 mb-6">
                {[
                  "Everything in Pro",
                  "Multi-user workspace",
                  "Shared project library",
                  "In-app collaboration",
                  "Team admin dashboard",
                  "Dedicated support",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full mb-4" variant="outline" disabled>
                Coming Soon
              </Button>
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs text-gray-500 font-medium">Get notified at launch</p>
                {teamWaitlistSubmitted ? (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> You're on the list!
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleTeamWaitlist()}
                      className="h-8 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0"
                      onClick={handleTeamWaitlist}
                      disabled={waitlistMutation.isPending}
                    >
                      {waitlistMutation.isPending
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : "Notify Me"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Stats strip ─────────────────────────────────────────── */}
      <div className="bg-white border-y border-gray-200 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-3 divide-x divide-gray-200 text-center">
          <div className="px-6">
            <div className="text-3xl font-extrabold text-[#1B3A6B]">10×</div>
            <div className="text-sm text-gray-600 mt-1">Faster than manual compliance</div>
          </div>
          <div className="px-6">
            <div className="text-3xl font-extrabold text-[#1B3A6B]">12</div>
            <div className="text-sm text-gray-600 mt-1">Alberta & BC municipalities</div>
          </div>
          <div className="px-6">
            <div className="text-3xl font-extrabold text-[#1B3A6B]">$0</div>
            <div className="text-sm text-gray-600 mt-1">Cost of first permit revision avoided</div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: Billing portal (Pro only) ──────────────────────────── */}
      {isPro && (
        <div className="px-6 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#1B3A6B]/10 rounded-lg p-2.5">
                  <CreditCard className="w-5 h-5 text-[#1B3A6B]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Billing Management</p>
                  <p className="text-sm text-gray-500">Update payment method, download invoices, or cancel.</p>
                </div>
              </div>
              <Button
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                className="bg-[#1B3A6B] hover:bg-[#15305a] text-white"
              >
                {portalMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening…</>
                  : "Open Billing Portal →"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Founding Member Banner for non-Pro */}
      {!isPro && (
        <div className="px-6 py-4 max-w-5xl mx-auto">
          <FoundingMemberBanner />
        </div>
      )}

      {/* ── SECTION 5: Trust strip ─────────────────────────────────────────── */}
      <div className="bg-[#1B3A6B] text-white py-6 mt-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8 text-sm">
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-300" />
            Secured by Stripe
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-300" />
            Cancel anytime
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-300" />
            Canadian data storage
          </span>
          <span className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-300" />
            NBC · BCBC · ABC 2019
          </span>
        </div>
      </div>

    </div>
  );
}
