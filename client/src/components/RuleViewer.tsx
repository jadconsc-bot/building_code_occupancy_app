/**
 * Rule Viewer
 * Detailed view of individual rules with history and test results
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2, Clock, Copy, Share2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface RuleViewerProps {
  ruleId: string;
  rulesetId: string;
  onClose?: () => void;
}

export function RuleViewer({ ruleId, rulesetId, onClose }: RuleViewerProps) {
  const [copied, setCopied] = useState(false);

  // Fetch rule change history
  const { data: historyData, isLoading: historyLoading } = trpc.rule.getRuleChangeHistory.useQuery({
    ruleId,
  });

  // Fetch rule tests
  const { data: testsData, isLoading: testsLoading } = trpc.rule.getRuleTests.useQuery({
    rulesetId,
    ruleId,
  });

  const handleCopyRuleId = () => {
    navigator.clipboard.writeText(ruleId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareRule = () => {
    const shareUrl = `${window.location.origin}?rule=${ruleId}&ruleset=${rulesetId}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Rule link copied to clipboard!");
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight font-mono">{ruleId}</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyRuleId}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground">
            Ruleset: <span className="font-mono">{rulesetId}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleShareRule}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          {onClose && (
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Change History</TabsTrigger>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
        </TabsList>

        {/* Change History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Change History</CardTitle>
              <CardDescription>
                All modifications to this rule across versions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Loading change history...</p>
                </div>
              ) : historyData?.history && historyData.history.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {historyData.history.map((entry: any, idx: number) => (
                      <div
                        key={entry.id}
                        className="pb-4 border-b last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="space-y-1">
                            <div className="font-semibold">
                              {entry.changeType.charAt(0).toUpperCase() + entry.changeType.slice(1)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {entry.description}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {entry.changeType}
                          </Badge>
                        </div>

                        {entry.reason && (
                          <div className="mt-2 p-2 rounded bg-muted text-sm">
                            <span className="font-semibold">Reason: </span>
                            {entry.reason}
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(entry.createdAt).toLocaleString()}
                          </div>
                          {entry.approvedBy && (
                            <div>Approved by: User #{entry.approvedBy}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No change history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Results Tab */}
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Results</CardTitle>
              <CardDescription>
                Validation tests for this rule
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Loading test results...</p>
                </div>
              ) : testsData?.tests && testsData.tests.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {testsData.tests.map((test: any) => (
                      <div
                        key={test.id}
                        className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="space-y-1 flex-1">
                            <div className="font-semibold">{test.testName}</div>
                            <p className="text-sm text-muted-foreground">
                              Test ID: {test.id}
                            </p>
                          </div>
                          <Badge
                            variant={test.passed ? "default" : "destructive"}
                            className="ml-2"
                          >
                            {test.passed ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Passed
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Failed
                              </>
                            )}
                          </Badge>
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {test.lastRunAt
                              ? new Date(test.lastRunAt).toLocaleString()
                              : "Never run"}
                          </div>
                          <div>
                            Created: {new Date(test.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Test Status Indicator */}
                        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              test.passed ? "bg-green-500" : "bg-red-500"
                            }`}
                            style={{ width: test.passed ? "100%" : "0%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tests available for this rule</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {historyData?.history?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Changes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {testsData?.tests?.filter((t: any) => t.passed).length || 0}/{testsData?.tests?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Tests Passed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
