import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { occupancyData, OccupancyGroup } from '@/lib/occupancyData';
import { getLoadFactors } from '@/lib/loadCalculationData';
import { constructionLimits } from '@/lib/constructionData';
import { ArrowLeftRight, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportComparisonToExcel } from '@/lib/excelExport';

export function OccupancyComparison() {
  const [leftOccupancy, setLeftOccupancy] = useState<string>('C');
  const [rightOccupancy, setRightOccupancy] = useState<string>('D');

  const leftGroup = occupancyData.find(o => o.code === leftOccupancy);
  const rightGroup = occupancyData.find(o => o.code === rightOccupancy);

  const leftLoadFactors = getLoadFactors(leftOccupancy);
  const rightLoadFactors = getLoadFactors(rightOccupancy);

  const leftConstructionLimits = constructionLimits[leftOccupancy] || [];
  const rightConstructionLimits = constructionLimits[rightOccupancy] || [];

  if (!leftGroup || !rightGroup) return null;

  const renderDifferenceBadge = (leftValue: string | number, rightValue: string | number) => {
    if (leftValue === rightValue) return null;
    return <Badge variant="outline" className="ml-2 text-[10px]">DIFF</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5" />
          Occupancy Comparison
        </h3>
        <Button
          onClick={() => {
            exportComparisonToExcel({
              items: []
            });
          }}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </Button>
      </div>

      {/* Selector Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-muted-foreground">Compare:</span>
              <Select value={leftOccupancy} onValueChange={setLeftOccupancy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {occupancyData.map(occ => (
                    <SelectItem key={occ.id} value={occ.code}>
                      {occ.code} - {occ.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-muted-foreground">With:</span>
              <Select value={rightOccupancy} onValueChange={setRightOccupancy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {occupancyData.map(occ => (
                    <SelectItem key={occ.id} value={occ.code}>
                      {occ.code} - {occ.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Basic Info Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{leftGroup.code} - {leftGroup.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{leftGroup.description}</p>
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Examples</h4>
              <div className="flex flex-wrap gap-1">
                {leftGroup.examples.slice(0, 5).map((ex, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{ex}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{rightGroup.code} - {rightGroup.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{rightGroup.description}</p>
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Examples</h4>
              <div className="flex flex-wrap gap-1">
                {rightGroup.examples.slice(0, 5).map((ex, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{ex}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Load Factors Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Load Calculation Factors Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Load Type</TableHead>
                <TableHead>{leftGroup.code}</TableHead>
                <TableHead>{rightGroup.code}</TableHead>
                <TableHead>Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Live Load</TableCell>
                <TableCell>{leftLoadFactors?.liveLoad || 'N/A'}</TableCell>
                <TableCell>{rightLoadFactors?.liveLoad || 'N/A'}</TableCell>
                <TableCell>
                  {leftLoadFactors?.liveLoad === rightLoadFactors?.liveLoad ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Same</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Different</Badge>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Dead Load</TableCell>
                <TableCell>{leftLoadFactors?.deadLoad || 'N/A'}</TableCell>
                <TableCell>{rightLoadFactors?.deadLoad || 'N/A'}</TableCell>
                <TableCell>
                  {leftLoadFactors?.deadLoad === rightLoadFactors?.deadLoad ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Same</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Different</Badge>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Snow Load</TableCell>
                <TableCell>{leftLoadFactors?.snowLoad || 'N/A'}</TableCell>
                <TableCell>{rightLoadFactors?.snowLoad || 'N/A'}</TableCell>
                <TableCell>
                  {leftLoadFactors?.snowLoad === rightLoadFactors?.snowLoad ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Same</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Different</Badge>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Construction Limits Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Construction Limits - {leftGroup.code}</CardTitle>
          </CardHeader>
          <CardContent>
            {leftConstructionLimits.length > 0 ? (
              <div className="space-y-2">
                {leftConstructionLimits.slice(0, 3).map((limit: any, i: number) => (
                  <div key={i} className="text-xs p-2 border border-border rounded">
                    <div className="font-semibold">{limit.article}</div>
                    <div className="text-muted-foreground">
                      Max Height: {limit.maxHeight} | Max Area: {limit.maxArea}
                    </div>
                    <div className="text-muted-foreground">
                      Sprinklers: {limit.sprinklers} | Type: {limit.constructionType.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No specific construction limits data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Construction Limits - {rightGroup.code}</CardTitle>
          </CardHeader>
          <CardContent>
            {rightConstructionLimits.length > 0 ? (
              <div className="space-y-2">
                {rightConstructionLimits.slice(0, 3).map((limit: any, i: number) => (
                  <div key={i} className="text-xs p-2 border border-border rounded">
                    <div className="font-semibold">{limit.article}</div>
                    <div className="text-muted-foreground">
                      Max Height: {limit.maxHeight} | Max Area: {limit.maxArea}
                    </div>
                    <div className="text-muted-foreground">
                      Sprinklers: {limit.sprinklers} | Type: {limit.constructionType.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No specific construction limits data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Differences Alert */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
            <AlertCircle className="w-4 h-4" />
            Key Differences Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-xs space-y-1 text-orange-900">
            {leftLoadFactors?.liveLoad !== rightLoadFactors?.liveLoad && (
              <li>• Live load requirements differ between occupancies</li>
            )}
            {leftConstructionLimits.length !== rightConstructionLimits.length && (
              <li>• Different number of construction limit scenarios apply</li>
            )}
            {leftGroup.division !== rightGroup.division && (
              <li>• Occupancies belong to different divisions ({leftGroup.division} vs {rightGroup.division})</li>
            )}
            {leftLoadFactors?.liveLoad === rightLoadFactors?.liveLoad && 
             leftLoadFactors?.deadLoad === rightLoadFactors?.deadLoad && 
             leftLoadFactors?.snowLoad === rightLoadFactors?.snowLoad && (
              <li>• All load factors are identical between these occupancies</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
