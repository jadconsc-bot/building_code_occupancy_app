/**
 * Project Analytics Page
 * 
 * Displays all calculations and verified compliance data for a specific project
 * Shows calculation history, compliance status, and verified results
 * 
 * Data Sources:
 * - calculationResults table: All calculations with cryptographic signatures
 * - complianceAuditLog table: Compliance analysis with verified status
 * - projects table: Project information
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  Calendar,
  User,
  FileText,
  BarChart3,
  Clock,
  Shield,
  ArrowLeft,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectAnalytics() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [selectedCalculation, setSelectedCalculation] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch calculation details when modal opens
  const { data: calculationDetails, isLoading: detailsLoading } = trpc.analytics.getCalculationDetails.useQuery(
    { calculationId: selectedCalculation?.id || '', projectId: projectId || 0 },
    { enabled: isDetailsOpen && !!selectedCalculation && !!projectId }
  );

  // Fetch all projects for selector
  const { data: projects = [] } = trpc.projects.list.useQuery();

  // Get project ID from URL or use first project
  useEffect(() => {
    if (user?.id && !projectId) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('projectId');
      if (id) {
        setProjectId(parseInt(id));
      } else if (projects.length > 0) {
        setProjectId(projects[0].id);
      } else {
        setProjectId(1);
      }
    }
  }, [user, projectId, projects]);

  const handleProjectChange = (newProjectId: string) => {
    const id = parseInt(newProjectId);
    setProjectId(id);
    window.history.pushState({}, '', `?projectId=${id}`);
  };

  const handleViewCalculationDetails = (calc: any) => {
    setSelectedCalculation(calc);
    setIsDetailsOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailsOpen(false);
    setSelectedCalculation(null);
  };

  // Fetch project analytics data using tRPC
  const { data: analyticsData, isLoading, error } = trpc.analytics.getProjectAnalytics.useQuery(
    { projectId: projectId || 1 },
    { enabled: !!projectId && isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to view project analytics
          </p>
          <Button onClick={() => navigate('/')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !analyticsData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Error Loading Project Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800">
                {error?.message || 'Failed to load project analytics. Please try again.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { project, calculations, compliance, stats } = analyticsData;

  // Filter calculations
  const filteredCalculations = calculations.filter(calc => {
    const matchesType = filterType === 'all' || calc.type === filterType;
    const matchesStatus = filterStatus === 'all' || calc.complianceStatus === filterStatus;
    const matchesSearch = searchQuery === '' || 
      calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      calc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const handleExportPDF = () => {
    try {
      const markdownContent = generateMarkdownReport();
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name}-analytics-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Report downloaded as Markdown');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const handleExportCSV = () => {
    try {
      const csvContent = generateCSVContent();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name}-calculations-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Calculations exported as CSV');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const generateMarkdownReport = () => {
    const lines: string[] = [];
    lines.push('# Project Analytics Report');
    lines.push(`## ${project.name}`);
    lines.push(`**Address:** ${project.address || 'N/A'}`);
    lines.push(`**Occupancy Code:** ${project.occupancyCode}`);
    lines.push(`**Generated:** ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('## Summary Statistics');
    lines.push(`- **Total Calculations:** ${stats.total}`);
    lines.push(`- **Verified:** ${stats.verified}`);
    lines.push(`- **Compliant:** ${stats.compliant}`);
    lines.push(`- **Non-Compliant:** ${stats.nonCompliant}`);
    lines.push(`- **Pending:** ${stats.pending}`);
    lines.push('');
    lines.push('## Calculations');
    lines.push('| Name | Type | Result | Status | Verified | Date |');
    lines.push('|------|------|--------|--------|----------|------|');
    calculations.forEach(calc => {
      lines.push(`| ${calc.name} | ${calc.type} | ${calc.result.value} ${calc.result.unit} | ${calc.complianceStatus} | ${calc.verified ? 'Yes' : 'No'} | ${new Date(calc.createdAt).toLocaleDateString()} |`);
    });
    return lines.join('\n');
  };

  const generateCSVContent = () => {
    const headers = ['ID', 'Name', 'Type', 'Result Value', 'Result Unit', 'Status', 'Verified', 'Date'];
    const rows: string[] = [headers.map(h => `"${h}"`).join(',')];
    calculations.forEach(calc => {
      rows.push([
        calc.id,
        `"${calc.name}"`,
        calc.type,
        calc.result.value,
        calc.result.unit,
        calc.complianceStatus,
        calc.verified ? 'Yes' : 'No',
        new Date(calc.createdAt).toISOString(),
      ].join(','));
    });
    return rows.join('\n');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-100 text-green-800">✓ Compliant</Badge>;
      case 'non-compliant':
        return <Badge className="bg-red-100 text-red-800">✗ Non-Compliant</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getVerificationBadge = (verified: boolean) => {
    return verified ? (
      <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
        <Shield className="w-3 h-3" /> Verified
      </Badge>
    ) : (
      <Badge variant="outline">Unverified</Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {projects.length > 1 && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-muted-foreground">Select Project:</label>
                  <Select value={projectId?.toString() || ''} onValueChange={handleProjectChange}>
                    <SelectTrigger className="w-full max-w-xs mt-1">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((proj: any) => (
                        <SelectItem key={proj.id} value={proj.id.toString()}>
                          {proj.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
              <p className="text-muted-foreground">{project.address}</p>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="text-muted-foreground">
                  <strong>Occupancy:</strong> {project.occupancyCode} - {project.occupancyName}
                </span>
                        <span className="text-muted-foreground">
                          <strong>Last Updated:</strong> {project.lastModified ? new Date(project.lastModified).toLocaleDateString() : 'N/A'}
                        </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Calculations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All calculations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.verified}</div>
              <p className="text-xs text-muted-foreground mt-1">Cryptographically signed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.compliant}</div>
              <p className="text-xs text-muted-foreground mt-1">Code compliant</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Non-Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.nonCompliant}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires revision</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="calculations" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Calculations
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Compliance Status
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Summary</CardTitle>
                <CardDescription>
                  Overview of all calculations and compliance status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Compliance Overview</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Compliant Calculations</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${stats.total > 0 ? (stats.compliant / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Non-Compliant Calculations</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500" 
                            style={{ width: `${stats.total > 0 ? (stats.nonCompliant / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {stats.total > 0 ? Math.round((stats.nonCompliant / stats.total) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pending Verification</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-500" 
                            style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3">Verification Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{stats.verified}</div>
                      <p className="text-sm text-blue-700">Cryptographically Verified</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-600">
                        {stats.total - stats.verified}
                      </div>
                      <p className="text-sm text-gray-700">Pending Verification</p>
                    </div>
                  </div>
                </div>

                {compliance && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-3">Latest Compliance Audit</h3>
                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-indigo-700"><strong>Status:</strong> {compliance.status}</p>
                          <p className="text-sm text-indigo-700"><strong>Compliance:</strong> {compliance.percentage}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-indigo-700"><strong>Rules Passed:</strong> {compliance.rulesPassed}/{compliance.rulesEvaluated}</p>
                          <p className="text-sm text-indigo-700"><strong>Date:</strong> {compliance.timestamp ? new Date(compliance.timestamp).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calculations Tab */}
          <TabsContent value="calculations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calculation Details</CardTitle>
                <CardDescription>
                  All calculations performed on this project with verification status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    placeholder="Search calculations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Array.from(new Set(calculations.map((c) => c.type))).map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="compliant">Compliant</SelectItem>
                      <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setFilterType('all');
                      setFilterStatus('all');
                      setSearchQuery('');
                    }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Calculation Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCalculations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No calculations found matching your filters
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCalculations.map((calc) => (
                          <TableRow 
                            key={calc.id} 
                            className="hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleViewCalculationDetails(calc)}
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium">{calc.name}</p>
                                <p className="text-xs text-muted-foreground">{calc.description}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{calc.type}</TableCell>
                            <TableCell className="text-sm">
                              <div className="font-mono">
                                {calc.result.value} {calc.result.unit}
                              </div>
                              {calc.result.notes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {calc.result.notes}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(calc.complianceStatus)}
                            </TableCell>
                            <TableCell>
                              {getVerificationBadge(calc.verified)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {calc.createdAt ? new Date(calc.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <p className="text-xs text-muted-foreground">
                  Showing {filteredCalculations.length} of {calculations.length} calculations
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Analysis</CardTitle>
                <CardDescription>
                  Detailed compliance status for each calculation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {calculations.map((calc) => (
                  <div 
                    key={calc.id}
                    className={`p-4 border rounded-lg ${
                      (calc.complianceStatus as any) === 'compliant' 
                        ? 'bg-green-50 border-green-200'
                        : (calc.complianceStatus as any) === 'non-compliant'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {calc.complianceStatus === 'compliant' && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                          {(calc.complianceStatus as any) === 'non-compliant' && (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          {(calc.complianceStatus as any) === 'pending' && (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          )}
                          <h3 className="font-semibold">{calc.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{calc.description}</p>
                        <div className="text-sm space-y-1">
                          <p><strong>Result:</strong> {calc.result.value} {calc.result.unit}</p>
                          {calc.result.notes && (
                            <p><strong>Notes:</strong> {calc.result.notes}</p>
                          )}
                          <p><strong>Created:</strong> {calc.createdAt ? new Date(calc.createdAt).toLocaleString() : 'N/A'}</p>
                          <p><strong>By:</strong> {calc.createdBy}</p>
                          {calc.signature && (
                            <p><strong>Signature:</strong> {calc.signature}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {getStatusBadge(calc.complianceStatus)}
                        {getVerificationBadge(calc.verified)}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Calculation Details Modal */}
        {isDetailsOpen && selectedCalculation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 border-b">
                <div>
                  <CardTitle>Calculation Details</CardTitle>
                  <CardDescription>{selectedCalculation.type}</CardDescription>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {detailsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : calculationDetails ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Calculation Name</p>
                        <p className="text-base font-semibold">{calculationDetails.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Type</p>
                        <p className="text-base font-semibold">{calculationDetails.type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Created By</p>
                        <p className="text-base font-semibold">{calculationDetails.createdBy}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                        <p className="text-base font-semibold">
                          {calculationDetails.createdAt ? new Date(calculationDetails.createdAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Verification Status</p>
                      <div className="flex items-center gap-2">
                        {calculationDetails.verified ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-green-600">Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            <span className="font-semibold text-yellow-600">Pending Verification</span>
                          </>
                        )}
                      </div>
                      {calculationDetails.signature && (
                        <p className="text-xs text-muted-foreground mt-2 break-all font-mono">
                          Signature: {calculationDetails.signature.substring(0, 50)}...
                        </p>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Result Data</p>
                      <div className="bg-muted p-3 rounded-lg font-mono text-sm overflow-x-auto">
                        <pre>{JSON.stringify(calculationDetails.resultData, null, 2)}</pre>
                      </div>
                    </div>

                    {calculationDetails.calculationTrace && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Calculation Trace</p>
                        <div className="bg-muted p-3 rounded-lg font-mono text-sm overflow-x-auto max-h-40">
                          <pre>{calculationDetails.calculationTrace}</pre>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Failed to load calculation details
                  </div>
                )}
              </CardContent>
              <div className="border-t p-4 flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseModal}>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
