import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Ruler, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportSpanTableToExcel } from '@/lib/excelExport';
import { spanTables, spanTableNotes, applications, species, grades, spacings } from '@/lib/spanTablesData';

export function SpanTables() {
  const [selectedApplication, setSelectedApplication] = useState<string>('floor');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('S-P-F');
  const [selectedGrade, setSelectedGrade] = useState<string>('No. 1/No. 2');

  const filteredData = spanTables.find(
    (table) =>
      table.application === selectedApplication &&
      table.species === selectedSpecies &&
      table.grade === selectedGrade
  );

  const groupedData = filteredData?.data.reduce((acc, item) => {
    if (!acc[item.size]) {
      acc[item.size] = [];
    }
    acc[item.size].push(item);
    return acc;
  }, {} as Record<string, typeof filteredData.data>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Ruler className="w-4 h-4" /> Span Table Filters
            </CardTitle>
            <Button
              onClick={() => {
                if (filteredData) {
                  const formattedData = Object.entries(groupedData || {}).map(([size]) => ({
                    size,
                    spacing12: groupedData?.[size]?.find(d => d.spacing === 305)?.span || 0,
                    spacing16: groupedData?.[size]?.find(d => d.spacing === 406)?.span || 0,
                    spacing24: groupedData?.[size]?.find(d => d.spacing === 610)?.span || 0
                  }));
                  exportSpanTableToExcel(selectedApplication, selectedSpecies, selectedGrade, formattedData);
                }
              }}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Application</label>
            <Select value={selectedApplication} onValueChange={setSelectedApplication}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {applications.map((app) => (
                  <SelectItem key={app.value} value={app.value}>
                    {app.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Species</label>
            <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {species.map((sp) => (
                  <SelectItem key={sp.value} value={sp.value}>
                    {sp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Grade</label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade.value} value={grade.value}>
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {groupedData && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Member Size</TableHead>
                {spacings.map((spacing) => (
                  <TableHead key={spacing.value} className="font-bold text-center">
                    {spacing.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedData).map(([size, data]) => (
                <TableRow key={size}>
                  <TableCell className="font-mono font-bold text-primary">{size}</TableCell>
                  {spacings.map((spacing) => {
                    const spanData = data.find((d) => d.spacing === spacing.value);
                    const spanMeters = spanData ? (spanData.span / 1000).toFixed(2) : '-';
                    const spanFeet = spanData ? (spanData.span / 304.8).toFixed(1) : '-';
                    return (
                      <TableCell key={spacing.value} className="text-center">
                        {spanData ? (
                          <div>
                            <div className="font-mono text-sm font-bold">{spanMeters}m</div>
                            <div className="text-xs text-muted-foreground">({spanFeet}ft)</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4" /> Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {spanTableNotes.map((note, i) => (
              <li key={i} className="text-xs text-amber-900 dark:text-amber-100 flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
