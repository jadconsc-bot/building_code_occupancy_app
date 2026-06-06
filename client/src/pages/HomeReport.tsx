/**
 * /home/report/:rawToken — Download page.
 * Rev 2: rawToken from URL is hashed SHA-256 server-side to look up the report.
 * No authentication required — 30-day expiry enforced by server.
 */
import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle, XCircle, FileText, Calendar } from "lucide-react";
import { checkSuitePermission } from "@/lib/secondarySuiteRules";

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

export default function HomeReport() {
  const params = useParams<{ rawToken: string }>();
  const rawToken = params.rawToken ?? "";
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = "CodeComply Home Report";
    return () => { document.title = "CodeComply"; };
  }, []);

  const { data, isLoading, error } = trpc.home.downloadReport.useQuery(
    { rawToken },
    { enabled: rawToken.length === 64, retry: false },
  );

  if (!rawToken || rawToken.length !== 64) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-red-600">Invalid report link.</p>
        <Button variant="link" onClick={() => setLocation("/home")}>Start a new report</Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-red-600 mb-2">{error?.message ?? "Report not found"}</p>
        <Button variant="link" onClick={() => setLocation("/home")}>Start a new report</Button>
      </div>
    );
  }

  const overallResult = data.overallResult as Result | null;
  const items = (data.complianceItems ?? []) as Array<{
    ruleId: string;
    description: string;
    result: Result;
    plainLanguage: string;
    whatToDo?: string;
    codeReference: string;
  }>;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-20">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-sm text-gray-500 mb-1">
            {data.projectType?.replace(/_/g, " ")} · {data.province}
            {data.municipality ? ` · ${data.municipality}` : ""}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CodeComply Home Report</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>Print / Save PDF</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Report generated {data.reportGeneratedAt ? new Date(data.reportGeneratedAt).toLocaleDateString("en-CA") : "—"}
        </div>
        {data.downloadExpiresAt && (
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Link expires {new Date(data.downloadExpiresAt).toLocaleDateString("en-CA")}
          </div>
        )}
      </div>

      {overallResult && (
        <div className={`mb-8 px-5 py-4 rounded-xl border-2 ${resultBg(overallResult)} flex items-center gap-4`}>
          <ResultIcon result={overallResult} />
          <div>
            <div className={`text-lg font-bold ${resultTextColor(overallResult)}`}>Overall: {resultLabel(overallResult)}</div>
            <p className="text-sm text-gray-600 mt-0.5">
              {overallResult === "pass" ? "Preliminary check passed — proceed to permit application."
                : overallResult === "fail" ? "Issues found — address FAIL items before applying for a permit."
                : "Some items need attention — see guidance below."}
            </p>
          </div>
        </div>
      )}

      {data.projectType === 'secondary_suite' && data.municipality && (() => {
        const perm = checkSuitePermission(data.municipality, (data as any).zoneCode ?? undefined);
        const colors: Record<typeof perm.allowed, string> = {
          yes:         'bg-green-50 border-green-200 text-green-800',
          conditional: 'bg-amber-50 border-amber-200 text-amber-800',
          no:          'bg-red-50 border-red-200 text-red-800',
          unknown:     'bg-gray-50 border-gray-200 text-gray-700',
        };
        const icons: Record<typeof perm.allowed, string> = { yes: '✅', conditional: '⚠️', no: '🚫', unknown: 'ℹ️' };
        const labels: Record<typeof perm.allowed, string> = { yes: 'Suite permitted', conditional: 'Conditional approval', no: 'Suite not permitted', unknown: 'Zone eligibility unknown' };
        return (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Zoning Eligibility</h2>
            <div className={`rounded-xl border p-4 text-sm ${colors[perm.allowed]}`}>
              <p className="font-semibold mb-1">{icons[perm.allowed]} {labels[perm.allowed]}</p>
              <p>{perm.reason}</p>
              <p className="text-xs mt-1.5 opacity-75">{perm.bylaw}</p>
              {(data as any).zoneCode && <p className="text-xs mt-1 opacity-75">Zone code entered: {(data as any).zoneCode}</p>}
              {perm.notes && <p className="text-xs mt-0.5 italic opacity-75">{perm.notes}</p>}
              {perm.allowed === 'unknown' && (
                <p className="text-xs mt-2">
                  Find your zone code on your <strong>property tax assessment notice</strong> or through your municipality's online mapping portal.
                </p>
              )}
            </div>
          </section>
        );
      })()}

      {items.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Compliance Matrix</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.ruleId} className={`rounded-lg border p-4 ${resultBg(item.result)}`}>
                <div className="flex items-start gap-3">
                  <ResultIcon result={item.result} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{item.description}</span>
                      <span className={`text-xs font-bold ${resultTextColor(item.result)}`}>{resultLabel(item.result)}</span>
                      {item.codeReference && <span className="text-xs text-gray-400 ml-auto">{item.codeReference}</span>}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{item.plainLanguage}</p>
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

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
        <strong>Disclaimer:</strong> This report is based on the answers you provided and the applicable building code at the time of generation.
        It does not constitute a professional engineering or architectural opinion, a professional stamp, or a building permit.
        It does not address zoning bylaws, land-use regulations, subdivision restrictions, or HOA rules.
        Always verify current requirements with your local building department before construction.
      </div>

      <div className="mt-4 text-center">
        <Button variant="link" onClick={() => setLocation("/home")} className="text-sm text-gray-400">Run another report →</Button>
      </div>
    </div>
  );
}
