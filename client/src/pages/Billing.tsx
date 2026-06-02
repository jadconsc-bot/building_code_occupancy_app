/**
 * Billing & Subscription
 * Clean 3-column pricing grid. No tabs.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  async function handleUpgrade(planType: "pro_monthly" | "pro_annual") {
    setCheckingOut(planType);
    try {
      const result = await checkoutMutation.mutateAsync({ planType });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch {
      // handled by onError
    }
  }

  function handleTeamWaitlist() {
    if (!waitlistEmail.trim()) return;
    waitlistMutation.mutate({ email: waitlistEmail, source: "billing_page" });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Simple, honest pricing</h1>
        <p className="text-muted-foreground text-lg">Start free. Upgrade when you need more.</p>
        {me && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-sm text-muted-foreground">Current plan:</span>
            <Badge variant={isPro ? "default" : "secondary"} className="text-sm px-3 py-1">
              {ROLE_LABEL[currentRole] ?? currentRole}
            </Badge>
            {isFoundingMember && (
              <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-xs">
                Founding Member
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* 3-column pricing grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Home Report */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Home Report</CardTitle>
            </div>
            <div>
              <span className="text-3xl font-bold">$29</span>
              <span className="text-muted-foreground text-sm ml-1">one-time</span>
            </div>
            <p className="text-sm text-muted-foreground pt-1">
              Part 9 compliance report for secondary suites, decks &amp; garage conversions.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4">
            <ul className="space-y-2 flex-1">
              {[
                "Instant compliance check",
                "AB & ON code coverage",
                "Downloadable PDF report",
                "30-day download access",
                "No subscription required",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="w-full" variant="outline" onClick={() => setLocation("/home")}>
              Get a Report
            </Button>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className={`flex flex-col border-2 ${isPro ? "border-green-500" : "border-blue-600 shadow-lg"}`}>
          <div className={`text-white text-xs font-semibold text-center py-1.5 rounded-t-[calc(var(--radius)-2px)] flex items-center justify-center gap-1.5 ${isPro ? "bg-green-600" : "bg-blue-600"}`}>
            {isPro ? <><CheckCircle className="w-3.5 h-3.5" /> Active Plan</> : "Most Popular"}
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Pro</CardTitle>
            </div>
            <div className="space-y-0.5">
              <div>
                <span className="text-3xl font-bold">$79</span>
                <span className="text-muted-foreground text-sm ml-1">/month</span>
              </div>
              <p className="text-xs text-muted-foreground">or $69/mo billed annually</p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4">
            <ul className="space-y-2 flex-1">
              {[
                "Unlimited projects",
                "PDF report generation",
                "Fire assembly drawings",
                "Permit package export",
                "Drawing analyzer (AI)",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {!isPro ? (
              <div className="space-y-2">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleUpgrade("pro_monthly")}
                  disabled={!!checkingOut}
                >
                  {checkingOut === "pro_monthly"
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…</>
                    : "Upgrade — $79/mo"}
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
          </CardContent>
        </Card>

        {/* Team — Coming Soon */}
        <Card className="flex flex-col border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Building2 className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-lg">Team</CardTitle>
              <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-xs">
                Coming Q4 2026
              </Badge>
            </div>
            <div>
              <span className="text-3xl font-bold">$149</span>
              <span className="text-muted-foreground text-sm ml-1">/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4">
            <ul className="space-y-2 flex-1">
              {[
                "Everything in Pro",
                "Multi-user workspace",
                "Shared project library",
                "In-app collaboration",
                "Team admin dashboard",
                "Dedicated support",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="w-full" variant="outline" disabled>
              Coming Soon
            </Button>
            <div className="pt-2 border-t border-amber-200 space-y-2">
              <p className="text-xs text-muted-foreground">Get notified when Team launches</p>
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
          </CardContent>
        </Card>
      </div>

      {/* Founding Member Banner for non-Pro users */}
      {!isPro && <FoundingMemberBanner />}

      {/* Billing management card for Pro users */}
      {isPro && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing Management
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Update your payment method, download invoices, or cancel your subscription through the Stripe customer portal.
            </p>
            <Button
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              variant="outline"
              size="sm"
            >
              {portalMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening portal…</>
                : "Open Billing Portal"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Trust signals */}
      <div className="border-t pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> Payments secured by Stripe
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" /> Cancel anytime
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" /> No long-term contracts
        </span>
      </div>
    </div>
  );
}
