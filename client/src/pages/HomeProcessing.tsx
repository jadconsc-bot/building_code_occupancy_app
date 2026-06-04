/**
 * /home/processing — "Generating your report" page.
 * Polls home.getReport by paymentIntentId.
 * When pdfReady, user is told to check their email.
 */
import { useSearch, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomeProcessing() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const paymentIntentId = params.get("pi") ?? "";
  const [, setLocation] = useLocation();

  const { data, isLoading } = trpc.home.getReport.useQuery(
    { paymentIntentId },
    {
      enabled: !!paymentIntentId,
      refetchInterval: (query) => {
        const d = query.state.data;
        return d?.pdfReady ? false : 3000;
      },
    },
  );

  if (!paymentIntentId) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-gray-500">No payment found. <a href="/home" className="text-blue-600 underline">Start over</a></p>
      </div>
    );
  }

  if (isLoading || !data) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  // Dev mode: rawToken returned directly — skip email step and go straight to the report
  if (data.rawToken) {
    setLocation(`/home/report/${data.rawToken}`);
    return null;
  }

  if (data.pdfReady) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your report is ready!</h1>
        <p className="text-gray-600 mb-6">
          We've emailed your report to the address you provided. Click the link in the email to download your PDF.
        </p>
        <div className="flex items-center justify-center gap-2 text-blue-700 mb-8">
          <Mail className="w-5 h-5" />
          <span className="font-medium">Check your inbox</span>
        </div>
        <Button variant="link" onClick={() => setLocation("/home")}>Run another report →</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-20 text-center">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Generating your report…</h1>
      <p className="text-gray-600">
        Payment confirmed. We're generating your compliance report and will email it to you shortly.
        This usually takes less than a minute.
      </p>
    </div>
  );
}
