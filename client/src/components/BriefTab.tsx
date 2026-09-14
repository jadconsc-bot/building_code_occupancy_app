import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { occupancyData } from '@/lib/occupancyData';
import { toast } from 'sonner';
import {
  Users, LogOut, Navigation, ArrowLeftRight, Droplets,
  Building, UserCheck, ChevronRight, CheckCircle,
  AlertCircle, Minus, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface BriefTabProps {
  projectId: number;
}

type BriefInputs = {
  occupancyGroup: string | null;
  grossFloorAreaM2: number | null;
  storeys: number | null;
  totalDwellingUnits: number | null;
  province: string | null;
  sprinklered: boolean | null;
  buildingFootprintJson: any;
  status: string;
  buildingType: string | null;
  analysisStatus: string | null;
};

function StatusDot({ status }: { status: 'ok' | 'warning' | 'na' }) {
  if (status === 'ok') return <CheckCircle className="w-4 h-4 shrink-0 text-green-500" />;
  if (status === 'warning') return <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />;
  return <Minus className="w-4 h-4 shrink-0 text-gray-300" />;
}

interface SectionCardProps {
  title: string;
  icon: React.ElementType;
  status: 'ok' | 'warning' | 'na';
  value: string;
  citation: string;
  note?: string;
  subline?: string;
  linkLabel?: string;
  onLink?: () => void;
  children?: React.ReactNode;
}

function SectionCard({
  title, icon: Icon, status, value, citation,
  note, subline, linkLabel, onLink, children,
}: SectionCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="w-3.5 h-3.5" />
          <span className="text-xs uppercase tracking-wide font-medium">{title}</span>
        </div>
        <StatusDot status={status} />
      </div>
      <div className="text-xl font-bold leading-tight">{value}</div>
      {subline && <div className="text-xs text-muted-foreground">{subline}</div>}
      <div className="text-xs text-muted-foreground">{citation}</div>
      {note && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1">
          {note}
        </div>
      )}
      {children}
      {linkLabel && onLink && (
        <button
          onClick={onLink}
          className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5"
        >
          {linkLabel} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function InputsPanel({
  projectId,
  defaultValues,
  onSaved,
}: {
  projectId: number;
  defaultValues: BriefInputs;
  onSaved: () => void;
}) {
  const updateMutation = trpc.projects.update.useMutation();
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    occupancyCode: defaultValues.occupancyGroup ?? '',
    grossFloorArea: defaultValues.grossFloorAreaM2 != null ? String(defaultValues.grossFloorAreaM2) : '',
    storeys: defaultValues.storeys != null ? String(defaultValues.storeys) : '',
    totalDwellingUnits: defaultValues.totalDwellingUnits != null ? String(defaultValues.totalDwellingUnits) : '',
    province: defaultValues.province ?? '',
    sprinklersRequired: defaultValues.sprinklered != null ? String(defaultValues.sprinklered) : '',
    footprint: defaultValues.buildingFootprintJson?.value != null ? String(defaultValues.buildingFootprintJson.value) : '',
  });
  const [determination, setDetermination] = useState<any>(null);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: projectId,
        ...(form.occupancyCode     && { occupancyCode: form.occupancyCode }),
        ...(form.grossFloorArea    && { grossFloorArea: parseFloat(form.grossFloorArea) }),
        ...(form.storeys           && { storeys: parseInt(form.storeys, 10) }),
        ...(form.totalDwellingUnits && { totalDwellingUnits: parseInt(form.totalDwellingUnits, 10) }),
        ...(form.province          && { province: form.province }),
        ...(form.sprinklersRequired !== '' && {
          sprinklersRequired: form.sprinklersRequired === 'true',
        }),
        ...(form.footprint && { buildingFootprintJson: { value: parseFloat(form.footprint), confirmed: true, source: 'user-entered' } }),
      });
      const result = await utils.occupancyAdvisor.determinePart.fetch({
        footprintM2: form.footprint ? parseFloat(form.footprint) : null,
        storeys: form.storeys ? parseInt(form.storeys, 10) : null,
        occupancyGroup: form.occupancyCode || null,
      });
      setDetermination(result);
      await updateMutation.mutateAsync({ id: projectId, part3Determination: result.determination });
      await utils.projects.generateBrief.invalidate({ projectId });
      toast.success('Project Brief inputs saved');
      onSaved();
    } catch {
      toast.error('Failed to save inputs');
    }
  };

  const allSet =
    !!form.occupancyCode &&
    !!form.grossFloorArea &&
    !!form.storeys &&
    !!form.province &&
    form.sprinklersRequired !== '';

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div>
        <p className="text-sm font-medium">Brief Inputs</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          These project inputs drive all seven compliance sections.
        </p>
      </div>
      {(['completed', 'archived'].includes(defaultValues.status) || ['UNDER_REVIEW', 'VALID'].includes(defaultValues.analysisStatus ?? '')) && form.footprint && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          This project&apos;s status is {defaultValues.status}. Changing the footprint may affect the Part 9/3 determination this status was based on — review prior approvals or permit packages before relying on them.
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Occupancy Group</Label>
        <Select
          value={form.occupancyCode}
          onValueChange={v => setForm(f => ({ ...f, occupancyCode: v }))}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select occupancy group…" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {occupancyData.map(o => (
              <SelectItem key={o.code} value={o.code} className="text-xs">
                {o.code} — {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Building Footprint at Grade (m²)</Label>
          <Input type="number" min={0} className="h-8 text-xs" value={form.footprint} onChange={e => setForm(f => ({ ...f, footprint: e.target.value }))} placeholder="e.g. 418" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Gross Floor Area (m²)</Label>
          <Input
            type="number"
            min={1}
            className="h-8 text-xs"
            value={form.grossFloorArea}
            onChange={e => setForm(f => ({ ...f, grossFloorArea: e.target.value }))}
            placeholder="e.g. 450"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Storeys above grade</Label>
          <Input
            type="number"
            min={1}
            className="h-8 text-xs"
            value={form.storeys}
            onChange={e => setForm(f => ({ ...f, storeys: e.target.value }))}
            placeholder="e.g. 2"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Number of dwelling units</Label>
          <Input
            type="number"
            min={1}
            className="h-8 text-xs"
            value={form.totalDwellingUnits}
            onChange={e => setForm(f => ({ ...f, totalDwellingUnits: e.target.value }))}
            placeholder="e.g. 1"
          />
        </div>
      </div>
      {determination && (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          <strong>{determination.determination === 'needs_review' ? 'Needs Review' : determination.determination}</strong>
          <div>{determination.reasoning}</div>
          {determination.failedCriteria?.length > 0 && <div>Failed criteria: {determination.failedCriteria.join(', ')}</div>}
          {defaultValues.buildingType && ((determination.determination === 'Part 9' && defaultValues.buildingType.startsWith('part3_')) || (determination.determination === 'Part 3' && defaultValues.buildingType.startsWith('part9_'))) && <div className="font-semibold text-amber-700">Review: stored Building Type conflicts with this determination.</div>}
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Province / Jurisdiction</Label>
        <Select
          value={form.province}
          onValueChange={v => setForm(f => ({ ...f, province: v }))}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select province…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="federal" className="text-xs">Federal (NBC 2020)</SelectItem>
            <SelectItem value="BC" className="text-xs">British Columbia (BCBC 2024)</SelectItem>
            <SelectItem value="AB" className="text-xs">Alberta (NBC-AE 2023)</SelectItem>
            <SelectItem value="ON" className="text-xs">Ontario (OBC 2012)</SelectItem>
            <SelectItem value="SK" className="text-xs">Saskatchewan</SelectItem>
            <SelectItem value="MB" className="text-xs">Manitoba</SelectItem>
            <SelectItem value="QC" className="text-xs">Quebec</SelectItem>
            <SelectItem value="NB" className="text-xs">New Brunswick</SelectItem>
            <SelectItem value="NS" className="text-xs">Nova Scotia</SelectItem>
            <SelectItem value="PE" className="text-xs">Prince Edward Island</SelectItem>
            <SelectItem value="NL" className="text-xs">Newfoundland and Labrador</SelectItem>
            <SelectItem value="NT" className="text-xs">Northwest Territories</SelectItem>
            <SelectItem value="YT" className="text-xs">Yukon</SelectItem>
            <SelectItem value="NU" className="text-xs">Nunavut</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Sprinkler System</Label>
        <Select
          value={form.sprinklersRequired}
          onValueChange={v => setForm(f => ({ ...f, sprinklersRequired: v }))}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true" className="text-xs">Yes — sprinklered throughout</SelectItem>
            <SelectItem value="false" className="text-xs">No — unsprinklered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        size="sm"
        className="w-full"
        onClick={handleSave}
        disabled={!allSet || updateMutation.isPending}
      >
        {updateMutation.isPending
          ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Saving…</>
          : 'Save and Generate Brief'
        }
      </Button>
    </div>
  );
}

export function BriefTab({ projectId }: BriefTabProps) {
  const [editingInputs, setEditingInputs] = useState(false);
  const [bedroomCount, setBedroomCount] = useState('');
  const briefQuery = trpc.projects.generateBrief.useQuery({ projectId });
  const updateProjectMutation = trpc.projects.update.useMutation();
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();

  if (briefQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!briefQuery.data) return null;

  const { inputs, sections, completeness } = briefQuery.data;
  const navToCalc = (calculator: string) => setLocation(
    `/project/${projectId}?tab=calculations&calculator=${calculator}`,
  );
  const saveBedroomCount = async () => {
    const parsed = Number.parseInt(bedroomCount, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      toast.error('Enter a bedroom count of at least 1');
      return;
    }
    try {
      await updateProjectMutation.mutateAsync({ id: projectId, bedroomCount: parsed });
      await utils.projects.generateBrief.invalidate({ projectId });
      await briefQuery.refetch();
      toast.success('Occupant load updated');
    } catch {
      toast.error('Failed to save bedroom count');
    }
  };

  if (completeness < 100 || editingInputs) {
    return (
      <div className="space-y-3">
        {completeness < 100 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-medium text-amber-800">
              {completeness === 0
                ? 'Fill in the five inputs below to generate your pre-design compliance snapshot.'
                : `${completeness}% complete — fill in the remaining fields to unlock all sections.`}
            </p>
          </div>
        )}
        <InputsPanel
          projectId={projectId}
          defaultValues={inputs}
          onSaved={() => setEditingInputs(false)}
        />
        {editingInputs && (
          <button
            onClick={() => setEditingInputs(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Cancel
          </button>
        )}
      </div>
    );
  }

  const {
    occupantLoad, exitCount, travelDistance,
    exitWidth, sprinklers, accessibility, constructionType,
  } = sections;

  const allComputed =
    (occupantLoad?.value ?? null) !== null &&
    (exitCount?.required ?? null) !== null &&
    (exitWidth?.totalMm ?? null) !== null;

  return (
    <div className="space-y-3">
      {/* Header strip */}
      <div className="flex items-center justify-between py-0.5">
        <p className="text-xs text-muted-foreground">
          {inputs.occupancyGroup}
          {' · '}{inputs.grossFloorAreaM2?.toFixed(0)} m²
          {' · '}{inputs.storeys} {inputs.storeys === 1 ? 'storey' : 'storeys'}
          {' · '}{inputs.province ?? 'federal'}
          {' · '}{inputs.sprinklered ? 'sprinklered' : 'unsprinklered'}
        </p>
        <button
          onClick={() => setEditingInputs(true)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Edit inputs
        </button>
      </div>

      {/* 1. Occupant Load */}
      {occupantLoad && (
        <SectionCard
          title="Occupant Load"
          icon={Users}
          status={occupantLoad.value !== null ? 'ok' : 'warning'}
          value={occupantLoad.value !== null ? `${occupantLoad.value} persons` : '—'}
          subline={occupantLoad.factor == null
            ? undefined
            : typeof occupantLoad.factor === 'string'
              ? `${occupantLoad.factor} · ${occupantLoad.useType}`
              : `${occupantLoad.factor} m²/person · ${occupantLoad.useType}`}
          citation={occupantLoad.citation}
          note={occupantLoad.isDefault ? occupantLoad.note ?? undefined : undefined}
          linkLabel="Open Occupant Load Calculator"
          onLink={() => navToCalc('occupant-load')}
        >
          {inputs.occupancyGroup?.startsWith('C') && occupantLoad.value === null && (
            <div className="space-y-2 rounded border border-amber-200 bg-amber-50 p-3">
              <Label htmlFor="brief-bedroom-count" className="text-xs">Number of bedrooms</Label>
              <div className="flex gap-2">
                <Input
                  id="brief-bedroom-count"
                  type="number"
                  min={1}
                  value={bedroomCount}
                  onChange={event => setBedroomCount(event.target.value)}
                  placeholder="e.g. 3"
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  onClick={saveBedroomCount}
                  disabled={updateProjectMutation.isPending}
                >
                  {updateProjectMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Calculate'}
                </Button>
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* 2. Required Exits */}
      {exitCount && (
        <SectionCard
          title="Required Exits"
          icon={LogOut}
          status={exitCount.required !== null ? 'ok' : 'warning'}
          value={
            exitCount.required !== null
              ? `${exitCount.required} exit${exitCount.required !== 1 ? 's' : ''} minimum`
              : '—'
          }
          citation={exitCount.citation}
          note={
            exitCount.singleExitException
              ? 'Single-exit exception may apply (≤60 persons, ≤200 m²) — confirm all clause conditions'
              : undefined
          }
          linkLabel="Open Exit Calculator"
          onLink={() => navToCalc('exit')}
        />
      )}

      {/* 3. Travel Distance */}
      <SectionCard
        title="Travel Distance"
        icon={Navigation}
        status="ok"
        value={`${travelDistance.applicable} m maximum`}
        subline={`Unsprinklered ${travelDistance.unsprinklered} m · Sprinklered ${travelDistance.sprinklered} m`}
        citation={travelDistance.citation}
      >
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-2">
          <strong>Note:</strong> Travel distance shown is a straight-line estimate — actual walking
          distance through corridors and doors will be longer. Trace the path along room centerlines
          on your drawings to confirm compliance per NBC 3.4.2.5.
        </p>
      </SectionCard>

      {/* 4. Exit Width */}
      {exitWidth && (
        <SectionCard
          title="Required Exit Width"
          icon={ArrowLeftRight}
          status={exitWidth.totalMm !== null ? 'ok' : 'warning'}
          value={exitWidth.totalMm !== null ? `${exitWidth.totalMm} mm total` : '—'}
          subline={`${exitWidth.factor} mm/person · min ${exitWidth.perDoorMm} mm per door`}
          citation={exitWidth.citations.join(' · ')}
          linkLabel="Open Exit Calculator"
          onLink={() => navToCalc('exit')}
        />
      )}

      {/* 5. Sprinkler Requirement */}
      <SectionCard
        title="Sprinkler Requirement"
        icon={Droplets}
        status={
          sprinklers.codeRequired === null ? 'warning'
            : sprinklers.codeRequired ? 'warning' : 'ok'
        }
        value={
          sprinklers.codeRequired === null ? '—'
            : sprinklers.codeRequired ? 'Required by code' : 'Not required by code'
        }
        citation={sprinklers.citation}
        note={
          sprinklers.codeRequired && sprinklers.userSelected !== true
            ? 'Code mandates sprinklers — update project settings and confirm with mechanical'
            : sprinklers.userSelected === true && sprinklers.codeRequired === false
              ? 'User-selected sprinklered — verify code requirement applies to this building'
              : undefined
        }
        linkLabel="Open Sprinkler Calculator"
        onLink={() => navToCalc('sprinkler')}
      />

      {/* 6. Construction Type */}
      <SectionCard
        title="Construction Type"
        icon={Building}
        status="ok"
        value={constructionType.permitted[0] ?? '—'}
        citation={constructionType.citation}
        linkLabel="Open Construction Type Calculator"
        onLink={() => navToCalc('construction-type')}
      />

      {/* 7. Accessibility Triggers */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <UserCheck className="w-3.5 h-3.5" />
          <span className="text-xs uppercase tracking-wide font-medium">Accessibility Triggers</span>
        </div>
        <div className="divide-y">
          {[
            {
              label: 'Elevator likely required',
              value: accessibility.elevatorRequired,
              ref: 'NBC 3.8.2.4',
            },
            {
              label: 'Accessible washroom required',
              value: accessibility.accessibleWashroom,
              ref: 'NBC 3.8.2.8',
            },
            {
              label: 'Barrier-free path required',
              value: accessibility.barrierFreePath,
              ref: 'NBC 3.8.2.3',
            },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-1.5 text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className={row.value === true ? 'text-amber-600 font-medium' : 'text-green-600'}>
                {row.value === null ? '—' : row.value ? `Yes — ${row.ref}` : 'No'}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navToCalc('barrier-free')}
          className="flex items-center gap-1 text-xs text-blue-600 hover:underline pt-0.5"
        >
          Open Barrier-Free Calculator <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Generate Permit Package */}
      <div className="pt-1 pb-2">
        <Button
          className="w-full"
          disabled={!allComputed}
          onClick={() => setLocation(`/project/${projectId}?tab=permit_package`)}
        >
          Generate Permit Package →
        </Button>
        {!allComputed && (
          <p className="text-xs text-center text-muted-foreground mt-1.5">
            Complete all sections above to enable the permit package.
          </p>
        )}
      </div>
    </div>
  );
}
