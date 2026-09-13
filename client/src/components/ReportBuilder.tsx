import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  C, TABLE_STYLES, INFO_COL_LABEL, INFO_COL_VALUE,
  BUILDING_TYPE_LABELS,
  drawHeader, drawStatusBanner, drawSectionBar, drawFooters, contentHeight,
  statusLabel,
} from '@/lib/pdfStyles';
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

// Deduplicate snapshots: if two snapshots have identical inputs, keep only the latest.
function deduplicateSnapshots(snapshots: any[]): any[] {
  const seen = new Map<string, any>();
  const sorted = [...snapshots].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );
  for (const snap of sorted) {
    const key = JSON.stringify(snap.inputs ?? {});
    if (!seen.has(key)) seen.set(key, snap);
  }
  return Array.from(seen.values());
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

  const p = project as any;
  const projectNum = p?.projectNumber ?? p?.projectCode ?? 'N/A';
  const buildingTypeLabel = p?.buildingType
    ? (BUILDING_TYPE_LABELS[p.buildingType] ?? p.buildingType)
    : 'Not specified';
  const legacyTypeContradiction = p?.part3Determination && p?.buildingType
    ? ((p.part3Determination === 'Part 9' && String(p.buildingType).startsWith('part3_')) ||
       (p.part3Determination === 'Part 3' && String(p.buildingType).startsWith('part9_')))
    : false;

  const handleGenerateReport = async () => {
    if (!selectedProjectId || !project) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const maxY = contentHeight(doc);
      let y = 0;

      const today = new Date().toLocaleDateString('en-CA');
      const reportType = 'Building Code Compliance Report';

      const freshHeader = (subtitle?: string) => {
        y = drawHeader(doc, subtitle ?? reportType, today, analystName);
      };

      const section = (title: string) => {
        if (y > maxY - 20) { doc.addPage(); freshHeader(); }
        y = drawSectionBar(doc, title, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      };

      // ── COVER PAGE ─────────────────────────────────────────────────
      freshHeader();

      const rawStatus = latestSnapshot?.complianceStatus ?? null;
      if (rawStatus) {
        y = drawStatusBanner(
          doc, rawStatus,
          `All applicable NBC requirements — ${statusLabel(rawStatus)}`,
          y
        );
      }

      y += 6;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.navyDark);
      doc.text(reportType, pw / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(13);
      doc.setTextColor(...C.textMuted);
      doc.text(p?.name ?? 'Unnamed Project', pw / 2, y, { align: 'center' });
      y += 14;
      doc.setTextColor(...C.textPrimary);

      // Cover info table (navy labels / cream values)
      autoTable(doc, {
        startY: y,
        head: [],
        body: [
          ['Project Name',   p?.name ?? 'Not specified'],
          ['Project Number', projectNum],
          ['Occupancy Code', p?.occupancyCode ?? 'Not specified'],
          ['Building Type',  buildingTypeLabel],
          ...(legacyTypeContradiction ? [['Scope Review', 'Legacy Building Type conflicts with determination']] : []),
          ['Province',       p?.province ?? 'Not specified'],
          ['Report Date',    today],
          ['Generated By',   analystName],
        ],
        theme: 'plain',
        ...TABLE_STYLES,
        styles: { ...TABLE_STYLES.styles, fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { ...INFO_COL_LABEL, cellWidth: 52 },
          1: { ...INFO_COL_VALUE, cellWidth: 118 },
        },
        didParseCell: (data) => {
          if (data.column.index === 1 && data.row.index % 2 === 1) {
            data.cell.styles.fillColor = C.creamWarm;
          }
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Data availability summary
      section('Data Summary');
      autoTable(doc, {
        startY: y,
        head: [['Section', 'Available']],
        body: [
          ['Compliance Analyses', String(snapshots?.length ?? 0)],
          ['Calculator Results',  String(calculatorResults?.length ?? 0)],
          ['Checklist Items',     hasChecklist ? `${checklistItems!.length} items · ${checklistPct}% complete` : '0'],
        ],
        ...TABLE_STYLES,
        margin: { left: 14, right: 14 },
      });

      // ── PROJECT INFORMATION ────────────────────────────────────────
      if (includeProjectInfo) {
        doc.addPage();
        freshHeader('Project Information');
        section('Project Details');

        autoTable(doc, {
          startY: y,
          head: [],
          body: [
            ['Project Name',     p?.name ?? 'Not specified'],
            ['Project Number',   projectNum],
            ['Occupancy Code',   p?.occupancyCode ?? 'Not specified'],
            ['Building Type',    buildingTypeLabel],
            ['Province',         p?.province ?? 'Not specified'],
            ['Climate Zone',     p?.climateZone ? `Zone ${p.climateZone}` : 'Not specified'],
            ['Gross Floor Area', p?.grossFloorArea ? `${p.grossFloorArea} m\xB2` : 'Not specified'],
            ['Building Footprint', p?.buildingFootprintJson?.value != null ? `${p.buildingFootprintJson.value} m\xB2 (${p.buildingFootprintJson.confirmed ? 'confirmed' : 'unconfirmed'}; ${p.buildingFootprintJson.source})` : 'Not specified'],
            ...(legacyTypeContradiction ? [['Scope Review', 'Legacy Building Type conflicts with authoritative determination']] : []),
            ['Code Edition',     p?.province === 'AB' ? 'NBC(AE) 2023' : p?.province === 'BC' ? 'BCBC 2024' : 'NBC 2020'],
          ],
          theme: 'plain',
          ...TABLE_STYLES,
          styles: { ...TABLE_STYLES.styles, fontSize: 10, cellPadding: 3 },
          columnStyles: {
            0: { ...INFO_COL_LABEL, cellWidth: 52 },
            1: { ...INFO_COL_VALUE, cellWidth: 118 },
          },
          didParseCell: (data) => {
            if (data.column.index === 1 && data.row.index % 2 === 1) {
              data.cell.styles.fillColor = C.creamWarm;
            }
          },
          margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // ── COMPLIANCE SNAPSHOTS ───────────────────────────────────────
      if (includeCompliance && hasSnapshots) {
        const dedupedSnaps = deduplicateSnapshots(snapshots ?? []);

        for (const snap of dedupedSnaps) {
          doc.addPage();
          freshHeader('Compliance Analysis');

          const snapStatus = snap.complianceStatus ?? 'unknown';
          const snapDate = new Date(snap.createdAt || Date.now()).toLocaleDateString('en-CA');
          y = drawStatusBanner(doc, snapStatus, `${snapStatus.replace(/_/g, '-').toUpperCase()}  ·  ${snapDate}  ·  Mode: ${snap.mode ?? 'soft'}`, y);

          section(`Analysis — ${snapDate}`);

          // Meta table
          autoTable(doc, {
            startY: y,
            head: [],
            body: [
              ['Snapshot ID', (snap.snapshotId ?? '—').slice(0, 40)],
              ['Status',      statusLabel(snapStatus)],
              ['Mode',        snap.mode ?? 'soft'],
              ['Ruleset',     snap.rulesetId ?? '—'],
              ['Date',        new Date(snap.createdAt || Date.now()).toLocaleString()],
              ['Analyst',     analystName],
            ],
            theme: 'plain',
            ...TABLE_STYLES,
            styles: { ...TABLE_STYLES.styles, cellPadding: 2 },
            columnStyles: {
              0: { ...INFO_COL_LABEL, cellWidth: 38 },
              1: { ...INFO_COL_VALUE, cellWidth: 132, overflow: 'linebreak' },
            },
            didParseCell: (data) => {
              if (data.row.index === 1 && data.column.index === 1) {
                const isGreen = snapStatus === 'compliant';
                const isRed   = snapStatus === 'non_compliant';
                data.cell.styles.textColor = isGreen ? C.green : isRed ? C.red : C.amber;
                data.cell.styles.fontStyle = 'bold';
              }
            },
            margin: { left: 14, right: 14 },
          });
          y = (doc as any).lastAutoTable.finalY + 8;

          // Inputs
          const inputRows = Object.entries(snap.inputs || {}).map(([k, v]) => [
            k.replace(/_/g, ' '), String(v),
          ]);
          if (inputRows.length > 0) {
            if (y > maxY - 40) { doc.addPage(); freshHeader('Compliance Analysis'); }
            y = drawSectionBar(doc, 'Analysis Inputs', y);
            autoTable(doc, {
              startY: y,
              head: [['Parameter', 'Value']],
              body: inputRows,
              ...TABLE_STYLES,
              columnStyles: {
                0: { cellWidth: 80, overflow: 'linebreak' },
                1: { cellWidth: 90, overflow: 'linebreak' },
              },
              margin: { left: 14, right: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
          }

          // Outputs
          const outputRows = Object.entries(snap.outputs || {}).map(([k, v]) => [
            k.replace(/_/g, ' '), String(v),
          ]);
          if (outputRows.length > 0) {
            if (y > maxY - 40) { doc.addPage(); freshHeader('Compliance Analysis'); }
            y = drawSectionBar(doc, 'Analysis Outputs', y);
            autoTable(doc, {
              startY: y,
              head: [['Output', 'Value']],
              body: outputRows,
              ...TABLE_STYLES,
              columnStyles: {
                0: { cellWidth: 80, overflow: 'linebreak' },
                1: { cellWidth: 90, overflow: 'linebreak' },
              },
              margin: { left: 14, right: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
          }

          // Rule trace
          const traceRows = (snap.ruleTrace || []).map((step: any) => [
            step.rule_id ?? '',
            step.clause ?? '',
            step.fired ? 'PASS' : 'FAIL',
          ]);
          if (traceRows.length > 0) {
            if (y > maxY - 40) { doc.addPage(); freshHeader('Compliance Analysis'); }
            y = drawSectionBar(doc, 'Rule Trace', y);
            autoTable(doc, {
              startY: y,
              head: [['Rule ID', 'Clause', 'Result']],
              body: traceRows,
              ...TABLE_STYLES,
              columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 110, overflow: 'linebreak' },
                2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
              },
              didParseCell: (data) => {
                if (data.column.index === 2 && data.section === 'body') {
                  data.cell.styles.textColor = data.cell.raw === 'PASS' ? C.green : C.red;
                }
              },
              margin: { left: 14, right: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
          }
        }
      }

      // ── CALCULATOR RESULTS ─────────────────────────────────────────
      if (includeCalculations && hasCalculations) {
        doc.addPage();
        freshHeader('Calculator Results');
        section('Step Code & Calculator Results');

        const calcRows = (calculatorResults ?? []).map((r: any) => {
          let summary = '';
          try {
            const parsed = JSON.parse(r.resultData);
            summary = typeof parsed === 'object'
              ? Object.entries(parsed).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join('  ·  ')
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
          ...TABLE_STYLES,
          styles: { ...TABLE_STYLES.styles, overflow: 'linebreak' },
          columnStyles: { 1: { cellWidth: 95, overflow: 'linebreak' }, 2: { cellWidth: 28 } },
          margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // ── INSPECTION CHECKLIST ───────────────────────────────────────
      if (includeChecklist && hasChecklist) {
        doc.addPage();
        freshHeader('Inspection Checklist');
        section('Inspection Checklist');

        const byPhase: Record<string, any[]> = {};
        for (const item of (checklistItems ?? [])) {
          const ph = (item as any).phase ?? 'General';
          if (!byPhase[ph]) byPhase[ph] = [];
          byPhase[ph].push(item);
        }

        for (const [phase, items] of Object.entries(byPhase)) {
          if (y > maxY - 50) { doc.addPage(); freshHeader('Inspection Checklist'); }
          const phaseCompleted = items.filter((i: any) => i.isCompleted === 1).length;
          const phasePct = Math.round((phaseCompleted / items.length) * 100);

          // Phase header bar (navy mid)
          doc.setFillColor(...C.navyMid);
          doc.rect(14, y, pw - 28, 8, 'F');
          doc.setTextColor(...C.white);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          const phaseTitle = phase.charAt(0).toUpperCase() + phase.slice(1);
          doc.text(`${phaseTitle}  ·  ${phaseCompleted}/${items.length} items  ·  ${phasePct}% complete`, 18, y + 5.5);
          doc.setTextColor(...C.textPrimary);
          y += 11;

          autoTable(doc, {
            startY: y,
            head: [],
            body: items.map((item: any) => [
              item.isCompleted === 1 ? '✓' : '○',
              item.itemText ?? '',
            ]),
            ...TABLE_STYLES,
            styles: { ...TABLE_STYLES.styles, fontSize: 8, cellPadding: 2 },
            columnStyles: {
              0: { cellWidth: 10, halign: 'center' },
              1: { cellWidth: 160, overflow: 'linebreak' },
            },
            didParseCell: (data) => {
              if (data.column.index === 0) {
                data.cell.styles.textColor = data.cell.raw === '✓' ? C.green : C.textMuted;
                data.cell.styles.fontStyle = 'bold';
              }
            },
            margin: { left: 14, right: 14 },
          });
          y = (doc as any).lastAutoTable.finalY + 8;
        }

        if (y > maxY - 16) { doc.addPage(); freshHeader('Inspection Checklist'); }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.navyDark);
        doc.text(
          `Overall Completion: ${checklistCompleted}/${checklistItems!.length} items (${checklistPct}%)`,
          14, y
        );
        doc.setTextColor(...C.textPrimary);
        y += 10;
      }

      // ── LEGAL & GOVERNANCE ─────────────────────────────────────────
      doc.addPage();
      freshHeader('Legal & Governance');
      section('Legal Disclaimer');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.textPrimary);
      const disclaimerText =
        'This report has been generated by CodeComply and is based solely on the inputs provided by the user. ' +
        'It does not constitute professional engineering or architectural advice. All calculations must be verified ' +
        'by a licensed professional engineer or architect before use in any permit application, construction document, ' +
        'or regulatory submission. Compliance determinations are made against the National Building Code of Canada ' +
        '(NBC) as referenced in the applicable ruleset. Local amendments and authority-having-jurisdiction (AHJ) ' +
        'requirements may impose additional or different requirements not reflected in this report.';
      const dLines = doc.splitTextToSize(disclaimerText, pw - 28) as string[];
      doc.text(dLines, 14, y);
      y += dLines.length * 4.5 + 8;

      section('Immutability & Audit Trail');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('All compliance analyses are stored as cryptographically identified immutable snapshots:', 14, y, { maxWidth: pw - 28 });
      y += 7;
      for (const snap of (snapshots ?? [])) {
        if (y > maxY - 12) { doc.addPage(); freshHeader('Legal & Governance'); }
        doc.setTextColor(...C.textMuted);
        doc.text(`•  ${(snap as any).snapshotId ?? '—'}`, 18, y, { maxWidth: pw - 32 });
        y += 5;
      }
      if ((snapshots ?? []).length === 0) {
        doc.setTextColor(...C.textMuted);
        doc.text('No compliance snapshots recorded for this project.', 18, y);
        y += 5;
      }
      doc.setTextColor(...C.textPrimary);
      y += 8;

      section('Signature Block');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report prepared by:  ${analystName}`, 14, y); y += 6;
      doc.text(`Report generated:    ${new Date().toLocaleString('en-CA')}`, 14, y); y += 16;
      doc.setDrawColor(...C.creamBorder);
      doc.line(14, y, 100, y); y += 4;
      doc.setFontSize(7.5);
      doc.setTextColor(...C.textMuted);
      doc.text('Signature of Reviewing Professional', 14, y); y += 5;
      doc.text('Date: _________________________', 14, y);

      // Footers
      drawFooters(doc, 'CodeComply \xB7 Deterministic Rule Engine v1.0 \xB7 NBC(AE) 2023', projectNum);

      const safeName = (p?.name ?? 'project').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      doc.save(`codecomply-report-${safeName}-${today}.pdf`);
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
              <div>
                <Label className="text-sm font-medium">Project</Label>
                <Select
                  value={selectedProjectId ? String(selectedProjectId) : ''}
                  onValueChange={(v) => { setSelectedProjectId(Number(v)); setStep('options'); }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a project…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(projects ?? []).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.projectNumber ?? p.projectCode ? `[${p.projectNumber ?? p.projectCode}] ` : ''}
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProjectId && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Report Contents</CardTitle>
                    <CardDescription>Select sections to include</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox id="inc-project" checked={includeProjectInfo}
                        onCheckedChange={(c) => setIncludeProjectInfo(c as boolean)} />
                      <Label htmlFor="inc-project" className="cursor-pointer flex-1">
                        Project Information
                        <span className="ml-2 text-xs text-muted-foreground">Always available</span>
                      </Label>
                    </div>

                    {hasSnapshots ? (
                      <div className="flex items-center gap-2">
                        <Checkbox id="inc-compliance" checked={includeCompliance}
                          onCheckedChange={(c) => setIncludeCompliance(c as boolean)} />
                        <Label htmlFor="inc-compliance" className="cursor-pointer flex-1">
                          Compliance Analysis
                          <span className="ml-2 text-xs text-green-600">
                            {snapshots!.length} {snapshots!.length === 1 ? 'analysis' : 'analyses'} available
                          </span>
                        </Label>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 opacity-50">
                        <Checkbox disabled />
                        <Label className="flex-1 text-muted-foreground">
                          Compliance Analysis <span className="ml-2 text-xs">No data available</span>
                        </Label>
                      </div>
                    )}

                    {hasCalculations ? (
                      <div className="flex items-center gap-2">
                        <Checkbox id="inc-calc" checked={includeCalculations}
                          onCheckedChange={(c) => setIncludeCalculations(c as boolean)} />
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
                        <Checkbox disabled />
                        <Label className="flex-1 text-muted-foreground">
                          Step Code Calculations <span className="ml-2 text-xs">No data available</span>
                        </Label>
                      </div>
                    )}

                    {hasChecklist ? (
                      <div className="flex items-center gap-2">
                        <Checkbox id="inc-checklist" checked={includeChecklist}
                          onCheckedChange={(c) => setIncludeChecklist(c as boolean)} />
                        <Label htmlFor="inc-checklist" className="cursor-pointer flex-1">
                          Inspection Checklist
                          <span className="ml-2 text-xs text-green-600">
                            {checklistItems!.length} items, {checklistPct}% complete
                          </span>
                        </Label>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 opacity-50">
                        <Checkbox disabled />
                        <Label className="flex-1 text-muted-foreground">
                          Inspection Checklist <span className="ml-2 text-xs">No data available</span>
                        </Label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleGenerateReport} disabled={!selectedProjectId || isGenerating}>
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                  ) : (
                    <><FileText className="w-4 h-4 mr-2" />Generate Report</>
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
                <p className="text-sm text-muted-foreground mt-1">Your PDF has been downloaded automatically.</p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" onClick={() => setStep('options')}>Generate Another</Button>
                <Button onClick={onClose}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
