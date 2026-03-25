/**
 * Billing & Invoices Page
 * Phase 3: Subscription management and billing
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, CreditCard, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// ─── Plan tier helpers ────────────────────────────────────────────────────────

type Tier = "free" | "pro" | "enterprise";

function tierRank(tier: string): number {
  return { free: 0, pro: 1, enterprise: 2 }[tier] ?? 0;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Billing() {
  // Dialog state
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedNewTier, setSelectedNewTier] = useState<Tier>("pro");

  // ─── Server data ───────────────────────────────────────────────────────────

  const {
    data: subscriptionData,
    isLoading: subLoading,
    refetch: refetchSub,
  } = trpc.subscriptions.getCurrent.useQuery();

  const { data: plans = [], isLoading: plansLoading } =
    trpc.subscriptions.getPlans.useQuery();

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const upgradeMutation = trpc.subscriptions.upgrade.useMutation({
    onSuccess: () => {
      toast.success(`Upgraded to ${selectedNewTier} plan`);
      refetchSub();
      setIsChangePlanOpen(false);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to change plan");
    },
  });

  const downgradeMutation = trpc.subscriptions.downgrade.useMutation({
    onSuccess: () => {
      toast.success(`Downgraded to ${selectedNewTier} plan`);
      refetchSub();
      setIsChangePlanOpen(false);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to change plan");
    },
  });

  const cancelMutation = trpc.subscriptions.cancel.useMutation({
    onSuccess: () => {
      toast.success("Subscription cancelled");
      refetchSub();
      setIsCancelOpen(false);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to cancel subscription");
    },
  });

  const updatePaymentMethodMutation = trpc.billing.updatePaymentMethod.useMutation({
    onError: (error) => { toast.error(error.message); },
  });

  const addPaymentMethodMutation = trpc.billing.addPaymentMethod.useMutation({
    onError: (error) => { toast.error(error.message); },
  });

  const updateBillingAddressMutation = trpc.billing.updateBillingAddress.useMutation({
    onError: (error) => { toast.error(error.message); },
  });

  const addTaxIdMutation = trpc.billing.addTaxId.useMutation({
    onError: (error) => { toast.error(error.message); },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const currentTierRank = tierRank(subscriptionData?.tier ?? "free");

  const handleChangePlan = () => {
    const newRank = tierRank(selectedNewTier);
    if (newRank > currentTierRank) {
      upgradeMutation.mutate({ tier: selectedNewTier as "pro" | "enterprise" });
    } else {
      downgradeMutation.mutate({ tier: selectedNewTier as "free" | "pro" });
    }
  };

  const isPlanMutating = upgradeMutation.isPending || downgradeMutation.isPending;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":    return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "overdue": return "bg-red-100 text-red-800";
      default:        return "bg-gray-100 text-gray-800";
    }
  };

  // ─── Render helpers ────────────────────────────────────────────────────────

  const renderSubscriptionCard = () => {
    if (subLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      );
    }

    const sub = subscriptionData;
    const planName = sub?.tier
      ? sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1)
      : "Free";

    return (
      <Card className="border-primary bg-primary/5">
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>Your active subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-2xl font-bold">{planName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className="mt-1">
                {sub?.status ?? "active"}
              </Badge>
            </div>
            {sub?.currentPeriodEnd && (
              <div>
                <p className="text-sm text-muted-foreground">Next Billing Date</p>
                <p className="font-semibold">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsChangePlanOpen(true)}
              disabled={isPlanMutating}
            >
              Change Plan
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setIsCancelOpen(true)}
              disabled={cancelMutation.isPending || sub?.status === "cancelled"}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing information
        </p>
      </div>

      <Tabs defaultValue="subscription" className="w-full">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment">Payment Method</TabsTrigger>
        </TabsList>

        {/* ── Subscription Tab ──────────────────────────────────────────────── */}
        <TabsContent value="subscription" className="space-y-4">
          {renderSubscriptionCard()}

          {/* Plan Features */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  "Unlimited projects",
                  "PDF report generation",
                  "Project sharing with clients",
                  "Team collaboration (up to 5 members)",
                  "Priority email support",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Invoices Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                Invoice history will appear here once Stripe billing is integrated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  Invoice history requires Stripe integration.
                </p>
                <p className="text-xs text-muted-foreground">
                  Once connected, all past and upcoming invoices will be listed here with
                  one-click PDF download.
                </p>
              </div>

              {/* Placeholder table to show expected format */}
              <div className="overflow-x-auto opacity-40 pointer-events-none">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { id: "INV-2026-003", period: "Mar 1 – Mar 31, 2026", amount: 79, status: "paid", date: "2026-03-01" },
                      { id: "INV-2026-002", period: "Feb 1 – Feb 28, 2026", amount: 79, status: "paid", date: "2026-02-01" },
                    ].map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.id}</TableCell>
                        <TableCell className="text-sm">{inv.period}</TableCell>
                        <TableCell className="font-semibold">${inv.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(inv.status)}>{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{inv.date}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-2" disabled>
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payment Method Tab ────────────────────────────────────────────── */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Manage your billing payment method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Payment method management requires Stripe integration. This feature will be
                  available in a future release.
                </p>
              </div>

              {/* Placeholder for expected payment UI */}
              <div className="p-4 border rounded-lg flex items-center justify-between opacity-40 pointer-events-none">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Visa ending in 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/2027</p>
                  </div>
                </div>
                <Badge variant="secondary">Default</Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={updatePaymentMethodMutation.isPending}
                  onClick={() => updatePaymentMethodMutation.mutate({ paymentMethodId: "" })}
                >
                  Update Payment Method
                </Button>
                <Button
                  variant="outline"
                  disabled={addPaymentMethodMutation.isPending}
                  onClick={() => addPaymentMethodMutation.mutate({ paymentMethodId: "" })}
                >
                  Add Another Card
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Billing address management requires Stripe integration.
                </p>
              </div>
              <Button
                variant="outline"
                disabled={updateBillingAddressMutation.isPending}
                onClick={() => updateBillingAddressMutation.mutate({ line1: "", city: "", province: "", postalCode: "" })}
              >
                Edit Billing Address
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tax Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Tax Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add your GST/HST number to receive tax-exempt invoices. Requires Stripe Tax integration.
          </p>
          <Button
            variant="outline"
            disabled={addTaxIdMutation.isPending}
            onClick={() => addTaxIdMutation.mutate({ taxId: "" })}
          >
            Add Tax ID
          </Button>
        </CardContent>
      </Card>

      {/* ── Change Plan Dialog ────────────────────────────────────────────────── */}
      <Dialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Select a new plan. Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {plansLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading plans…
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Plan</label>
                <Select
                  value={selectedNewTier}
                  onValueChange={(v) => setSelectedNewTier(v as Tier)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.length > 0 ? (
                      plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.tier ?? plan.name?.toLowerCase() ?? ""}>
                          {plan.name} — ${plan.price}/mo
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="free">Free — $0/mo</SelectItem>
                        <SelectItem value="pro">Pro — $49/mo</SelectItem>
                        <SelectItem value="enterprise">Enterprise — $199/mo</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleChangePlan}
                disabled={isPlanMutating || selectedNewTier === (subscriptionData?.tier ?? "free")}
              >
                {isPlanMutating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating…
                  </>
                ) : tierRank(selectedNewTier) > currentTierRank ? (
                  "Upgrade Plan"
                ) : (
                  "Downgrade Plan"
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsChangePlanOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Subscription AlertDialog ──────────────────────────────────── */}
      <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will be cancelled immediately. You will lose access to premium
              features at the end of your current billing period. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Yes, Cancel"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
