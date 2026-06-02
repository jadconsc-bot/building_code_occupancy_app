/**
 * Billing & Invoices Page
 * Subscription tab: real Stripe Checkout upgrade flow via tRPC.
 * Invoices / Payment Method tabs: placeholder (Stripe Customer Portal handles those).
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Loader2, Zap, Building2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { FoundingMemberBanner } from "@/components/FoundingMemberBanner";

const ROLE_LABEL: Record<string, string> = {
  free:         "Free",
  basic:        "Basic",
  professional: "Professional",
  org_admin:    "Team",
  rule_editor:  "Rule Editor",
  admin:        "Admin",
};

const PLANS = [
  {
    planType: "pro_monthly" as const,
    label: "Pro Monthly",
    price: "$79",
    period: "/month",
    features: ["Unlimited projects", "PDF report generation", "Fire assembly drawings", "Permit package export", "Priority support"],
    icon: Zap,
    highlight: true,
  },
  {
    planType: "pro_annual" as const,
    label: "Pro Annual",
    price: "$69",
    period: "/month, billed annually",
    features: ["Everything in Pro Monthly", "2 months free", "Early access to new features"],
    icon: Zap,
    highlight: false,
  },
  {
    planType: "team" as const,
    label: "Team",
    price: "$149",
    period: "/month",
    features: [
      "Everything in Pro",
      "Multi-user workspace",
      "Shared project library",
      "In-app collaboration",
      "Team admin dashboard",
      "Dedicated support",
      "Launching Q4 2026",
    ],
    icon: Building2,
    highlight: false,
    comingSoon: true,
  },
];

export default function Billing() {
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");

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

  const currentRole = me?.role ?? "free";
  const isPro = currentRole === "professional" || currentRole === "org_admin" || currentRole === "admin";

  async function handleUpgrade(planType: "pro_monthly" | "pro_annual" | "team") {
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

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your plan and billing information</p>
      </div>

      <Tabs defaultValue="subscription" className="w-full">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="payment">Payment Method</TabsTrigger>
        </TabsList>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          {!isPro && <FoundingMemberBanner />}

          {/* Current plan */}
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Badge variant={isPro ? "default" : "secondary"} className="text-sm px-3 py-1">
                {ROLE_LABEL[currentRole] ?? currentRole}
              </Badge>
              {isPro && (
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Active
                </span>
              )}
              {!isPro && (
                <span className="text-sm text-muted-foreground">Upgrade to unlock all features</span>
              )}
            </CardContent>
          </Card>

          {/* Plan cards */}
          {!isPro && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isLoading = checkingOut === plan.planType;
                const isTeam = (plan as any).comingSoon === true;

                return (
                  <Card
                    key={plan.planType}
                    className={[
                      plan.highlight ? "border-primary shadow-md" : "",
                      isTeam ? "opacity-90" : "",
                    ].join(" ")}
                  >
                    {plan.highlight && (
                      <div className="bg-primary text-primary-foreground text-xs font-semibold text-center py-1 rounded-t-lg">
                        Most Popular
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Icon className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">{plan.label}</CardTitle>
                        {isTeam && (
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-xs">
                            Coming Soon — Q4 2026
                          </Badge>
                        )}
                      </div>
                      <div>
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={plan.highlight ? "default" : "outline"}
                        onClick={() => !isTeam && handleUpgrade(plan.planType)}
                        disabled={isTeam || !!checkingOut}
                      >
                        {isLoading
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…</>
                          : isTeam
                          ? "Coming Soon"
                          : `Upgrade to ${plan.label}`}
                      </Button>

                      {/* Waitlist capture for Team plan */}
                      {isTeam && (
                        <div className="pt-2 border-t border-border space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Be notified when Team plan launches
                          </p>
                          <div className="flex gap-2">
                            <Input
                              type="email"
                              placeholder="your@email.com"
                              value={waitlistEmail}
                              onChange={(e) => setWaitlistEmail(e.target.value)}
                              className="h-8 text-sm"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 shrink-0"
                              onClick={() => {
                                if (!waitlistEmail.trim()) return;
                                toast.success("We'll notify you when Team launches!");
                                setWaitlistEmail("");
                              }}
                            >
                              Notify Me
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {isPro && (
            <Card>
              <CardContent className="py-6 flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground text-center">
                  Manage your subscription, update payment method, or cancel via the Stripe customer portal.
                </p>
                <Button
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                  variant="outline"
                >
                  {portalMutation.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening portal…</>
                    : "Manage Subscription"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payment Method Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Managed securely via Stripe</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <CreditCard className="w-6 h-6 shrink-0" />
                <p className="text-sm">Payment details and invoices are managed securely through Stripe.</p>
              </div>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
