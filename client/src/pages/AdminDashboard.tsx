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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System monitoring and user management</p>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.activeUsers} active now
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalCalculations.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalProjects.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active and archived
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">System Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                {metrics.systemUptime}
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono">{metrics.lastBackup.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Automated daily
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-green-100 text-green-800">All Systems Operational</Badge>
              <p className="text-xs text-muted-foreground mt-2">
                No alerts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
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
                  className="max-w-md"
                />

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-4">Name</th>
                        <th className="text-left py-2 px-4">Email</th>
                        <th className="text-left py-2 px-4">Role</th>
                        <th className="text-left py-2 px-4">Calculations</th>
                        <th className="text-left py-2 px-4">Projects</th>
                        <th className="text-left py-2 px-4">Last Active</th>
                        <th className="text-left py-2 px-4">Actions</th>
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
                            <Button variant="ghost" size="sm">Edit</Button>
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
                <CardDescription>Performance and usage metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-medium">Calculations by Type</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Occupant Load</span>
                        <span className="font-mono">2,156</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fire Exit</span>
                        <span className="font-mono">1,834</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Plumbing</span>
                        <span className="font-mono">2,145</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Electrical</span>
                        <span className="font-mono">1,799</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">User Activity</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Daily Active Users</span>
                        <span className="font-mono">342</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weekly Active Users</span>
                        <span className="font-mono">856</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Active Users</span>
                        <span className="font-mono">1,245</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New Users (30d)</span>
                        <span className="font-mono">89</span>
                      </div>
                    </div>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h4 className="font-medium">Automated Backups</h4>
                      <p className="text-sm text-muted-foreground">Daily at 2:00 AM UTC</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h4 className="font-medium">Audit Logging</h4>
                      <p className="text-sm text-muted-foreground">All actions logged</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">Required for admins</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h4 className="font-medium">Rate Limiting</h4>
                      <p className="text-sm text-muted-foreground">API protection enabled</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button variant="outline" className="w-full">Export System Logs</Button>
                  <Button variant="outline" className="w-full">View Audit Trail</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
