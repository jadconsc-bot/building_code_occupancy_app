/**
 * Rule Management Interface
 * Admin-only interface for managing rules, running tests, and comparing versions
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, AlertCircle, Play, BarChart3, GitCompare } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface RuleManagementProps {
  rulesetId?: string;
}

export function RuleManagement({ rulesetId }: RuleManagementProps) {
  const { user } = useAuth();
  const [selectedRuleset, setSelectedRuleset] = useState<string | null>(rulesetId || null);
  const [compareRuleset, setCompareRuleset] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  // Fetch active rulesets
  const { data: rulesetsData } = trpc.rule.getActiveRulesets.useQuery({});

  // Run ruleset tests mutation
  const runTestsMutation = trpc.rule.runRulesetTests.useMutation({
    onSuccess: () => {
      alert("Tests completed successfully!");
      setTestRunning(false);
    },
    onError: (error) => {
      alert(`Error running tests: ${error.message}`);
      setTestRunning(false);
    },
  });

  // Compare rulesets query
  const { data: comparisonData, isLoading: comparisonLoading } = trpc.rule.compareRulesets.useQuery(
    { rulesetId1: selectedRuleset || "", rulesetId2: compareRuleset || "" },
    { enabled: !!selectedRuleset && !!compareRuleset }
  );

  // Fetch ruleset details for test results
  const { data: rulesetDetails } = trpc.rule.getRuleset.useQuery(
    { rulesetId: selectedRuleset || "" },
    { enabled: !!selectedRuleset }
  );

  const { data: testsData } = trpc.rule.getRuleTests.useQuery(
    { rulesetId: selectedRuleset || "" },
    { enabled: !!selectedRuleset }
  );

  const handleRunTests = async () => {
    if (!selectedRuleset) {
      alert("Please select a ruleset first");
      return;
    }

    setTestRunning(true);
    await runTestsMutation.mutateAsync({ rulesetId: selectedRuleset });
  };

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to access the Rule Management interface. Admin access required.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Rule Management</h2>
        <p className="text-muted-foreground">
          Manage rules, run tests, and compare versions (Admin only)
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tests">Run Tests</TabsTrigger>
          <TabsTrigger value="comparison">Compare Versions</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        {/* Run Tests Tab */}
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Run Rule Tests</CardTitle>
              <CardDescription>
                Execute all test cases for a ruleset to validate rule logic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ruleset Selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Select Ruleset</label>
                <select
                  value={selectedRuleset || ""}
                  onChange={(e) => setSelectedRuleset(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="">Choose a ruleset...</option>
                  {rulesetsData?.rulesets?.map((rs: any) => (
                    <option key={rs.id} value={rs.id}>
                      {rs.code} (Edition {rs.edition}, v{rs.version})
                    </option>
                  ))}
                </select>
              </div>

              {/* Run Tests Button */}
              <Button
                onClick={handleRunTests}
                disabled={!selectedRuleset || testRunning}
                className="w-full"
              >
                {testRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run All Tests
                  </>
                )}
              </Button>

              {/* Test Results */}
              {testsData?.tests && testsData.tests.length > 0 && (
                <div className="space-y-3 mt-6 pt-6 border-t">
                  <h4 className="font-semibold">Test Results</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{testsData.tests.length}</div>
                      <p className="text-xs text-muted-foreground">Total Tests</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950">
                      <div className="text-2xl font-bold text-green-600">
                        {testsData.tests.filter((t: any) => t.passed).length}
                      </div>
                      <p className="text-xs text-green-600">Passed</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950">
                      <div className="text-2xl font-bold text-red-600">
                        {testsData.tests.filter((t: any) => !t.passed).length}
                      </div>
                      <p className="text-xs text-red-600">Failed</p>
                    </div>
                  </div>

                  {/* Test List */}
                  <ScrollArea className="h-[300px] border rounded-lg p-4">
                    <div className="space-y-2">
                      {testsData.tests.map((test: any) => (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-2 rounded bg-muted"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {test.passed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm font-mono">{test.testName}</span>
                          </div>
                          <Badge variant={test.passed ? "default" : "destructive"}>
                            {test.passed ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compare Versions Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compare Ruleset Versions</CardTitle>
              <CardDescription>
                Identify differences between two ruleset versions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* First Ruleset */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">From Version</label>
                  <select
                    value={selectedRuleset || ""}
                    onChange={(e) => setSelectedRuleset(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="">Choose a ruleset...</option>
                    {rulesetsData?.rulesets?.map((rs: any) => (
                      <option key={rs.id} value={rs.id}>
                        {rs.code} v{rs.version}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Second Ruleset */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">To Version</label>
                  <select
                    value={compareRuleset || ""}
                    onChange={(e) => setCompareRuleset(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="">Choose a ruleset...</option>
                    {rulesetsData?.rulesets?.map((rs: any) => (
                      <option key={rs.id} value={rs.id}>
                        {rs.code} v{rs.version}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comparison Results */}
              {comparisonLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">Comparing versions...</p>
                </div>
              ) : comparisonData?.comparison ? (
                <div className="space-y-4 mt-6 pt-6 border-t">
                  <h4 className="font-semibold flex items-center gap-2">
                    <GitCompare className="h-4 w-4" />
                    Changes Summary
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                      <div className="text-2xl font-bold text-blue-600">
                        {comparisonData.comparison.summary.added}
                      </div>
                      <p className="text-xs text-blue-600">Added</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                      <div className="text-2xl font-bold text-yellow-600">
                        {comparisonData.comparison.summary.modified}
                      </div>
                      <p className="text-xs text-yellow-600">Modified</p>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950">
                      <div className="text-2xl font-bold text-orange-600">
                        {comparisonData.comparison.summary.deprecated}
                      </div>
                      <p className="text-xs text-orange-600">Deprecated</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950">
                      <div className="text-2xl font-bold text-red-600">
                        {comparisonData.comparison.summary.removed}
                      </div>
                      <p className="text-xs text-red-600">Removed</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm">
                      <span className="font-semibold">Total Changes:</span>{" "}
                      {comparisonData.comparison.changeCount}
                    </p>
                  </div>
                </div>
              ) : selectedRuleset && compareRuleset ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No comparison data available</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ruleset Status</CardTitle>
              <CardDescription>
                Overview of all available rulesets and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rulesetsData?.rulesets && rulesetsData.rulesets.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-4">
                    {rulesetsData.rulesets.map((rs: any) => (
                      <div
                        key={rs.id}
                        className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-mono font-bold">{rs.code}</div>
                            <div className="text-sm text-muted-foreground">
                              Edition {rs.edition} • v{rs.version}
                            </div>
                          </div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Effective: {new Date(rs.effectiveDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No rulesets available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
