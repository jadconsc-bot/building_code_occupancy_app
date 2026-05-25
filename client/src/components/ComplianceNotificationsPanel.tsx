import { useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type FilterStatus = 'all' | 'pending' | 'reviewed' | 'actioned' | 'dismissed';
type Severity = 'critical' | 'major' | 'minor' | 'info';
type ActionType = 'reviewed' | 'actioned' | 'dismissed';

const SOURCE_JURISDICTION: Record<string, string> = {
  RAIC: 'National',
  NRC: 'National',
  STANDATA: 'AB',
  ABC: 'AB',
  BCBC: 'BC',
  OBC: 'ON',
  SK: 'SK',
  MB: 'MB',
  YK: 'YK',
};

const SEVERITY_CONFIG: Record<Severity, { label: string; className: string; icon: React.ReactNode }> = {
  critical: {
    label: 'Critical',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: <AlertCircle className="w-3 h-3" />,
  },
  major: {
    label: 'Major',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  minor: {
    label: 'Minor',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Info className="w-3 h-3" />,
  },
  info: {
    label: 'Info',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <Info className="w-3 h-3" />,
  },
};

const FILTER_TABS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Actioned', value: 'actioned' },
  { label: 'Dismissed', value: 'dismissed' },
];

function safeParseJson(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return []; }
  }
  return [];
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface ActionState {
  notifId: number;
  action: ActionType;
  notes: string;
}

export function ComplianceNotificationsPanel() {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [actionState, setActionState] = useState<ActionState | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const notificationsQuery = trpc.complianceMonitor.getNotifications.useQuery({ status: filter });
  const updateStatus = trpc.complianceMonitor.updateStatus.useMutation({
    onSuccess: () => {
      notificationsQuery.refetch();
      setActionState(null);
      toast.success('Notification updated');
    },
    onError: (err) => toast.error(`Failed to update: ${err.message}`),
  });
  const triggerRun = trpc.complianceMonitor.triggerRun.useMutation({
    onSuccess: (result) => {
      notificationsQuery.refetch();
      toast.success(
        `Check complete — ${result.sourcesChecked} sources, ${result.changesDetected} changes, ${result.notificationsCreated} new notifications`
          + (result.errors.length ? ` (${result.errors.length} errors)` : ''),
      );
    },
    onError: (err) => toast.error(`Run failed: ${err.message}`),
  });

  const notifications = notificationsQuery.data ?? [];

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleActionClick = (notifId: number, action: ActionType) => {
    if (actionState?.notifId === notifId && actionState.action === action) {
      setActionState(null);
    } else {
      setActionState({ notifId, action, notes: '' });
    }
  };

  const handleConfirm = () => {
    if (!actionState) return;
    updateStatus.mutate({
      id: actionState.notifId,
      status: actionState.action,
      reviewNotes: actionState.notes || undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Compliance Intelligence</h2>
          <p className="text-sm text-muted-foreground">
            Automated monitoring of Canadian building code and governance sources
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => triggerRun.mutate()}
          disabled={triggerRun.isPending}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${triggerRun.isPending ? 'animate-spin' : ''}`} />
          {triggerRun.isPending ? 'Running…' : 'Run Check Now'}
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-border">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              filter === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {notificationsQuery.isLoading && (
        <div className="py-8 text-center text-muted-foreground text-sm">Loading…</div>
      )}

      {/* Empty State */}
      {!notificationsQuery.isLoading && notifications.length === 0 && (
        <div className="py-12 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No compliance notifications — all sources up to date</p>
        </div>
      )}

      {/* Notification Cards */}
      <div className="space-y-3">
        {notifications.map((notif: any) => {
          const severity = notif.severity as Severity;
          const sevConfig = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info;
          const jurisdiction = SOURCE_JURISDICTION[notif.sourceId] ?? notif.sourceId;
          const affectedRules = safeParseJson(notif.affectedRuleIds);
          const actions = safeParseJson(notif.recommendedActions);
          const isExpanded = expandedIds.has(notif.id);
          const isPendingAction = actionState?.notifId === notif.id;

          return (
            <Card key={notif.id} className="overflow-hidden">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    {/* Severity Badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${sevConfig.className}`}>
                      {sevConfig.icon}
                      {sevConfig.label}
                    </span>
                    {/* Source + Jurisdiction */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 flex-shrink-0">
                      {notif.sourceId}
                      <span className="text-slate-400">·</span>
                      {jurisdiction}
                    </span>
                    {/* Status (if not pending) */}
                    {notif.status !== 'pending' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border flex-shrink-0 capitalize">
                        {notif.status}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleExpand(notif.id)}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Headline */}
                <p className="font-semibold text-sm mt-2 leading-snug">{notif.headline}</p>

                {/* Detected date */}
                <p className="text-xs text-muted-foreground mt-0.5">
                  Detected {formatDate(notif.changeDetectedAt)}
                </p>
              </CardHeader>

              {isExpanded && (
                <CardContent className="px-4 pb-4 space-y-3">
                  {/* Summary */}
                  <p className="text-sm text-muted-foreground">{notif.summary}</p>

                  {/* Affected Rule IDs */}
                  {affectedRules.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Affected Rules</p>
                      <div className="flex flex-wrap gap-1">
                        {affectedRules.map((rule, i) => (
                          <code
                            key={i}
                            className="text-xs px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-slate-700"
                          >
                            {rule}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {actions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Recommended Actions</p>
                      <ul className="space-y-1">
                        {actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-sm">
                            <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons — only for pending */}
                  {notif.status === 'pending' && (
                    <div className="pt-1 space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant={isPendingAction && actionState?.action === 'reviewed' ? 'default' : 'outline'}
                          onClick={() => handleActionClick(notif.id, 'reviewed')}
                          className="text-xs h-7"
                        >
                          Mark Reviewed
                        </Button>
                        <Button
                          size="sm"
                          variant={isPendingAction && actionState?.action === 'actioned' ? 'default' : 'outline'}
                          onClick={() => handleActionClick(notif.id, 'actioned')}
                          className="text-xs h-7"
                        >
                          Mark Actioned
                        </Button>
                        <Button
                          size="sm"
                          variant={isPendingAction && actionState?.action === 'dismissed' ? 'destructive' : 'ghost'}
                          onClick={() => handleActionClick(notif.id, 'dismissed')}
                          className="text-xs h-7"
                        >
                          Dismiss
                        </Button>
                      </div>

                      {isPendingAction && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Optional notes…"
                            value={actionState!.notes}
                            onChange={(e) => setActionState(prev => prev ? { ...prev, notes: e.target.value } : prev)}
                            className="text-xs h-16 resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleConfirm}
                              disabled={updateStatus.isPending}
                              className="text-xs h-7"
                            >
                              {updateStatus.isPending ? 'Saving…' : 'Confirm'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setActionState(null)}
                              className="text-xs h-7"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review notes (if already acted on) */}
                  {notif.status !== 'pending' && notif.reviewNotes && (
                    <div className="text-xs text-muted-foreground border-t border-border pt-2">
                      <span className="font-medium">Notes: </span>{notif.reviewNotes}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
