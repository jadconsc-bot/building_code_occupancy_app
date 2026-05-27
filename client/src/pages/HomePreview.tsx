import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle, XCircle, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

type Result = "pass" | "conditional" | "fail";

function ResultIcon({ result }: { result: Result }) {
  if (result === "pass") return <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />;
  if (result === "conditional") return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
  return <XCircle className="w-4 h-4 text-red-600 shrink-0" />;
}

function resultBg(result: Result) {
  return result === "pass" ? "bg-green-50 border-green-200" : result === "conditional" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
}

function resultLabel(result: Result) {
  return result === "pass" ? "PASS" : result === "conditional" ? "CONDITIONAL" : "FAIL";
}

function resultTextColor(result: Result) {
  return result === "pass" ? "text-green-700" : result === "conditional" ? "text-amber-700" : "text-red-700";
}

export default function HomePreview() {
  const params = useParams<{ reportToken: string }>();
  const reportToken = params.reportToken ?? "";
  const [, setLocation] = useLocation();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { data, isLoading, error } = trpc.home.getReport.useQuery(
    { reportToken },
    { enabled: !!reportToken, retry: false },
  );

  const createCheckout = trpc.home.createCheckout.useMutation();

  async function handlePay() {
    setCheckoutLoading(true);
    try {
      const origin = window.location.origin;
      const { checkoutUrl } = await createCheckout.mutateAsync({
        reportToken,
        successUrl: `${origin}/home/report/${reportToken}`,
        cancelUrl: `${origin}/home/preview/${reportToken}`,
      });
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.error("Failed to create checkout — please try again");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Checkout failed — please try again");
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-red-600">{error?.message ?? "Report not found"}</p>
        <Button variant="link" onClick={() => setLocation("/home")} className="mt-4">Start over</Button>
      </div>
    );
  }

  if (data.paymentStatus === "paid") {
    setLocation(`/home/report/${reportToken}`);
    return null;
  }

  const previewItems: { ruleId: string; title: string; result: Result }[] = (data.previewItems as any) ?? [];
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
              {overallResult === "pass"
                ? "Your project appears to meet the basic requirements. Review full details before proceeding."
                : overallResult === "conditional"
                ? "Some items need attention before your project will meet code. See the full report for guidance."
                : "One or more critical code issues found. The full report explains what you need to fix."}
            </p>
          </div>
        </div>
      )}

      {/* Preview items — result visible, detail locked */}
      <div className="space-y-2 mb-6">
        {previewItems.map((item, i) => (
          <div key={item.ruleId} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${resultBg(item.result)}`}>
            <ResultIcon result={item.result} />
            <span className="flex-1 text-sm font-medium text-gray-800">{item.title}</span>
            <span className={`text-xs font-semibold ${resultTextColor(item.result)}`}>{resultLabel(item.result)}</span>
            {i > 1 && <Lock className="w-3.5 h-3.5 text-gray-400 ml-1" />}
          </div>
        ))}
        {previewItems.length > 2 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
            <Lock className="w-4 h-4" />
            {previewItems.length - 2} more items — unlock the full report to see all findings
          </div>
        )}
      </div>

      {/* Payment CTA */}
      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Get the full report</h2>
        <ul className="text-sm text-gray-700 space-y-1 mb-4">
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Complete compliance matrix with PASS/FAIL/CONDITIONAL</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> "What to do" guidance for every issue found</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Required permits list + inspection checklist</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> PDF report emailed instantly</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> 30-day download link</li>
        </ul>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">$29</span>
            <span className="text-gray-500 text-sm ml-1">CAD</span>
          </div>
          <Button onClick={handlePay} disabled={checkoutLoading} className="bg-blue-700 hover:bg-blue-800 text-white px-6">
            {checkoutLoading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…</>
              : <>Pay & Unlock Report <ArrowRight className="w-4 h-4 ml-1" /></>}
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Secure checkout via Stripe. No account required. Promo codes accepted at checkout.
        </p>
      </div>

      <p className="text-xs text-gray-400 mt-6 leading-relaxed">
        This report covers building code compliance only and does not constitute a professional stamp,
        building permit, or zoning opinion. Always verify with your local building department before construction.
      </p>
    </div>
  );
}
