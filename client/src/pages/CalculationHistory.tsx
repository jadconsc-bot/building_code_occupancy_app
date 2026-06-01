/**
 * Calculation History Page - Updated with tRPC Integration
 * 
 * Displays a history of all calculations performed by the user
 * Fetches real data from database via tRPC procedures
 * Allows retrieval, verification, and export of previous results
 */

import { useState, useMemo } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Eye,
  Search,
  Shield,
  CheckCircle2,
  AlertCircle,
  Copy,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

/**
 * Calculation detail view
 */
interface CalculationDetailProps {
  calculationId: string;
  onClose: () => void;
}

function CalculationDetail({ calculationId, onClose }: CalculationDetailProps) {
  const { data: calculation, isLoading } = trpc.calculations.getDetail.useQuery({
    calculationId,
  });

  const { data: auditLog } = trpc.calculations.getAuditLog.useQuery({
    calculationId,
  });

  const { data: verification } = trpc.calculations.verifySignature.useQuery({
    calculationId,
  });

  // TODO: Implement exportForLegal tRPC procedure
  // const exportMutation = trpc.calculations.exportForLegal.useMutation();

  const [exportFormat, setExportFormat] = useState<'json' | 'json-ld' | 'pdf'>('json');

  const handleExport = async () => {
    // TODO: Implement exportForLegal endpoint in Phase 5
    toast.info('Export feature coming soon - will be implemented in Phase 5');
    /*
    try {
      const result = await exportMutation.mutateAsync({
        calculationId,
        format: exportFormat as 'json' | 'json-ld' | 'pdf',
      });

      // Create download link
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`Export successful: Calculation exported as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export calculation');
    }
    */
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(calculationId);
    toast.success('Calculation ID copied to clipboard');
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!calculation) {
    return null;
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{calculation.displayName}</DialogTitle>
          <DialogDescription>
            Calculation ID: {calculationId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Signature Verification */}
          {verification && (
            <div
              className={`flex items-start gap-4 p-4 border rounded-lg ${
                verification.isValid
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <Shield
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  verification.isValid ? 'text-green-600' : 'text-yellow-600'
                }`}
              />
              <div className="flex-1">
                <h3
                  className={`font-semibold ${
                    verification.isValid ? 'text-green-900' : 'text-yellow-900'
                  }`}
                >
                  {verification.isValid ? 'Signature Verified' : 'Certificate Expired'}
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    verification.isValid ? 'text-green-700' : 'text-yellow-700'
                  }`}
                >
                  {verification.message}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="text-xs bg-white px-2 py-1 rounded border flex-1 truncate">
                    {verification.certificateChain}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyId}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Calculation Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Calculator Type
              </label>
              <p className="mt-1 font-mono text-sm">{calculation.calculatorType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Performed On
              </label>
              <p className="mt-1 text-sm">
                {format(new Date(calculation.timestamp), 'PPpp')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Ruleset Version
              </label>
              <p className="mt-1 text-sm">{calculation.rulesetVersion}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Input Fields
              </label>
              <p className="mt-1 text-sm">{Object.keys(calculation.inputs).length} fields</p>
            </div>
          </div>

          {/* Inputs & Results */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Inputs</label>
              <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-32">
                {JSON.stringify(calculation.inputs, null, 2)}
              </pre>
            </div>
            <div>
              <label className="text-sm font-medium">Results</label>
              <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-32">
                {JSON.stringify(calculation.results, null, 2)}
              </pre>
            </div>
          </div>

          {/* References */}
          {calculation.references && calculation.references.length > 0 && (
            <div>
              <label className="text-sm font-medium">References</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {calculation.references.map((ref: any) => (
                  <Badge key={ref} variant="outline">
                    {ref}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Export Format</label>
            <div className="flex gap-2">
              <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON (Standard)</SelectItem>
                  <SelectItem value="json-ld">JSON-LD (Semantic Web)</SelectItem>
                  <SelectItem value="pdf">PDF (Court-Ready)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleExport}
                disabled={false}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Audit Trail */}
          {auditLog && auditLog.auditLog.length > 0 && (
            <div>
              <label className="text-sm font-medium">Audit Trail</label>
              <div className="mt-2 space-y-2 max-h-40 overflow-auto">
                {auditLog.auditLog.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="p-2 bg-muted rounded text-xs"
                  >
                    <div className="font-medium">{entry.action}</div>
                    <div className="text-muted-foreground">{entry.actor}</div>
                    <div className="text-muted-foreground">
                      {format(new Date(entry.timestamp), 'PPpp')}
                    </div>
                    {entry.details && (
                      <div className="text-muted-foreground">{entry.details}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Calculation History Page
 */
export default function CalculationHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCalculation, setSelectedCalculation] = useState<string | null>(null);
  const [filterCalculator, setFilterCalculator] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [page, setPage] = useState(0);

  // Fetch calculation history
  const { data: historyData, isLoading, refetch } = trpc.calculations.getHistory.useQuery(
    {
      calculatorType: filterCalculator === 'all' ? undefined : filterCalculator,
      projectId: filterProject === 'all' ? undefined : parseInt(filterProject),
      searchQuery: searchQuery || undefined,
      limit: 50,
      offset: page * 50,
    },
    {
      enabled: !!user,
    }
  );

  // Fetch statistics
  const { data: stats } = trpc.calculations.getStats.useQuery(undefined, {
    enabled: !!user,
  });

  // Delete mutation
  const deleteMutation = trpc.calculations.delete.useMutation({
    onSuccess: () => {
      toast.success('Calculation deleted successfully');
      refetch();
    },
    onError: () => {
      toast.error('Failed to delete calculation');
    },
  });

  const handleDelete = (calculationId: string) => {
    if (confirm('Are you sure you want to delete this calculation?')) {
      deleteMutation.mutate({ calculationId });
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view calculation history</p>
        </div>
      </div>
    );
  }

  const calculatorTypes = stats
    ? Object.keys(stats.byCalculatorType)
    : [];

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Calculation History</h1>
        <p className="text-muted-foreground mt-2">
          View, verify, and export all your previous calculations
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalculations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.verifiedCalculations} verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Calculator Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.calculatorTypes}</div>
              <p className="text-xs text-muted-foreground mt-1">unique types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Last Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.lastCalculation
                  ? format(new Date(stats.lastCalculation), 'MMM d, yyyy')
                  : 'Never'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.lastCalculation
                  ? format(new Date(stats.lastCalculation), 'h:mm a')
                  : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalCalculations > 0
                  ? Math.round((stats.verifiedCalculations / stats.totalCalculations) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground mt-1">verified</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by calculator, result, or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Calculator Type</label>
              <Select value={filterCalculator} onValueChange={(v) => {
                setFilterCalculator(v);
                setPage(0);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calculators</SelectItem>
                  {calculatorTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Calculations ({historyData?.total || 0})
          </CardTitle>
          <CardDescription>
            All calculations are cryptographically signed and immutably stored
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : historyData?.calculations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No calculations found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Calculator</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData?.calculations.map((calc: any) => (
                    <TableRow key={calc.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{calc.displayName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{calc.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(calc.timestamp), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {calc.resultSummary}
                      </TableCell>
                      <TableCell>
                        {calc.signatureVerified ? (
                          <Badge variant="outline" className="gap-1 bg-green-50">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 bg-yellow-50">
                            <AlertCircle className="w-3 h-3 text-yellow-600" />
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedCalculation(calc.id)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(calc.id)}
                          disabled={deleteMutation.isPending}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {historyData && historyData.hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() => setPage(page + 1)}
                disabled={isLoading}
              >
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedCalculation && (
        <CalculationDetail
          calculationId={selectedCalculation}
          onClose={() => setSelectedCalculation(null)}
        />
      )}
    </div>
  );
}
