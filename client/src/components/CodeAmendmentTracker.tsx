import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { codeAmendments, CodeAmendment } from '@/lib/codeAmendmentsData';
import { FileText, AlertCircle, TrendingUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToExcel } from '@/lib/excelExport';

interface CodeAmendmentTrackerProps {
  occupancyCode?: string; // Optional: filter by occupancy
}

export function CodeAmendmentTracker({ occupancyCode }: CodeAmendmentTrackerProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');

  // Filter amendments
  let filteredAmendments = codeAmendments;

  if (occupancyCode) {
    filteredAmendments = filteredAmendments.filter(amendment =>
      amendment.occupancies.some(occ => occupancyCode.startsWith(occ))
    );
  }

  if (categoryFilter !== 'all') {
    filteredAmendments = filteredAmendments.filter(
      amendment => amendment.category === categoryFilter
    );
  }

  if (impactFilter !== 'all') {
    filteredAmendments = filteredAmendments.filter(
      amendment => amendment.impact === impactFilter
    );
  }

  const getImpactColor = (impact: CodeAmendment['impact']) => {
    switch (impact) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getCategoryIcon = (category: CodeAmendment['category']) => {
    switch (category) {
      case 'Fire Safety':
        return '🔥';
      case 'Structural':
        return '🏗️';
      case 'Accessibility':
        return '♿';
      case 'Energy':
        return '⚡';
      case 'Plumbing':
        return '💧';
      case 'Electrical':
        return '🔌';
      case 'General':
        return '📋';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Code Amendment Tracker</h3>
        <Button
          onClick={() => {
            const data: any[][] = [];
            data.push(['Code Amendment Tracker (NBC 2019 → 2023)']);
            data.push([]);
            data.push(['Category', 'Section', 'Title', 'Impact', 'NBC 2019', 'NBC 2023', 'Affected Occupancies']);
            filteredAmendments.forEach(amendment => {
              data.push([
                amendment.category,
                amendment.section,
                amendment.title,
                amendment.impact,
                amendment.nbc2019,
                amendment.nbc2023,
                amendment.occupancies.join(', ')
              ]);
            });
            console.log("Export functionality handled by specific export functions");
          }}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
            Category
          </label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="rounded-none border-border">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Fire Safety">Fire Safety</SelectItem>
              <SelectItem value="Structural">Structural</SelectItem>
              <SelectItem value="Accessibility">Accessibility</SelectItem>
              <SelectItem value="Energy">Energy</SelectItem>
              <SelectItem value="Plumbing">Plumbing</SelectItem>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="General">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
            Impact Level
          </label>
          <Select value={impactFilter} onValueChange={setImpactFilter}>
            <SelectTrigger className="rounded-none border-border">
              <SelectValue placeholder="All Impact Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Impact Levels</SelectItem>
              <SelectItem value="High">High Impact</SelectItem>
              <SelectItem value="Medium">Medium Impact</SelectItem>
              <SelectItem value="Low">Low Impact</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-none border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Changes</p>
                <p className="text-2xl font-bold">{filteredAmendments.length}</p>
              </div>
              <FileText className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">High Impact</p>
                <p className="text-2xl font-bold text-destructive">
                  {filteredAmendments.filter(a => a.impact === 'High').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Categories</p>
                <p className="text-2xl font-bold">
                  {new Set(filteredAmendments.map(a => a.category)).size}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Amendments List */}
      <div className="space-y-4">
        {filteredAmendments.length === 0 ? (
          <Card className="rounded-none border-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              No amendments found matching the selected filters.
            </CardContent>
          </Card>
        ) : (
          filteredAmendments.map(amendment => (
            <Card key={amendment.id} className="rounded-none border-border hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{getCategoryIcon(amendment.category)}</span>
                      <Badge variant="outline" className="text-[10px] font-mono border-border">
                        {amendment.section}
                      </Badge>
                      <Badge className={getImpactColor(amendment.impact)}>
                        {amendment.impact} Impact
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold">{amendment.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {amendment.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs font-bold text-red-900 mb-1 uppercase tracking-wider">
                      NBC 2019
                    </p>
                    <p className="text-sm text-red-800">{amendment.nbc2019}</p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs font-bold text-green-900 mb-1 uppercase tracking-wider">
                      NBC 2023
                    </p>
                    <p className="text-sm text-green-800">{amendment.nbc2023}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                    Affected Occupancies
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {amendment.occupancies.map(occ => (
                      <Badge key={occ} variant="secondary" className="text-xs">
                        {occ}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
