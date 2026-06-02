import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const PROJECT_TYPE_LABELS: Record<string, string> = {
  secondary_suite:    "Secondary Suite",
  basement_suite:     "Basement Suite",
  garage_conversion:  "Garage Conversion",
  addition:           "Addition",
  deck:               "Deck / Patio",
  new_home:           "New Home",
};

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function HomeReportHistory() {
  const [, setLocation] = useLocation();
  const { data: reports = [], isLoading } = trpc.home.getMyReports.useQuery();
  const now = new Date();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Home Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your paid compliance reports. Download links expire 30 days after purchase.
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <FileText className="w-10 h-10 text-muted-foreground" />
            <p className="text-muted-foreground">No reports yet.</p>
            <Button onClick={() => setLocation("/home")} variant="outline">
              Get a Home Report — $29
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const expired =
              report.downloadExpiresAt && new Date(report.downloadExpiresAt) < now;
            const label =
              PROJECT_TYPE_LABELS[report.projectType] ?? report.projectType;
            const isPaid = report.paymentStatus === "paid";

            return (
              <Card key={report.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{label}</CardTitle>
                    <div className="flex items-center gap-2">
                      {!isPaid && (
                        <Badge variant="secondary">Pending payment</Badge>
                      )}
                      {isPaid && expired && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                      {isPaid && !expired && (
                        <Badge variant="default" className="bg-green-600">
                          Available
                        </Badge>
                      )}
                      {report.overallResult && (
                        <Badge
                          variant={
                            report.overallResult === "pass"
                              ? "default"
                              : report.overallResult === "fail"
                              ? "destructive"
                              : "secondary"
                          }
                          className={
                            report.overallResult === "pass" ? "bg-green-600" : undefined
                          }
                        >
                          {report.overallResult.charAt(0).toUpperCase() +
                            report.overallResult.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    {report.province} &middot; Created {formatDate(report.createdAt)}
                    {report.reportGeneratedAt &&
                      ` · Generated ${formatDate(report.reportGeneratedAt)}`}
                    {report.downloadExpiresAt && !expired &&
                      ` · Expires ${formatDate(report.downloadExpiresAt)}`}
                  </CardDescription>
                </CardHeader>
                {isPaid && !expired && report.reportToken && (
                  <CardContent className="pt-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() =>
                        setLocation(`/home/report/${report.reportToken}`)
                      }
                    >
                      <Download className="w-4 h-4" />
                      View Report
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
