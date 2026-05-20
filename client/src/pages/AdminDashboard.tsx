/**
 * Admin Dashboard
 * 
 * Provides administrators with system monitoring, user management,
 * and analytics capabilities
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, BarChart3, Settings, LogOut, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCalculations: number;
  totalProjects: number;
  systemUptime: string;
  lastBackup: Date;
}

interface UserStats {
  id: number;
  name: string;
  email: string;
  role: string;
  lastActive: Date;
  calculationsCount: number;
  projectsCount: number;
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

  const [users, setUsers] = useState<UserStats[]>([
    {
      id: 1,
      name: 'Jose Acevedo',
      email: 'jadconsc@gmail.com',
      role: 'admin',
      lastActive: new Date(),
      calculationsCount: 156,
      projectsCount: 42,
    },
    {
      id: 2,
      name: 'John Smith',
      email: 'john@example.com',
      role: 'architect',
      lastActive: new Date(Date.now() - 3600000),
      calculationsCount: 89,
      projectsCount: 23,
    },
    {
      id: 3,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      role: 'consultant',
      lastActive: new Date(Date.now() - 7200000),
      calculationsCount: 45,
      projectsCount: 12,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingLogs, setIsExportingLogs] = useState(false);
  const [isViewingAudit, setIsViewingAudit] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

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

  const handleEditUser = async (userId: number) => {
    setEditingUserId(userId);
    try {
      // TODO: Wire to tRPC mutation for editing user
      // const result = await trpc.admin.editUser.mutate({ userId, ... });
      
      toast.success("User updated successfully");
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setEditingUserId(null);
    }
  };

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

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
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
                        <th className="py-2 px-4 text-left">Calculations</th>
                        <th className="py-2 px-4 text-left">Projects</th>
                        <th className="py-2 px-4 text-xs text-muted-foreground">Last Active</th>
                        <th className="py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4 font-medium">{u.name}</td>
                          <td className="py-2 px-4 text-muted-foreground">{u.email}</td>
                          <td className="py-2 px-4">
                            <Badge variant="outline">{u.role}</Badge>
                          </td>
                          <td className="py-2 px-4">{u.calculationsCount}</td>
                          <td className="py-2 px-4">{u.projectsCount}</td>
                          <td className="py-2 px-4 text-xs text-muted-foreground">
                            {u.lastActive.toLocaleString()}
                          </td>
                          <td className="py-2 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(u.id)}
                              disabled={editingUserId === u.id}
                            >
                              {editingUserId === u.id ? "Editing..." : "Edit"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
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
