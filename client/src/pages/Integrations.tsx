import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Link2, Unlink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Integrations() {
  const [location] = useLocation();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Show success/error toasts from the OAuth redirect query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      toast.success("Autodesk account connected");
      window.history.replaceState({}, "", "/integrations");
    }
    if (params.get("error")) {
      toast.error(`Connection failed: ${params.get("error")}`);
      window.history.replaceState({}, "", "/integrations");
    }
  }, []);

  const { data: connection, isLoading: connLoading, refetch: refetchConn } =
    trpc.aps.getConnection.useQuery(undefined, { retry: false });

  const { data: authUrlData, isLoading: authUrlLoading } =
    trpc.aps.getAuthUrl.useQuery(undefined, { enabled: !connLoading && connection?.connected === false });

  const { data: bcProjects, isLoading: projectsLoading, refetch: refetchProjects } =
    trpc.aps.getBCProjects.useQuery(undefined, {
      enabled: connection?.connected === true,
      retry: false,
    });

  const { data: linkedProjects, refetch: refetchLinked } =
    trpc.aps.getLinkedProjects.useQuery(undefined, {
      enabled: connection?.connected === true,
    });

  const linkMutation = trpc.aps.linkProject.useMutation({
    onSuccess: () => { refetchLinked(); },
    onError: (e) => toast.error(e.message),
  });

  const disconnectMutation = trpc.aps.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Autodesk account disconnected");
      refetchConn();
    },
    onError: (e) => toast.error(e.message),
  });

  const isLinked = (bcProjectId: string) =>
    linkedProjects?.some((lp) => lp.bcProjectId === bcProjectId) ?? false;

  const isAutoCheck = (bcProjectId: string) =>
    linkedProjects?.find((lp) => lp.bcProjectId === bcProjectId)?.autoCheckEnabled === 1;

  const toggleAutoCheck = async (project: any) => {
    const current = isLinked(project.id);
    setTogglingId(project.id);
    try {
      await linkMutation.mutateAsync({
        bcProjectId:   project.id,
        bcProjectName: project.name ?? project.id,
        autoCheck:     !current || !isAutoCheck(project.id),
      });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Connect external platforms to sync projects and trigger automated compliance checks.
        </p>
      </div>

      {/* Autodesk BuildingConnected card */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#006EAF] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">APS</span>
              </div>
              <div>
                <CardTitle className="text-base">Autodesk BuildingConnected</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Sync BC projects and trigger code compliance checks on new bid packages
                </CardDescription>
              </div>
            </div>

            {connLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mt-1 shrink-0" />
            ) : connection?.connected ? (
              <Badge className="bg-green-100 text-green-800 border-green-200 shrink-0">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground shrink-0">
                <XCircle className="w-3 h-3 mr-1" /> Not connected
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {connLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking connection…
            </div>
          ) : !connection?.connected ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connect your Autodesk account to import BuildingConnected projects and
                automatically run code compliance checks when new drawings are uploaded.
              </p>
              <Button
                className="bg-[#006EAF] hover:bg-[#005a8e] text-white"
                disabled={authUrlLoading || !authUrlData?.url}
                onClick={() => {
                  if (authUrlData?.url) window.location.href = authUrlData.url;
                }}
              >
                {authUrlLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading…</>
                ) : (
                  <><Link2 className="w-4 h-4 mr-2" /> Connect with Autodesk</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                You'll be redirected to Autodesk's sign-in page.
                Requires BuildingConnected account.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {connection.companyName && (
                <p className="text-sm text-muted-foreground">
                  Connected as <strong>{connection.companyName}</strong>
                </p>
              )}

              {/* BC project list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">BuildingConnected Projects</p>
                  <Button
                    size="sm" variant="ghost" className="h-7 text-xs"
                    onClick={() => refetchProjects()}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                  </Button>
                </div>

                {projectsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading projects…
                  </div>
                ) : !bcProjects || bcProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No BuildingConnected projects found.
                  </p>
                ) : (
                  <div className="rounded-lg border divide-y divide-border overflow-hidden">
                    {bcProjects.map((project: any) => {
                      const linked    = isLinked(project.id);
                      const autoCheck = isAutoCheck(project.id);
                      const toggling  = togglingId === project.id;

                      return (
                        <div
                          key={project.id}
                          className="flex items-center gap-3 px-4 py-3 bg-background hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {project.name ?? project.id}
                            </p>
                            {project.address?.street && (
                              <p className="text-xs text-muted-foreground truncate">
                                {project.address.street}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {linked && (
                              <Badge
                                variant={autoCheck ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {autoCheck ? "Auto-check ON" : "Auto-check OFF"}
                              </Badge>
                            )}

                            <button
                              disabled={toggling}
                              onClick={() => toggleAutoCheck(project)}
                              className={`w-10 h-5 rounded-full transition-colors shrink-0 ${linked && autoCheck ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                            >
                              {toggling ? (
                                <Loader2 className="w-3 h-3 animate-spin mx-auto text-white" />
                              ) : (
                                <span
                                  className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${linked && autoCheck ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive border-destructive/30"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                >
                  <Unlink className="w-3.5 h-3.5 mr-1.5" />
                  {disconnectMutation.isPending ? "Disconnecting…" : "Disconnect Autodesk account"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for future integrations */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-xs font-bold">+</span>
            </div>
            <div>
              <CardTitle className="text-base text-muted-foreground">More coming soon</CardTitle>
              <CardDescription className="text-xs">Procore, PlanHub, Buildertrend…</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
