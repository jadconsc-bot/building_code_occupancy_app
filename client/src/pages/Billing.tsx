/**
 * Billing & Invoices Page
 * Phase 3: Subscription management and billing
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, CreditCard, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Billing() {
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  // Mock data for demo
  const currentSubscription = {
    plan: "Professional",
    price: 79,
    billingCycle: "monthly",
    status: "active",
    nextBillingDate: "2026-04-01",
    autoRenew: true,
  };

  const invoices = [
    {
      id: "INV-2026-003",
      date: "2026-03-01",
      amount: 79.00,
      status: "paid",
      dueDate: "2026-03-01",
      period: "Mar 1 - Mar 31, 2026",
    },
    {
      id: "INV-2026-002",
      date: "2026-02-01",
      amount: 79.00,
      status: "paid",
      dueDate: "2026-02-01",
      period: "Feb 1 - Feb 28, 2026",
    },
    {
      id: "INV-2026-001",
      date: "2026-01-01",
      amount: 79.00,
      status: "paid",
      dueDate: "2026-01-01",
      period: "Jan 1 - Jan 31, 2026",
    },
  ];

  const handleChangePlan = async () => {
    setIsChangingPlan(true);
    try {
      // TODO: Wire to tRPC mutation for changing subscription plan
      // const result = await trpc.subscriptions.changePlan.mutate({ newPlan: ... });
      
      toast.success("Plan change initiated. Please review your new plan details.");
    } catch (error) {
      toast.error("Failed to change plan");
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription? This action cannot be undone.")) {
      return;
    }

    setIsCanceling(true);
    try {
      // TODO: Wire to tRPC mutation for canceling subscription
      // const result = await trpc.subscriptions.cancel.mutate({});
      
      toast.success("Subscription cancelled successfully");
    } catch (error) {
      toast.error("Failed to cancel subscription");
    } finally {
      setIsCanceling(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      // TODO: Wire to tRPC mutation for downloading invoice
      // const result = await trpc.billing.downloadInvoice.mutate({ invoiceId });
      
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      toast.error("Failed to download invoice");
    }
  };

  const handleUpdatePaymentMethod = async () => {
    setIsUpdatingPayment(true);
    try {
      // TODO: Wire to Stripe payment method update flow
      // const result = await trpc.billing.updatePaymentMethod.mutate({});
      
      toast.success("Payment method updated successfully");
    } catch (error) {
      toast.error("Failed to update payment method");
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleAddCard = async () => {
    try {
      // TODO: Wire to Stripe add card flow
      // const result = await trpc.billing.addPaymentMethod.mutate({});
      
      toast.success("Card added successfully");
    } catch (error) {
      toast.error("Failed to add card");
    }
  };

  const handleEditBillingAddress = async () => {
    try {
      // TODO: Wire to tRPC mutation for updating billing address
      // const result = await trpc.billing.updateBillingAddress.mutate({});
      
      toast.success("Billing address updated successfully");
    } catch (error) {
      toast.error("Failed to update billing address");
    }
  };

  const handleAddTaxId = async () => {
    try {
      // TODO: Wire to tRPC mutation for adding tax ID
      // const result = await trpc.billing.addTaxId.mutate({});
      
      toast.success("Tax ID added successfully");
    } catch (error) {
      toast.error("Failed to add tax ID");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and billing information</p>
      </div>

      <Tabs defaultValue="subscription" className="w-full">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment">Payment Method</TabsTrigger>
        </TabsList>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Your active subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="text-2xl font-bold">{currentSubscription.plan}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold">
                    ${currentSubscription.price}
                    <span className="text-lg text-muted-foreground">/{currentSubscription.billingCycle}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className="mt-1">{currentSubscription.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Billing Date</p>
                  <p className="font-semibold">{currentSubscription.nextBillingDate}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handleChangePlan}
                  disabled={isChangingPlan}
                >
                  {isChangingPlan ? "Changing Plan..." : "Change Plan"}
                </Button>
                <Button 
                  variant="outline" 
                  className="text-destructive"
                  onClick={handleCancelSubscription}
                  disabled={isCanceling}
                >
                  {isCanceling ? "Canceling..." : "Cancel Subscription"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Plan Features */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Unlimited projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>PDF report generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Project sharing with clients</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Team collaboration (up to 5 members)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Priority email support</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>All invoices and payment records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
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
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell className="text-sm">{invoice.period}</TableCell>
                        <TableCell className="font-semibold">${invoice.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{invoice.date}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                          >
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

        {/* Payment Method Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Manage your billing payment method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg flex items-center justify-between">
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
                  onClick={handleUpdatePaymentMethod}
                  disabled={isUpdatingPayment}
                >
                  {isUpdatingPayment ? "Updating..." : "Update Payment Method"}
                </Button>
                <Button variant="outline" onClick={handleAddCard}>Add Another Card</Button>
              </div>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="font-semibold">Jose Acevedo</p>
                <p className="text-sm text-muted-foreground">123 Main Street</p>
                <p className="text-sm text-muted-foreground">Calgary, AB T2P 1M1</p>
                <p className="text-sm text-muted-foreground">Canada</p>
              </div>
              <Button variant="outline" onClick={handleEditBillingAddress}>Edit Billing Address</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tax ID */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Tax Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add your GST/HST number to receive tax-exempt invoices
          </p>
          <Button variant="outline" onClick={handleAddTaxId}>Add Tax ID</Button>
        </CardContent>
      </Card>
    </div>
  );
}
