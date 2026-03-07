import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getChecklistForOccupancy, getChecklistForPhase, getCriticalItems, ConstructionPhase, ChecklistItem } from '@/lib/inspectorChecklistData';
import { ClipboardList, Printer, Download, AlertCircle } from 'lucide-react';

interface InspectorChecklistGeneratorProps {
  occupancyCode: string;
  occupancyName: string;
}

export function InspectorChecklistGenerator({ occupancyCode, occupancyName }: InspectorChecklistGeneratorProps) {
  const [selectedPhase, setSelectedPhase] = useState<ConstructionPhase>('Foundation');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);

  const allChecklists = getChecklistForOccupancy(occupancyCode);
  const currentPhaseItems = getChecklistForPhase(occupancyCode, selectedPhase);
  const criticalItems = getCriticalItems(occupancyCode);

  const handleCheckItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Trigger browser print dialog with "Save as PDF" option
    window.print();
  };

  const completionPercentage = currentPhaseItems.length > 0
    ? Math.round((currentPhaseItems.filter(item => checkedItems.has(item.id)).length / currentPhaseItems.length) * 100)
    : 0;

  const criticalItemsCount = currentPhaseItems.filter(item => item.critical).length;
  const criticalItemsChecked = currentPhaseItems.filter(item => item.critical && checkedItems.has(item.id)).length;

  return (
    <div className="space-y-6">
      {/* Controls - Hidden when printing */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Construction Phase
            </label>
            <Select value={selectedPhase} onValueChange={(value) => setSelectedPhase(value as ConstructionPhase)}>
              <SelectTrigger className="rounded-none border-border">
                <SelectValue placeholder="Select Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Foundation">Foundation</SelectItem>
                <SelectItem value="Framing">Framing</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
                <SelectItem value="Insulation & Vapour Barrier">Insulation & Vapour Barrier</SelectItem>
                <SelectItem value="Drywall">Drywall</SelectItem>
                <SelectItem value="Final">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" className="rounded-none">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" className="rounded-none">
              <Download className="w-4 h-4 mr-2" />
              Save PDF
            </Button>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-none border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Completion</p>
                  <p className="text-2xl font-bold">{completionPercentage}%</p>
                </div>
                <ClipboardList className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Items</p>
                  <p className="text-2xl font-bold">{currentPhaseItems.length}</p>
                </div>
                <ClipboardList className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical Items</p>
                  <p className="text-2xl font-bold text-destructive">
                    {criticalItemsChecked}/{criticalItemsCount}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-destructive opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Printable Checklist */}
      <div ref={printRef} className="print:p-8">
        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block mb-8">
          <h1 className="text-2xl font-bold mb-2">Building Code Inspector Checklist</h1>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Occupancy:</strong> {occupancyCode} - {occupancyName}</p>
              <p><strong>Phase:</strong> {selectedPhase}</p>
            </div>
            <div>
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Inspector:</strong> _______________________</p>
            </div>
          </div>
          <hr className="my-4 border-gray-300" />
        </div>

        {/* Checklist Items */}
        <Card className="rounded-none border-border print:border-0 print:shadow-none">
          <CardHeader className="print:hidden">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              {selectedPhase} Phase Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentPhaseItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 border rounded ${
                  item.critical ? 'border-destructive/30 bg-destructive/5' : 'border-border'
                } print:border-gray-300 print:bg-white`}
              >
                <div className="pt-1 print:pt-0">
                  <Checkbox
                    checked={checkedItems.has(item.id)}
                    onCheckedChange={() => handleCheckItem(item.id)}
                    className="print:appearance-none print:w-4 print:h-4 print:border print:border-gray-400"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="text-sm font-medium flex-1">{item.description}</p>
                    {item.critical && (
                      <Badge variant="destructive" className="text-[10px] print:bg-red-100 print:text-red-800">
                        CRITICAL
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono print:text-gray-600">
                    NBC/ABC {item.codeReference}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Print Footer - Only visible when printing */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-300">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Inspector Signature:</strong></p>
              <div className="border-b border-gray-400 mt-2 w-3/4"></div>
            </div>
            <div>
              <p><strong>Date:</strong></p>
              <div className="border-b border-gray-400 mt-2 w-3/4"></div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Generated by Building Code Occupancy Classifier - Alberta Edition
          </p>
        </div>
      </div>

      {/* Phase Navigation - Hidden when printing */}
      <div className="print:hidden">
        <Card className="rounded-none border-border bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">All Phases Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {allChecklists.map((phaseChecklist) => {
                const phaseTotal = phaseChecklist.items.length;
                const phaseChecked = phaseChecklist.items.filter(item => checkedItems.has(item.id)).length;
                const phasePercentage = phaseTotal > 0 ? Math.round((phaseChecked / phaseTotal) * 100) : 0;

                return (
                  <button
                    key={phaseChecklist.phase}
                    onClick={() => setSelectedPhase(phaseChecklist.phase)}
                    className={`p-3 border rounded text-left transition-colors ${
                      selectedPhase === phaseChecklist.phase
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <p className="text-xs font-bold mb-1">{phaseChecklist.phase}</p>
                    <p className="text-lg font-bold">{phasePercentage}%</p>
                    <p className="text-xs text-muted-foreground">
                      {phaseChecked}/{phaseTotal} items
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
