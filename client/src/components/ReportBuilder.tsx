import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import { FileText, CheckCircle2, Loader2 } from 'lucide-react';

interface ReportBuilderProps {
  open: boolean;
  onClose: () => void;
  projectId?: number;
}

export function ReportBuilder({ open, onClose, projectId: initialProjectId }: ReportBuilderProps) {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(initialProjectId ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<'options' | 'generated'>('options');
  const [includeProjectInfo, setIncludeProjectInfo] = useState(true);
  const [includeCompliance, setIncludeCompliance] = useState(true);
  const [includeCalculations, setIncludeCalculations] = useState(true);
  const [includeChecklist, setIncludeChecklist] = useState(true);

  const { data: projects } = trpc.projects.list.useQuery();

  const { data: project } = trpc.projects.get.useQuery(
    { id: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const { data: snapshots } = trpc.compliance.getProjectSnapshots.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const { data: calculatorResults } = trpc.projectsLegacy.calculatorResults.list.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const { data: checklistItems } = trpc.projectsLegacy.checklistItems.list.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  const hasSnapshots = (snapshots?.length ?? 0) > 0;
  const hasCalculations = (calculatorResults?.length ?? 0) > 0;
  const hasChecklist = (checklistItems?.length ?? 0) > 0;

  const checklistCompleted = (checklistItems ?? []).filter((i: any) => i.isCompleted === 1).length;
  const checklistPct = hasChecklist
    ? Math.round((checklistCompleted / checklistItems!.length) * 100)
    : 0;

  const latestSnapshot = [...(snapshots ?? [])].sort(
    (a: any, b: any) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  )[0] as any | undefined;

  const analystName =
    (user as any)?.name ?? (user as any)?.email ?? (user as any)?.username ?? 'Authenticated User';

  const handleGenerateReport = async () => {
    if (!selectedProjectId || !project) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 0;

      const addPageHeader = (subtitle?: string) => {
        doc.setFillColor(27, 58, 107);
        doc.rect(0, 0, pageWidth, 16, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('CodeComply', 14, 11);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle ?? 'Building Code Compliance Report', pageWidth - 14, 11, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        y = 24;
      };

      const addSection = (title: string) => {
        if (y > pageHeight - 40) { doc.addPage(); addPageHeader(); }
        doc.setDrawColor(200, 200, 200);
        doc.line(14, y, pageWidth - 14, y);
        y += 5;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 14, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
      };

      // ── PAGE 1: COVER ──────────────────────────────────────────────
      addPageHeader('Building Code Compliance Report');

      const rawStatus = latestSnapshot?.complianceStatus ?? null;
      if (rawStatus) {
        const isCompliant = rawStatus === 'compliant';
        const isNonCompliant = rawStatus === 'non_compliant';
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(
          isCompliant ? 22 : isNonCompliant ? 185 : 120,
          isCompliant ? 163 : isNonCompliant ? 28 : 100,
          isCompliant ? 74 : isNonCompliant ? 28 : 30
        );
        doc.text(
          isCompliant ? '✓ COMPLIANT' : isNonCompliant ? '✗ NON-COMPLIANT' : '~ CONDITIONAL',
          pageWidth / 2, y, { align: 'center' }
        );
        doc.setTextColor(0, 0, 0);
        y += 10;
      }

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(27, 58, 107);
      doc.text('Building Code Compliance Report', pageWidth / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(14);
      doc.setTextColor(80, 80, 80);
      doc.text((project as any).name ?? 'Unnamed Project', pageWidth / 2, y, { align: 'center' });
      y += 16;
      doc.setTextColor(0, 0, 0);

      const projectNum = (project as any).projectNumber ?? (project as any).projectCode ?? '—';
      autoTable(doc, {
        startY: y,
        head: [],
        body: [
          ['Project Name', (project as any).name ?? '—'],
          ['Project Number', projectNum],
          ['Occupancy Code', (project as any).occupancyCode ?? '—'],
          ['Building Type', (project as any).buildingType ?? '—'],
          ['Province', (project as any).province ?? '—'],
          ['Report Date', new Date().toLocaleDateString('en-CA')],
          ['Generated By', analystName],
        ] as [string, string][],
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50, textColor: [80, 80, 80] as any },
          1: { cellWidth: 120 },
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      // Data summary on cover
      autoTable(doc, {
        startY: y,
        head: [['Data Type', 'Available']],
        body: [
          ['Compliance Analyses', String(snapshots?.length ?? 0)],
          ['Calculator Results', String(calculatorResults?.length ?? 0)],
          ['Checklist Items', hasChecklist ? `${checklistItems!.length} items, ${checklistPct}% complete` : '0'],
        ] as [string, string][],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [27, 58, 107] as any },
        margin: { left: 14, right: 14 },
      });

      // ── PROJECT INFORMATION ────────────────────────────────────────
      if (includeProjectInfo) {
        doc.addPage();
        addPageHeader('Project Information');
        addSection('Project Details');

        autoTable(doc, {
          startY: y,
          head: [],
          body: [
            ['Project Name', (project as any).name ?? '—'],
            ['Project Number', projectNum],
            ['Occupancy Code', (project as any).occupancyCode ?? '—'],
            ['Building Type', (project as any).buildingType ?? '—'],
            ['Province', (project as any).province ?? '—'],
            ['Climate Zone', (project as any).climateZone ? `Zone ${(project as any).climateZone}` : '—'],
            ['Gross Floor Area', (project as any).grossFloorArea ? `${(project as any).grossFloorArea} m²` : '—'],
          ] as [string, string][],
          theme: 'striped',
          styles: { fontSize: 10, cellPadding: 3 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 55 },
            1: { cellWidth: 115 },
          },
          margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // ── COMPLIANCE SNAPSHOTS ───────────────────────────────────────
      if (includeCompliance && hasSnapshots) {
        const sorted = [...(snapshots ?? [])].sort(
          (a: any, b: any) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        );

        for (const snap of sorted) {
          doc.addPage();
          addPageHeader('Compliance Analysis');
          const snapStatus = (snap as any).complianceStatus ?? 'unknown';
          const snapCompliant = snapStatus === 'compliant';
          const snapFail = snapStatus === 'non_compliant';
          addSection(`Analysis — ${new Date((snap as any).createdAt || Date.now()).toLocaleDateString('en-CA')}`);

          autoTable(doc, {
            startY: y,
            head: [],
            body: [
              ['Snapshot ID', ((snap as any).snapshotId ?? '—').slice(0, 40)],
              ['Status', snapCompliant ? 'COMPLIANT' : snapFail ? 'NON-COMPLIANT' : 'CONDITIONAL'],
              ['Mode', (snap as any).mode ?? 'soft'],
              ['Ruleset', (snap as any).rulesetId ?? '—'],
              ['Date', new Date((snap as any).createdAt || Date.now()).toLocaleString()],
              ['Analyst', analystName],
            ] as [string, string][],
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 40, textColor: [80, 80, 80] as any },
              1: { cellWidth: 130 },
            },
            didParseCell: (data) => {
              if (data.row.index === 1 && data.column.index === 1) {
                data.cell.styles.textColor = (snapCompliant ? [22, 163, 74] : snapFail ? [185, 28, 28] : [120, 90, 20]) as any;
                data.cell.styles.fontStyle = 'bold';
              }
            },
            margin: { left: 14, right: 14 },
          });
          y = (doc as any).lastAutoTable.finalY + 8;

          const inputRows = Object.entries((snap as any).inputs || {}).map(([k, v]) => [
            k.replace(/_/g, ' '), String(v),
          ]);
          if (inputRows.length > 0) {
            if (y > pageHeight - 50) { doc.addPage(); addPageHeader('Compliance Analysis'); }
            doc.setFontSize(10); doc.setFont('helvetica', 'bold');
            doc.text('Inputs', 14, y); y += 4;
            autoTable(doc, {
              startY: y,
              head: [['Parameter', 'Value']],
              body: inputRows,
              styles: { fontSize: 9 },
              headStyles: { fillColor: [27, 58, 107] as any },
              margin: { left: 14, right: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
          }

          const outputRows = Object.entries((snap as any).outputs || {}).map(([k, v]) => [
            k.replace(/_/g, ' '), String(v),
          ]);
          if (outputRows.length > 0) {
            if (y > pageHeight - 50) { doc.addPage(); addPageHeader('Compliance Analysis'); }
            doc.setFontSize(10); doc.setFont('helvetica', 'bold');
            doc.text('Outputs', 14, y); y += 4;
            autoTable(doc, {
              startY: y,
              head: [['Output', 'Value']],
              body: outputRows,
              styles: { fontSize: 9 },
              headStyles: { fillColor: [27, 58, 107] as any },
              margin: { left: 14, right: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
          }

          const traceRows = ((snap as any).ruleTrace || []).map((step: any) => [
            step.rule_id ?? '',
            step.clause ?? '',
            step.fired ? 'PASS' : 'FAIL',
          ]);
          if (traceRows.length > 0) {
            if (y > pageHeight - 50) { doc.addPage(); addPageHeader('Compliance Analysis'); }
            doc.setFontSize(10); doc.setFont('helvetica', 'bold');
            doc.text('Rule Trace', 14, y); y += 4;
            autoTable(doc, {
              startY: y,
              head: [['Rule ID', 'Clause', 'Result']],
              body: traceRows,
              didParseCell: (data) => {
                if (data.column.index === 2 && data.section === 'body') {
                  data.cell.styles.textColor = (data.cell.raw === 'PASS' ? [22, 163, 74] : [185, 28, 28]) as any;
                  data.cell.styles.fontStyle = 'bold';
                }
              },
              styles: { fontSize: 9 },
              headStyles: { fillColor: [27, 58, 107] as any },
              margin: { left: 14, right: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
          }
        }
      }

      // ── CALCULATOR RESULTS ─────────────────────────────────────────
      if (includeCalculations && hasCalculations) {
        doc.addPage();
        addPageHeader('Calculator Results');
        addSection('Step Code & Calculator Results');

        const calcRows = (calculatorResults ?? []).map((r: any) => {
          let summary = '';
          try {
            const parsed = JSON.parse(r.resultData);
            summary = typeof parsed === 'object'
              ? Object.entries(parsed).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ')
              : String(parsed);
          } catch {
            summary = (r.resultData ?? '').slice(0, 80);
          }
          return [
            (r.calculatorType ?? '—').replace(/_/g, ' '),
            summary,
            new Date(r.updatedAt || r.createdAt || Date.now()).toLocaleDateString('en-CA'),
          ];
        });

        autoTable(doc, {
          startY: y,
          head: [['Calculator', 'Result Summary', 'Date']],
          body: calcRows,
          styles: { fontSize: 9, overflow: 'linebreak' },
          headStyles: { fillColor: [27, 58, 107] as any },
          columnStyles: { 1: { cellWidth: 90 } },
          margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // ── INSPECTION CHECKLIST ───────────────────────────────────────
      if (includeChecklist && hasChecklist) {
        doc.addPage();
        addPageHeader('Inspection Checklist');
        addSection('Inspection Checklist');

        const byPhase: Record<string, any[]> = {};
        for (const item of (checklistItems ?? [])) {
          const ph = (item as any).phase ?? 'General';
          if (!byPhase[ph]) byPhase[ph] = [];
          byPhase[ph].push(item);
        }

        for (const [phase, items] of Object.entries(byPhase)) {
          if (y > pageHeight - 60) { doc.addPage(); addPageHeader('Inspection Checklist'); }
          const phaseCompleted = items.filter((i: any) => i.isCompleted === 1).length;
          const phasePct = Math.round((phaseCompleted / items.length) * 100);

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(
            `${phase.charAt(0).toUpperCase() + phase.slice(1)} — ${phaseCompleted}/${items.length} (${phasePct}%)`,
            14, y
          );
          y += 4;

          autoTable(doc, {
            startY: y,
            head: [],
            body: items.map((item: any) => [
              item.isCompleted === 1 ? '✓' : '○',
              item.itemText ?? '',
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
              0: { cellWidth: 10, halign: 'center' },
              1: { cellWidth: 160, overflow: 'linebreak' },
            },
            didParseCell: (data) => {
              if (data.column.index === 0) {
                data.cell.styles.textColor = (data.cell.raw === '✓' ? [22, 163, 74] : [180, 180, 180]) as any;
              }
            },
            margin: { left: 14, right: 14 },
          });
          y = (doc as any).lastAutoTable.finalY + 8;
        }

        if (y > pageHeight - 20) { doc.addPage(); addPageHeader('Inspection Checklist'); }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Overall: ${checklistCompleted}/${checklistItems!.length} items complete (${checklistPct}%)`, 14, y);
        y += 10;
      }

      // ── LEGAL & GOVERNANCE ─────────────────────────────────────────
      doc.addPage();
      addPageHeader('Legal & Governance');
      addSection('Legal Disclaimer');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const disclaimerLines = [
        'This report has been generated by CodeComply and is based solely on the inputs provided by the user.',
        'It does not constitute professional engineering or architectural advice. All calculations must be',
        'verified by a licensed professional engineer or architect before use in any permit application,',
        'construction document, or regulatory submission.',
        '',
        'Compliance determinations are made against the National Building Code of Canada (NBC) as referenced',
        'in the applicable ruleset. Local amendments and authority-having-jurisdiction (AHJ) requirements',
        'may impose additional or different requirements not reflected in this report.',
      ];
      for (const line of disclaimerLines) {
        if (y > pageHeight - 20) { doc.addPage(); addPageHeader('Legal & Governance'); }
        if (line) { doc.text(line, 14, y, { maxWidth: pageWidth - 28 }); }
        y += line ? 5 : 3;
      }
      y += 6;

      addSection('Immutability & Audit Trail');
      doc.setFontSize(9);
      doc.text(
        'All compliance analyses are cryptographically identified by immutable snapshot IDs:',
        14, y, { maxWidth: pageWidth - 28 }
      );
      y += 7;
      for (const snap of (snapshots ?? [])) {
        if (y > pageHeight - 20) { doc.addPage(); addPageHeader('Legal & Governance'); }
        doc.text(`• ${(snap as any).snapshotId ?? '—'}`, 18, y, { maxWidth: pageWidth - 32 });
        y += 5;
      }
      if ((snapshots ?? []).length === 0) {
        doc.text('No compliance snapshots recorded for this project.', 18, y);
        y += 5;
      }
      y += 8;

      addSection('Signature Block');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report prepared by: ${analystName}`, 14, y); y += 6;
      doc.text(`Report generated: ${new Date().toLocaleString('en-CA')}`, 14, y); y += 18;
      doc.setDrawColor(0, 0, 0);
      doc.line(14, y, 100, y); y += 4;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Signature of Reviewing Professional', 14, y); y += 5;
      doc.text('Date: _________________________', 14, y);

      // Page footers
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `CodeComply — Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      }

      const safeName = ((project as any).name ?? 'project')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(0, 30);
      doc.save(`codecomply-report-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`);
      setStep('generated');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Generate Professional Report</DialogTitle>
          <DialogDescription>
            Create a comprehensive compliance report combining analyses, calculations, and checklists
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[65vh]">
          {step === 'options' && (
            <>
              {/* Project selector */}
              <div>
                <Label className="text-sm font-medium">Project</Label>
                <Select
                  value={selectedProjectId ? String(selectedProjectId) : ''}
                  onValueChange={(v) => {
                    setSelectedProjectId(Number(v));
                    setStep('options');
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a project…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(projects ?? []).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.projectNumber ?? p.projectCode
                          ? `[${p.projectNumber ?? p.projectCode}] `
                          : ''}
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Report contents — only show after project selected */}
              {selectedProjectId && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Report Contents</CardTitle>
                    <CardDescription>Select sections to include</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Project Info — always available */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="inc-project"
                        checked={includeProjectInfo}
                        onCheckedChange={(c) => setIncludeProjectInfo(c as boolean)}
                      />
                      <Label htmlFor="inc-project" className="cursor-pointer flex-1">
                        Project Information
                        <span className="ml-2 text-xs text-muted-foreground">Always available</span>
                      </Label>
                    </div>

                    {/* Compliance Analysis */}
                    {hasSnapshots ? (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="inc-compliance"
                          checked={includeCompliance}
                          onCheckedChange={(c) => setIncludeCompliance(c as boolean)}
                        />
                        <Label htmlFor="inc-compliance" className="cursor-pointer flex-1">
                          Compliance Analysis
                          <span className="ml-2 text-xs text-green-600">
                            {snapshots!.length} {snapshots!.length === 1 ? 'analysis' : 'analyses'} available
                          </span>
                        </Label>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 opacity-50">
                        <Checkbox id="inc-compliance-none" disabled />
                        <Label htmlFor="inc-compliance-none" className="flex-1 text-muted-foreground">
                          Compliance Analysis
                          <span className="ml-2 text-xs">No data available</span>
                        </Label>
                      </div>
                    )}

                    {/* Calculator Results */}
                    {hasCalculations ? (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="inc-calc"
                          checked={includeCalculations}
                          onCheckedChange={(c) => setIncludeCalculations(c as boolean)}
                        />
                        <Label htmlFor="inc-calc" className="cursor-pointer flex-1">
                          Step Code Calculations
                          <span className="ml-2 text-xs text-green-600">
                            {calculatorResults!.length}{' '}
                            {calculatorResults!.length === 1 ? 'calculation' : 'calculations'} available
                          </span>
                        </Label>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 opacity-50">
                        <Checkbox id="inc-calc-none" disabled />
                        <Label htmlFor="inc-calc-none" className="flex-1 text-muted-foreground">
                          Step Code Calculations
                          <span className="ml-2 text-xs">No data available</span>
                        </Label>
                      </div>
                    )}

                    {/* Inspection Checklist */}
                    {hasChecklist ? (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="inc-checklist"
                          checked={includeChecklist}
                          onCheckedChange={(c) => setIncludeChecklist(c as boolean)}
                        />
                        <Label htmlFor="inc-checklist" className="cursor-pointer flex-1">
                          Inspection Checklist
                          <span className="ml-2 text-xs text-green-600">
                            {checklistItems!.length} items, {checklistPct}% complete
                          </span>
                        </Label>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 opacity-50">
                        <Checkbox id="inc-checklist-none" disabled />
                        <Label htmlFor="inc-checklist-none" className="flex-1 text-muted-foreground">
                          Inspection Checklist
                          <span className="ml-2 text-xs">No data available</span>
                        </Label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateReport}
                  disabled={!selectedProjectId || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {step === 'generated' && (
            <div className="space-y-4 text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Report Generated</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your PDF has been downloaded automatically.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" onClick={() => setStep('options')}>
                  Generate Another
                </Button>
                <Button onClick={onClose}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
