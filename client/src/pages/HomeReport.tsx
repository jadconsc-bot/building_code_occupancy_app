import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Loader2, CheckCircle, AlertTriangle, XCircle, Download, FileText, Calendar
} from "lucide-react";

type Result = "pass" | "conditional" | "fail";

function ResultIcon({ result, size = "sm" }: { result: Result; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  if (result === "pass") return <CheckCircle className={`${cls} text-green-600 shrink-0`} />;
  if (result === "conditional") return <AlertTriangle className={`${cls} text-amber-600 shrink-0`} />;
  return <XCircle className={`${cls} text-red-600 shrink-0`} />;
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

interface ComplianceItem {
  ruleId: string;
  title: string;
  result: Result;
  message: string;
  whatToDo?: string;
  codeRef?: string;
}

interface ComplianceResult {
  projectType: string;
  province: string;
  codeEdition: string;
  overallResult: Result;
  items: ComplianceItem[];
}

export default function HomeReport() {
  const params = useParams<{ reportToken: string }>();
  const reportToken = params.reportToken ?? "";
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = trpc.home.getReport.useQuery(
    { reportToken },
    { enabled: !!reportToken, retry: false },
  );

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
        <p className="text-red-600 mb-2">{error?.message ?? "Report not found"}</p>
        <Button variant="link" onClick={() => setLocation("/home")}>Start a new report</Button>
      </div>
    );
  }

  if (data.paymentStatus !== "paid") {
    setLocation(`/home/preview/${reportToken}`);
    return null;
  }

  const compliance = data.complianceResult as ComplianceResult | null;
  const overall = compliance?.overallResult ?? (data.overallResult as Result | null);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-sm text-gray-500 mb-1">
            {data.projectType?.replace(/_/g, " ")} · {data.province}
            {data.municipality ? ` · ${data.municipality}` : ""}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CodeComply Home Report</h1>
          {compliance?.codeEdition && (
            <div className="text-sm text-gray-500 mt-1">{compliance.codeEdition}</div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" /> Save / Print
        </Button>
      </div>

      {/* Report meta */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Report ID: <span className="font-mono">{reportToken.slice(0, 16)}…</span>
        </div>
        {data.downloadExpiresAt && (
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Link expires: {new Date(data.downloadExpiresAt).toLocaleDateString("en-CA")}
          </div>
        )}
      </div>

      {/* Overall result */}
      {overall && (
        <div className={`mb-8 px-5 py-4 rounded-xl border-2 ${resultBg(overall)} flex items-center gap-4`}>
          <ResultIcon result={overall} size="lg" />
          <div>
            <div className={`text-lg font-bold ${resultTextColor(overall)}`}>
              Overall: {resultLabel(overall)}
            </div>
            <p className="text-sm text-gray-600 mt-0.5">
              {overall === "pass"
                ? "Your project appears to meet building code requirements. Proceed to permit application."
                : overall === "conditional"
                ? "Some items need attention before your project will fully meet code. See guidance below."
                : "Critical code issues found. Address FAIL items before submitting a permit application."}
            </p>
          </div>
        </div>
      )}

      {/* Compliance matrix */}
      {compliance?.items && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Compliance Matrix</h2>
          <div className="space-y-3">
            {compliance.items.map((item) => (
              <div key={item.ruleId} className={`rounded-lg border p-4 ${resultBg(item.result)}`}>
                <div className="flex items-start gap-3">
                  <ResultIcon result={item.result} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{item.title}</span>
                      <span className={`text-xs font-bold ${resultTextColor(item.result)}`}>
                        {resultLabel(item.result)}
                      </span>
                      {item.codeRef && (
                        <span className="text-xs text-gray-400 ml-auto">{item.codeRef}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{item.message}</p>
                    {item.whatToDo && (
                      <div className={`mt-2 text-sm font-medium ${resultTextColor(item.result)}`}>
                        What to do: <span className="font-normal text-gray-700">{item.whatToDo}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
        <strong>Disclaimer:</strong> This report is based on the answers you provided and the applicable building code at the time of generation.
        It does not constitute a professional engineering or architectural opinion, a professional stamp, or a building permit.
        It does not address zoning bylaws, land-use regulations, subdivision restrictions, or HOA rules.
        Building code requirements change — always verify with your local building department before construction.
        For complex projects, consult a licensed professional (P.Eng, architect, or building designer).
      </div>

      <div className="mt-4 text-center">
        <Button variant="link" onClick={() => setLocation("/home")} className="text-sm text-gray-400">
          Run another report →
        </Button>
      </div>
    </div>
  );
}
