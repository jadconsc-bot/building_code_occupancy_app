/**
 * /home/preview — Partial compliance preview + Stripe Elements payment.
 * Rev 2: Uses paymentIntentId from sessionStorage (set by HomeForm after createReport).
 * Payment via Stripe Elements (clientSecret from sessionStorage).
 * On payment success → redirect to /home/processing?pi=xxx
 */
import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle, XCircle, Lock, ArrowRight } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";

type Result = "pass" | "conditional" | "fail" | "not_applicable";

function ResultIcon({ result }: { result: Result }) {
  if (result === "pass") return <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />;
  if (result === "fail") return <XCircle className="w-4 h-4 text-red-600 shrink-0" />;
  return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
}

function resultBg(result: Result) {
  if (result === "pass") return "bg-green-50 border-green-200";
  if (result === "fail") return "bg-red-50 border-red-200";
  return "bg-amber-50 border-amber-200";
}

function resultLabel(result: Result) {
  if (result === "pass") return "PASS";
  if (result === "fail") return "FAIL";
  if (result === "not_applicable") return "N/A";
  return "CONDITIONAL";
}

function resultTextColor(result: Result) {
  if (result === "pass") return "text-green-700";
  if (result === "fail") return "text-red-700";
  return "text-amber-700";
}

export default function HomePreview() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const paymentIntentId = params.get("pi") ?? sessionStorage.getItem("cc_home_pi") ?? "";
  const clientSecret = sessionStorage.getItem("cc_home_cs") ?? "";
  const [, setLocation] = useLocation();
  const [paying, setPaying] = useState(false);

  const { data, isLoading, error } = trpc.home.getPreview.useQuery(
    { paymentIntentId },
    { enabled: !!paymentIntentId, retry: false },
  );

  async function handlePay() {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
    if (!publishableKey || !clientSecret) {
      // Dev mode — skip to processing page
      setLocation(`/home/processing?pi=${paymentIntentId}`);
      return;
    }

    setPaying(true);
    try {
      const stripe = await loadStripe(publishableKey);
      if (!stripe) throw new Error("Stripe failed to load");

      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: { token: "tok_visa" } as any }, // placeholder — real card element needed in Phase 2 UI
      });

      if (stripeError) {
        toast.error(stripeError.message);
      } else {
        setLocation(`/home/processing?pi=${paymentIntentId}`);
      }
    } finally {
      setPaying(false);
    }
  }

  if (!paymentIntentId) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-gray-500">No report found. <a href="/home" className="text-blue-600 underline">Start over</a></p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-red-600">{error?.message ?? "Report not found"}</p>
        <Button variant="link" onClick={() => setLocation("/home")}>Start over</Button>
      </div>
    );
  }

  if (data.paymentStatus === "paid") {
    setLocation(`/home/processing?pi=${paymentIntentId}`);
    return null;
  }

  const previewItems = (data.previewItems ?? []) as { ruleId: string; description: string; result: Result }[];
  const overallResult = data.overallResult as Result | null;

  return (
    <div className="max-w-xl mx-auto px-4 pt-10 pb-20">
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-1">{data.projectType?.replace(/_/g, " ")} · {data.province}</div>
        <h1 className="text-2xl font-bold text-gray-900">Your Compliance Preview</h1>
      </div>

      {overallResult && (
        <div className={`mb-6 px-4 py-3 rounded-lg border ${resultBg(overallResult)} flex items-center gap-3`}>
          <ResultIcon result={overallResult} />
          <div>
            <span className={`font-semibold ${resultTextColor(overallResult)}`}>Overall: {resultLabel(overallResult)}</span>
            <p className="text-sm text-gray-600 mt-0.5">
              {overallResult === "pass" ? "Preliminary check passed. See full report for details."
                : overallResult === "fail" ? "Issues found. Full report includes guidance to fix them."
                : "Some items need attention. Full report explains what to do."}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2 mb-6">
        {previewItems.map((item, i) => (
          <div key={item.ruleId} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${resultBg(item.result)}`}>
            <ResultIcon result={item.result} />
            <span className="flex-1 text-sm font-medium text-gray-800">{item.description}</span>
            <span className={`text-xs font-bold ${resultTextColor(item.result)}`}>{resultLabel(item.result)}</span>
            {i >= 2 && <Lock className="w-3.5 h-3.5 text-gray-400 ml-1" />}
          </div>
        ))}
        {previewItems.length > 2 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
            <Lock className="w-4 h-4" />
            {previewItems.length - 2} more items — unlock full report to see all findings and guidance
          </div>
        )}
      </div>

      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Get the full report</h2>
        <ul className="text-sm text-gray-700 space-y-1 mb-4">
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Complete compliance matrix with plain-language explanations</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> "What to do" guidance for every issue found</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Required permits + inspections checklist</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> PDF emailed + 30-day download link</li>
        </ul>
        <div className="flex items-center justify-between">
          <div><span className="text-2xl font-bold text-gray-900">$29</span><span className="text-gray-500 text-sm ml-1">CAD</span></div>
          <Button onClick={handlePay} disabled={paying} className="bg-blue-700 hover:bg-blue-800 text-white px-6">
            {paying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</> : <>Pay & Unlock <ArrowRight className="w-4 h-4 ml-1" /></>}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-3">Secure checkout via Stripe.</p>
      </div>

      <p className="text-xs text-gray-400 mt-6 leading-relaxed">
        Building code compliance only. Not a professional stamp, building permit, or zoning opinion.
        Verify requirements with your local building department before construction.
      </p>
    </div>
  );
}
