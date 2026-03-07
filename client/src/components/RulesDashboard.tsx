/**
 * Rules Dashboard
 * Professional interface for browsing, searching, and managing building code rules
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, AlertCircle, CheckCircle2, Clock, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface RulesDashboardProps {
  onRuleSelect?: (rulesetId: string) => void;
}

export function RulesDashboard({ onRuleSelect }: RulesDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRuleset, setSelectedRuleset] = useState<string | null>(null);

  // Fetch active rulesets
  const { data: rulesetsData, isLoading: rulesetsLoading } = trpc.rule.getActiveRulesets.useQuery({});

  // Fetch selected ruleset details
  const { data: rulesetDetails, isLoading: detailsLoading } = trpc.rule.getRuleset.useQuery(
    { rulesetId: selectedRuleset || "" },
    { enabled: !!selectedRuleset }
  );

  // Fetch changelog for selected ruleset
  const { data: changelogData } = trpc.rule.getRuleChangelog.useQuery(
    { rulesetId: selectedRuleset || "" },
    { enabled: !!selectedRuleset }
  );

  // Fetch tests for selected ruleset
  const { data: testsData } = trpc.rule.getRuleTests.useQuery(
    { rulesetId: selectedRuleset || "" },
    { enabled: !!selectedRuleset }
  );

  // Filter rulesets based on search
  const filteredRulesets = useMemo(() => {
    if (!rulesetsData?.rulesets) return [];
    
    const query = searchQuery.toLowerCase();
    return rulesetsData.rulesets.filter((rs: any) =>
      rs.code.toLowerCase().includes(query) ||
      rs.edition.toLowerCase().includes(query) ||
      rs.version.toLowerCase().includes(query) ||
      rs.description?.toLowerCase().includes(query)
    );
  }, [rulesetsData?.rulesets, searchQuery]);

  const handleSelectRuleset = (rulesetId: string) => {
    setSelectedRuleset(rulesetId);
    onRuleSelect?.(rulesetId);
  };

  const handleDownloadRules = () => {
    if (!rulesetDetails?.ruleset) return;
    
    const data = {
      ruleset: rulesetDetails.ruleset,
      changelog: changelogData?.changelog || [],
      tests: testsData?.tests || [],
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ruleset-${rulesetDetails.ruleset.id}.json`;
    a.click();
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Rules Management</h2>
        <p className="text-muted-foreground">
          Browse and manage building code rules across different versions and editions
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search by code, edition, or version..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rulesets List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Available Rulesets</CardTitle>
            <CardDescription>
              {filteredRulesets.length} of {rulesetsData?.rulesets?.length || 0} versions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {rulesetsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Loading rulesets...</p>
                  </div>
                ) : filteredRulesets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No rulesets found</p>
                  </div>
                ) : (
                  filteredRulesets.map((ruleset: any) => (
                    <button
                      key={ruleset.id}
                      onClick={() => handleSelectRuleset(ruleset.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedRuleset === ruleset.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <div className="font-mono font-bold text-sm">{ruleset.code}</div>
                      <div className="text-xs mt-1">Edition: {ruleset.edition}</div>
                      <div className="text-xs">v{ruleset.version}</div>
                      <div className="text-[10px] mt-1 opacity-75">
                        {new Date(ruleset.effectiveDate).toLocaleDateString()}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Details Panel */}
        <Card className="lg:col-span-2">
          {selectedRuleset && rulesetDetails?.success ? (
            <Tabs defaultValue="overview" className="w-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{rulesetDetails.ruleset.code}</CardTitle>
                    <CardDescription>
                      Edition {rulesetDetails.ruleset.edition} • v{rulesetDetails.ruleset.version}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadRules}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>

              <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
                <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="changelog" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Changelog
                </TabsTrigger>
                <TabsTrigger value="tests" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Tests
                </TabsTrigger>
              </TabsList>

              <CardContent className="pt-6">
                <TabsContent value="overview" className="space-y-4">
                  {rulesetDetails.ruleset.description && (
                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">
                        {rulesetDetails.ruleset.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="text-xs text-muted-foreground mb-1">Total Rules</div>
                      <div className="text-2xl font-bold">{rulesetDetails.ruleset.ruleCount}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="text-xs text-muted-foreground mb-1">Effective Date</div>
                      <div className="text-sm font-semibold">
                        {new Date(rulesetDetails.ruleset.effectiveDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Sample Rules</h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {rulesetDetails.ruleset.rules && rulesetDetails.ruleset.rules.length > 0 ? (
                        rulesetDetails.ruleset.rules.map((rule: any, idx: number) => (
                          <div key={idx} className="p-2 rounded bg-muted text-sm">
                            <div className="font-mono text-xs text-muted-foreground">
                              {typeof rule === "string" ? rule : JSON.stringify(rule).substring(0, 50)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No rules available</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="changelog" className="space-y-4">
                  {changelogData?.changelog && changelogData.changelog.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {changelogData.changelog.map((entry: any) => (
                        <div key={entry.id} className="p-3 rounded-lg border border-border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-mono text-sm">{entry.ruleId}</div>
                            <Badge variant="outline" className="text-xs">
                              {entry.changeType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{entry.description}</p>
                          {entry.reason && (
                            <p className="text-xs text-muted-foreground italic">
                              Reason: {entry.reason}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground mt-2">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No changelog entries
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="tests" className="space-y-4">
                  {testsData?.tests && testsData.tests.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {testsData.tests.map((test: any) => (
                        <div key={test.id} className="p-3 rounded-lg border border-border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-semibold text-sm">{test.testName}</div>
                            <Badge
                              variant={test.passed ? "default" : "destructive"}
                              className="text-xs"
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
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {test.lastRunAt
                              ? new Date(test.lastRunAt).toLocaleString()
                              : "Never run"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tests available
                    </p>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          ) : (
            <CardContent className="py-12">
              <div className="text-center space-y-2">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {selectedRuleset ? "Loading ruleset details..." : "Select a ruleset to view details"}
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
