/**
 * Admin Dashboard
 * 
 * Provides administrators with system monitoring, user management,
 * and analytics capabilities
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, BarChart3, Settings, LogOut, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCalculations: number;
  totalProjects: number;
  systemUptime: string;
  lastBackup: Date;
}

/**
 * Admin Dashboard Component
 */
export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 1250,
    activeUsers: 342,
    totalCalculations: 8934,
    totalProjects: 2156,
    systemUptime: '99.98%',
    lastBackup: new Date(),
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingLogs, setIsExportingLogs] = useState(false);
  const [isViewingAudit, setIsViewingAudit] = useState(false);
  const [banTarget, setBanTarget] = useState<{ id: number; name: string | null } | null>(null);
  const [banReason, setBanReason] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'free' | 'home_user' | 'basic' | 'professional' | 'rule_editor' | 'admin' | 'org_admin'>('free');
  const utils = trpc.useUtils();
  const usersQuery = trpc.admin.listUsers.useQuery({ search: searchQuery });
  const invitesQuery = trpc.admin.listInvites.useQuery();
  const sourcesQuery = trpc.complianceMonitor.getSources.useQuery(undefined, {
    enabled: !loading && user?.role === 'admin',
  });
  const banMutation = trpc.admin.banUser.useMutation({ onSuccess: async () => { await utils.admin.listUsers.invalidate(); setBanTarget(null); setBanReason(''); toast.success('User banned'); }, onError: (error) => toast.error(error.message) });
  const unbanMutation = trpc.admin.unbanUser.useMutation({ onSuccess: async () => { await utils.admin.listUsers.invalidate(); toast.success('User unbanned'); }, onError: (error) => toast.error(error.message) });
  const inviteMutation = trpc.admin.createInvite.useMutation({ onSuccess: async () => { await utils.admin.listInvites.invalidate(); setInviteEmail(''); toast.success('Invite saved'); }, onError: (error) => toast.error(error.message) });
  const revokeInviteMutation = trpc.admin.revokeInvite.useMutation({ onSuccess: async () => { await utils.admin.listInvites.invalidate(); toast.success('Invite revoked'); }, onError: (error) => toast.error(error.message) });

  // Check if user is admin
  if (!loading && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have permission to access the admin dashboard. Only administrators can access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleExportLogs = async () => {
    setIsExportingLogs(true);
    try {
      // TODO: Wire to tRPC mutation for exporting system logs
      // const result = await trpc.admin.exportSystemLogs.mutate({});
      
      toast.success("System logs exported successfully");
    } catch (error) {
      toast.error("Failed to export system logs");
    } finally {
      setIsExportingLogs(false);
    }
  };

  const handleViewAuditTrail = async () => {
    setIsViewingAudit(true);
    try {
      // TODO: Wire to tRPC mutation for viewing audit trail
      // const result = await trpc.admin.getAuditTrail.mutate({});
      
      toast.info("Audit trail loaded");
    } catch (error) {
      toast.error("Failed to load audit trail");
    } finally {
      setIsViewingAudit(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">System monitoring and user management</p>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">{metrics.activeUsers} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalCalculations}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">System Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.systemUptime}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="sources">Monitored Sources</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invite a user</CardTitle>
                <CardDescription>Pre-provision a role for a user's first sign-in.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" type="email" />
                  <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as typeof inviteRole)}>
                    <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['free', 'home_user', 'basic', 'professional', 'rule_editor', 'admin', 'org_admin'].map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })} disabled={inviteMutation.isPending || !inviteEmail}>Send Invite</Button>
                </div>
                {invitesQuery.data && invitesQuery.data.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-sm font-medium">Pending invites</p>
                    {invitesQuery.data.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between text-sm">
                        <span>{invite.email} <Badge variant="outline" className="ml-2">{invite.role}</Badge></span>
                        <Button variant="ghost" size="sm" onClick={() => revokeInviteMutation.mutate({ inviteId: invite.id })}>Revoke</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage system users and their permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="py-2 px-4 text-left">Name</th>
                        <th className="py-2 px-4 text-left">Email</th>
                        <th className="py-2 px-4 text-left">Role</th>
                        <th className="py-2 px-4 text-left">Status</th>
                        <th className="py-2 px-4 text-xs text-muted-foreground">Last signed in</th>
                        <th className="py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersQuery.data?.map((u) => (
                        <tr key={u.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4 font-medium">{u.name || '—'}</td>
                          <td className="py-2 px-4 text-muted-foreground">{u.email || '—'}</td>
                          <td className="py-2 px-4">
                            <Badge variant="outline">{u.role}</Badge>
                          </td>
                          <td className="py-2 px-4">
                            {u.bannedAt ? <span title={u.banReason ?? undefined}><Badge variant="destructive">Banned</Badge>{u.banReason && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{u.banReason}</p>}</span> : <Badge variant="secondary">Active</Badge>}
                          </td>
                          <td className="py-2 px-4 text-xs text-muted-foreground">
                            {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleString() : 'Never'}
                          </td>
                          <td className="py-2 px-4">
                            {u.id !== user?.id && (u.bannedAt ? <Button variant="outline" size="sm" onClick={() => unbanMutation.mutate({ userId: u.id })}>Unban</Button> : <Button variant="destructive" size="sm" onClick={() => { setBanTarget({ id: u.id, name: u.name }); setBanReason(''); }}>Ban</Button>)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {usersQuery.isLoading && <p className="text-sm text-muted-foreground">Loading users…</p>}
              </CardContent>
            </Card>
            <Dialog open={!!banTarget} onOpenChange={(open) => !open && setBanTarget(null)}>
              <DialogContent>
                <DialogHeader><DialogTitle>Ban {banTarget?.name || 'user'}</DialogTitle><DialogDescription>This immediately blocks the account from making authenticated requests.</DialogDescription></DialogHeader>
                <Textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Reason for suspension" maxLength={500} />
                <DialogFooter><Button variant="outline" onClick={() => setBanTarget(null)}>Cancel</Button><Button variant="destructive" disabled={!banReason.trim() || banMutation.isPending} onClick={() => banTarget && banMutation.mutate({ userId: banTarget.id, reason: banReason.trim() })}>Confirm Ban</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Analytics</CardTitle>
                <CardDescription>System performance and usage metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Projects</p>
                    <p className="text-2xl font-bold mt-1">{metrics.totalProjects}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Last Backup</p>
                    <p className="text-sm font-semibold mt-1">{metrics.lastBackup.toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monitored Sources</CardTitle>
                <CardDescription>Configured compliance sources. This view does not show run status.</CardDescription>
              </CardHeader>
              <CardContent>
                {sourcesQuery.isLoading && <p className="text-sm text-muted-foreground">Loading sources…</p>}
                {sourcesQuery.isError && <p role="alert" className="text-sm text-destructive">Unable to load monitored sources.</p>}
                {sourcesQuery.data && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th scope="col" className="py-2 px-4 text-left">Source ID</th>
                          <th scope="col" className="py-2 px-4 text-left">Jurisdiction</th>
                          <th scope="col" className="py-2 px-4 text-left">Review</th>
                          <th scope="col" className="py-2 px-4 text-left">Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sourcesQuery.data.map((source) => (
                          <tr key={source.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-4 font-medium">{source.id}</td>
                            <td className="py-2 px-4">{source.jurisdiction}</td>
                            <td className="py-2 px-4">
                              {'manualOnly' in source && source.manualOnly && <Badge variant="outline">Manual review required</Badge>}
                            </td>
                            <td className="py-2 px-4">
                              <Button asChild variant="outline" size="sm">
                                <a href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`Open source ${source.id}`}>Open source</a>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">System Maintenance</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleExportLogs}
                      disabled={isExportingLogs}
                      className="w-full"
                    >
                      {isExportingLogs ? "Exporting..." : "Export System Logs"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleViewAuditTrail}
                      disabled={isViewingAudit}
                      className="w-full"
                    >
                      {isViewingAudit ? "Loading..." : "View Audit Trail"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
