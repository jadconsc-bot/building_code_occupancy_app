import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, RefreshCw, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const PLAN_TYPE_LABELS: Record<string, string> = {
  floor_plan: "Floor Plan",
  residential_single_family: "Single Family",
  residential_multi_unit: "Multi-Unit",
  commercial_office: "Commercial Office",
  institutional: "Institutional",
  industrial: "Industrial",
  mixed_use: "Mixed Use",
  structural: "Structural",
  auto: "Auto-detected",
};

const CORRECTION_TYPE_LABELS: Record<string, string> = {
  label_rename: "Label Rename",
  occupancy_change: "Occupancy Change",
  boundary_redraw: "Boundary Redraw",
  false_positive_delete: "False Positive",
  missing_room_add: "Missing Room",
};

export function TrainingExamplesPanel() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: examples, isLoading, refetch } = trpc.correction.getAllTrainingExamples.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const toggleMutation = trpc.correction.toggleTrainingExample.useMutation({
    onSuccess: () => {
      toast.success("Training example updated.");
      refetch();
    },
    onError: () => toast.error("Failed to update training example."),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading training examples…
        </CardContent>
      </Card>
    );
  }

  if (!examples || examples.length === 0) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            Training Examples
          </CardTitle>
          <CardDescription className="text-xs">Admin corrections feed the LLM prompt injection pool.</CardDescription>
        </CardHeader>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No training examples yet. Corrections saved by admins will appear here.
        </CardContent>
      </Card>
    );
  }

  // Group by plan type
  const byPlanType = examples.reduce<Record<string, typeof examples>>((acc, ex) => {
    const key = ex.planType ?? "auto";
    if (!acc[key]) acc[key] = [];
    acc[key].push(ex);
    return acc;
  }, {});

  const planTypes = Object.keys(byPlanType).sort();
  const tabs = ["all", ...planTypes];

  const activeExamples = activeTab === "all" ? examples : (byPlanType[activeTab] ?? []);
  const activeCount = activeExamples.filter(e => e.isActive === 1).length;

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            Training Examples
            <Badge variant="secondary" className="text-[10px]">{examples.length} total</Badge>
            <Badge className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100 border-0">
              {examples.filter(e => e.isActive === 1).length} active
            </Badge>
          </span>
          <Button variant="ghost" size="sm" onClick={() => refetch()} title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </CardTitle>
        <CardDescription className="text-xs">
          Admin corrections injected into LLM prompts during analysis.
          Org-specific examples take priority (up to 7); global fills remaining slots to 10.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Stats row */}
        <div className="flex flex-wrap gap-2 mb-3 text-xs">
          {planTypes.map(pt => (
            <div key={pt} className="flex items-center gap-1 px-2 py-1 rounded bg-muted border border-border">
              <span className="font-medium">{PLAN_TYPE_LABELS[pt] ?? pt}</span>
              <span className="text-muted-foreground">
                {byPlanType[pt].filter(e => e.isActive === 1).length}/{byPlanType[pt].length}
              </span>
            </div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-3 bg-transparent p-0">
            {tabs.map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="text-xs h-7 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab === "all" ? "All" : (PLAN_TYPE_LABELS[tab] ?? tab)}
                <span className="ml-1 text-[10px] opacity-70">
                  {tab === "all" ? examples.length : byPlanType[tab]?.length ?? 0}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map(tab => (
            <TabsContent key={tab} value={tab} className="mt-0">
              {activeTab === tab && (
                <ScrollArea className="h-80">
                  <div className="space-y-2 pr-2">
                    {activeExamples.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No examples for this plan type.</p>
                    ) : (
                      activeExamples.map(ex => {
                        const isActive = ex.isActive === 1;
                        const createdAt = ex.createdAt
                          ? new Date(ex.createdAt).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })
                          : "—";
                        return (
                          <div
                            key={ex.id}
                            className={`rounded border p-2.5 text-xs transition-colors ${
                              isActive ? "border-border bg-background" : "border-border/40 bg-muted/30 opacity-60"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                                    {PLAN_TYPE_LABELS[ex.planType] ?? ex.planType}
                                  </Badge>
                                  {ex.orgId != null ? (
                                    <Badge className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                                      Org {ex.orgId}
                                    </Badge>
                                  ) : (
                                    <Badge className="text-[9px] px-1 py-0 bg-slate-100 text-slate-600 hover:bg-slate-100 border-0">
                                      Global
                                    </Badge>
                                  )}
                                  <span className="text-muted-foreground">{createdAt}</span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed line-clamp-3">
                                  {ex.promptContribution}
                                </p>
                              </div>
                              <Switch
                                checked={isActive}
                                onCheckedChange={(checked) => {
                                  toggleMutation.mutate({ id: ex.id, isActive: checked });
                                }}
                                disabled={toggleMutation.isPending}
                                title={isActive ? "Deactivate — remove from prompt pool" : "Activate — add to prompt pool"}
                                className="shrink-0 mt-0.5"
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Iron Law reminder */}
        <div className="mt-3 flex items-start gap-1.5 text-[10px] text-muted-foreground/70 border-t pt-2">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            These examples improve LLM prompts only. They never modify the rule engine, occupancy
            classifications, or any compliance determination.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default TrainingExamplesPanel;
