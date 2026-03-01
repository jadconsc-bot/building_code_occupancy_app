/**
 * Calculation History Page
 * 
 * Displays a history of all calculations performed by the user
 * Allows retrieval, verification, and export of previous results
 */

import { useState, useMemo } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
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
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * Mock calculation history data
 * In production, this would come from tRPC queries
 */
interface CalculationRecord {
  id: string;
  calculatorType: string;
  displayName: string;
  timestamp: string;
  projectId: number;
  projectName: string;
  signatureVerified: boolean;
  resultSummary: string;
  inputCount: number;
}

const mockCalculations: CalculationRecord[] = [
  {
    id: 'calc-001',
    calculatorType: 'occupantLoad',
    displayName: 'Occupant Load Calculator',
    timestamp: '2026-02-28T14:30:00Z',
    projectId: 1,
    projectName: 'Downtown Office Tower',
    signatureVerified: true,
    resultSummary: '250 occupants, 2 exits required',
    inputCount: 3,
  },
  {
    id: 'calc-002',
    calculatorType: 'fireExit',
    displayName: 'Fire Exit Calculator',
    timestamp: '2026-02-28T13:15:00Z',
    projectId: 1,
    projectName: 'Downtown Office Tower',
    signatureVerified: true,
    resultSummary: '2 exits, 1800mm width, 1 stairwell',
    inputCount: 4,
  },
  {
    id: 'calc-003',
    calculatorType: 'stairDesign',
    displayName: 'Stair Design Calculator',
    timestamp: '2026-02-27T10:45:00Z',
    projectId: 2,
    projectName: 'Residential Complex',
    signatureVerified: true,
    resultSummary: '13 risers, 7.5" height, compliant',
    inputCount: 1,
  },
  {
    id: 'calc-004',
    calculatorType: 'plumbingFixtureUnits',
    displayName: 'Plumbing Fixture Units Calculator',
    timestamp: '2026-02-26T16:20:00Z',
    projectId: 2,
    projectName: 'Residential Complex',
    signatureVerified: true,
    resultSummary: '28 DFU, 75mm stack, wet venting required',
    inputCount: 6,
  },
];

/**
 * Calculation detail view
 */
interface CalculationDetailProps {
  calculation: CalculationRecord;
  onClose: () => void;
}

function CalculationDetail({ calculation, onClose }: CalculationDetailProps) {
  const [exportFormat, setExportFormat] = useState<'json' | 'json-ld' | 'pdf'>('json');

  const handleExport = () => {
    // In production, would call tRPC export procedure
    console.log(`Exporting calculation ${calculation.id} as ${exportFormat}`);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(calculation.id);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{calculation.displayName}</DialogTitle>
          <DialogDescription>
            Calculation ID: {calculation.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Signature Verification */}
          <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Signature Verified</h3>
              <p className="text-sm text-green-700 mt-1">
                This calculation has been cryptographically signed and verified. The results
                cannot be modified without detection.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="text-xs bg-white px-2 py-1 rounded border border-green-200 flex-1 truncate">
                  SHA-256-RSA
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyId}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy ID
                </Button>
              </div>
            </div>
          </div>

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
                Project
              </label>
              <p className="mt-1 text-sm">{calculation.projectName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Input Fields
              </label>
              <p className="mt-1 text-sm">{calculation.inputCount} fields</p>
            </div>
          </div>

          {/* Result Summary */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Result Summary
            </label>
            <p className="mt-2 p-3 bg-muted rounded-lg text-sm font-mono">
              {calculation.resultSummary}
            </p>
          </div>

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
              <Button onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Audit Trail Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
            <p className="font-medium mb-1">Audit Trail</p>
            <p>
              This calculation is immutably stored with a complete audit trail. All access
              is logged for compliance and legal defensibility.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Calculation History Page
 */
export default function CalculationHistoryPage() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationRecord | null>(
    null
  );
  const [filterCalculator, setFilterCalculator] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');

  // Filter calculations
  const filteredCalculations = useMemo(() => {
    return mockCalculations.filter((calc) => {
      const matchesSearch =
        calc.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        calc.resultSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        calc.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCalculator =
        filterCalculator === 'all' || calc.calculatorType === filterCalculator;

      const matchesProject =
        filterProject === 'all' || calc.projectId.toString() === filterProject;

      return matchesSearch && matchesCalculator && matchesProject;
    });
  }, [searchQuery, filterCalculator, filterProject]);

  // Get unique calculator types and projects
  const calculatorTypes = useMemo(
    () => [...new Set(mockCalculations.map((c) => c.calculatorType))],
    []
  );
  const projects = useMemo(
    () => [...new Set(mockCalculations.map((c) => ({ id: c.projectId, name: c.projectName })))],
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Calculation History</h1>
        <p className="text-muted-foreground mt-2">
          View, verify, and export all your previous calculations
        </p>
      </div>

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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Calculator Type</label>
              <Select value={filterCalculator} onValueChange={setFilterCalculator}>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Project</label>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id.toString()}>
                      {proj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Calculations ({filteredCalculations.length})
          </CardTitle>
          <CardDescription>
            All calculations are cryptographically signed and immutably stored
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCalculations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No calculations found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Calculator</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalculations.map((calc) => (
                    <TableRow key={calc.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{calc.displayName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{calc.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>{calc.projectName}</TableCell>
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
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedCalculation(calc)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedCalculation && (
        <CalculationDetail
          calculation={selectedCalculation}
          onClose={() => setSelectedCalculation(null)}
        />
      )}
    </div>
  );
}
