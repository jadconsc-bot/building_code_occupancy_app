/**
 * Rule Management Access Component
 * 
 * Provides easy access to rule management features from the Dashboard
 * Shows pending rule changes, allows rule editors to submit changes
 * Displays admin approval dashboard for rule change requests
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2, Clock, FileText, Shield, Zap } from 'lucide-react';
import { Link } from 'wouter';

interface PendingRuleChange {
  id: string;
  title: string;
  description: string;
  submittedBy: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  affectedCalculators: string[];
}

interface RuleManagementAccessProps {
  userRole?: 'admin' | 'editor' | 'user';
}

export function RuleManagementAccess({ userRole = 'user' }: RuleManagementAccessProps) {
  const [pendingChanges] = useState<PendingRuleChange[]>([
    {
      id: 'rule-001',
      title: 'Update Occupant Load Calculation',
      description: 'Adjust occupant load factors for assembly occupancies per NBC 2025',
      submittedBy: 'John Smith',
      submittedDate: '2026-02-28',
      status: 'pending',
      affectedCalculators: ['Occupant Load', 'Fire Exit', 'Egress Width'],
    },
    {
      id: 'rule-002',
      title: 'Stair Design Requirements',
      description: 'Update minimum stair width requirements for residential buildings',
      submittedBy: 'Jane Doe',
      submittedDate: '2026-02-25',
      status: 'approved',
      affectedCalculators: ['Stair Design', 'Handrail Spacing'],
    },
  ]);

  const pendingCount = pendingChanges.filter(c => c.status === 'pending').length;
  const approvedCount = pendingChanges.filter(c => c.status === 'approved').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="rounded-none border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Rule Management & Governance
            </CardTitle>
            <CardDescription>
              Track rule changes, approve updates, and maintain compliance standards
            </CardDescription>
          </div>
          {userRole === 'admin' && pendingCount > 0 && (
            <Badge className="bg-red-600 text-white">{pendingCount} Pending</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 overflow-y-auto max-h-[400px]">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pending">Pending Changes</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-xs text-yellow-800 font-semibold uppercase tracking-wider">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">{pendingCount}</p>
                <p className="text-xs text-yellow-700 mt-2">Awaiting admin approval</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs text-green-800 font-semibold uppercase tracking-wider">Approved</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{approvedCount}</p>
                <p className="text-xs text-green-700 mt-2">Active in system</p>
              </div>
            </div>

            <div className="space-y-3">
              {userRole === 'editor' && (
                <Link href="/rule-management">
                  <Button className="w-full rounded-none" variant="outline">
                    <Zap className="w-4 h-4 mr-2" />
                    Submit Rule Change
                  </Button>
                </Link>
              )}

              {userRole === 'admin' && (
                <Link href="/rule-management">
                  <Button className="w-full rounded-none">
                    <FileText className="w-4 h-4 mr-2" />
                    Review & Approve Changes
                  </Button>
                </Link>
              )}

              <Link href="/rule-management">
                <Button className="w-full rounded-none" variant="outline">
                  <Shield className="w-4 h-4 mr-2" />
                  View Full Rule Management
                </Button>
              </Link>
            </div>
          </TabsContent>

          {/* Pending Changes Tab */}
          <TabsContent value="pending" className="space-y-3 mt-4">
            {pendingChanges.filter(c => c.status === 'pending').length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p>No pending changes</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-3 pr-4">
                  {pendingChanges.filter(c => c.status === 'pending').map(change => (
                    <div key={change.id} className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getStatusIcon(change.status)}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate">{change.title}</p>
                            <p className="text-xs text-muted-foreground">By {change.submittedBy}</p>
                          </div>
                        </div>
                        {getStatusBadge(change.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{change.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {change.affectedCalculators.map(calc => (
                          <Badge key={calc} variant="secondary" className="text-xs">
                            {calc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Approved Tab */}
          <TabsContent value="approved" className="space-y-3 mt-4">
            {pendingChanges.filter(c => c.status === 'approved').length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p>No approved changes</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-3 pr-4">
                  {pendingChanges.filter(c => c.status === 'approved').map(change => (
                    <div key={change.id} className="border border-green-200 bg-green-50 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getStatusIcon(change.status)}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate text-green-900">{change.title}</p>
                            <p className="text-xs text-green-700">Approved on {change.submittedDate}</p>
                          </div>
                        </div>
                        {getStatusBadge(change.status)}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {change.affectedCalculators.map(calc => (
                          <Badge key={calc} variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                            {calc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
