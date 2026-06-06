import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, ArrowRight, Layers } from "lucide-react";
import { SaveButton } from "@/components/CalculatorWithSave";
import {
  FLOOR_JOIST_SPANS, CEILING_JOIST_SPANS,
  SIZE_LABELS, SPECIES_LABELS,
  getMaxSpan, getRafterMaxSpan,
  findMinimumSize, findMinimumRafterSize, getBeamMaxSpan,
  CITY_SNOW_LOADS, SLOPE_FACTORS, BEAM_SPANS_SPF,
  type SpeciesGroup, type LumberSize, type SpacingMm,
} from "@/lib/woodFrameSpanTables";

type TabType = 'floorJoist' | 'ceilingJoist' | 'roofRafter' | 'beam';
type ModeType = 'check' | 'size';

const TABS: { id: TabType; label: string; nbcRef: string }[] = [
  { id: 'floorJoist',   label: 'Floor Joists',    nbcRef: 'NBC 9.23.4.2-A' },
  { id: 'ceilingJoist', label: 'Ceiling Joists',  nbcRef: 'NBC 9.23.4.2-C' },
  { id: 'roofRafter',   label: 'Roof Rafters',    nbcRef: 'NBC 9.23.4.2-E/F/G' },
  { id: 'beam',         label: 'Beams',            nbcRef: 'NBC 9.23.4.3' },
];

const SIZES: LumberSize[]    = ['38x89', '38x140', '38x184', '38x235', '38x286'];
const SPACINGS: SpacingMm[]  = [300, 400, 600];
const SPECIES: SpeciesGroup[] = ['SPF', 'HF', 'DFL', 'Northern'];
const BEAM_SIZES: LumberSize[] = ['38x140', '38x184', '38x235', '38x286'];

// ── Span SVG Diagram ─────────────────────────────────────────────────────────
function SpanDiagram({
  requiredM,
  allowableM,
  pass,
}: {
  requiredM: number;
  allowableM: number;
  pass: boolean;
}) {
  const W = 340;
  const barY = 38;
  const labelY = 60;
  const pad = 24;
  const inner = W - 2 * pad;
  const maxM = Math.max(allowableM, requiredM) * 1.08;
  const allowX = pad + (allowableM / maxM) * inner;
  const reqX   = pad + (requiredM  / maxM) * inner;
  const barColor = pass ? '#16a34a' : '#dc2626';

  return (
    <svg viewBox={`0 0 ${W} 72`} className="w-full max-w-sm" aria-hidden="true">
      {/* base line */}
      <line x1={pad} y1={barY} x2={W - pad} y2={barY} stroke="#e5e7eb" strokeWidth={2} />
      {/* allowable span bar */}
      <line x1={pad} y1={barY} x2={allowX} y2={barY} stroke={barColor} strokeWidth={5} strokeLinecap="round" />
      {/* required span dashed */}
      <line x1={pad} y1={barY} x2={reqX} y2={barY} stroke="#6b7280" strokeWidth={2} strokeDasharray="5,3" />
      {/* tick — allowable */}
      <line x1={allowX} y1={barY - 8} x2={allowX} y2={barY + 8} stroke={barColor} strokeWidth={2} />
      {/* tick — required */}
      <line x1={reqX} y1={barY - 6} x2={reqX} y2={barY + 6} stroke="#6b7280" strokeWidth={1.5} />
      {/* left support */}
      <polygon points={`${pad},${barY + 9} ${pad - 7},${barY + 22} ${pad + 7},${barY + 22}`} fill="#374151" />
      {/* right support */}
      <polygon points={`${W - pad},${barY + 9} ${W - pad - 7},${barY + 22} ${W - pad + 7},${barY + 22}`} fill="#374151" />
      {/* labels */}
      <text x={allowX} y={labelY} textAnchor="middle" fontSize={9} fill={barColor} fontWeight="600">
        {allowableM.toFixed(2)}m max
      </text>
      <text x={reqX} y={labelY + 10} textAnchor="middle" fontSize={9} fill="#6b7280">
        {requiredM.toFixed(2)}m required
      </text>
    </svg>
  );
}

// ── Result card ──────────────────────────────────────────────────────────────
function ResultCard({
  maxM,
  requiredM,
  nbcRef,
  upgradeTo,
}: {
  maxM: number;
  requiredM: number;
  nbcRef: string;
  upgradeTo?: { size: LumberSize; maxM: number } | null;
}) {
  const margin = +(maxM - requiredM).toFixed(2);
  const pass   = margin >= 0;

  return (
    <div className="space-y-3 mt-4">
      <div className={`rounded-lg border p-4 space-y-2 text-sm ${pass ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Max allowable span ({nbcRef})</span>
          <span className="font-mono font-semibold">{maxM.toFixed(2)} m</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Required span</span>
          <span className="font-mono font-semibold">{requiredM.toFixed(2)} m</span>
        </div>
        <div className="flex justify-between border-t pt-2">
          <span className="text-muted-foreground">{pass ? 'Margin' : 'Shortfall'}</span>
          <span className={`font-mono font-bold ${pass ? 'text-green-700' : 'text-red-700'}`}>
            {margin >= 0 ? '+' : ''}{margin.toFixed(2)} m
          </span>
        </div>
        <div className="flex items-center justify-between border-t pt-2">
          <span className="font-semibold">Status</span>
          {pass
            ? <span className="flex items-center gap-1 text-green-700 font-bold"><CheckCircle2 className="w-4 h-4" /> PASS</span>
            : <span className="flex items-center gap-1 text-red-700 font-bold"><XCircle className="w-4 h-4" /> FAIL</span>
          }
        </div>
        {!pass && upgradeTo && (
          <div className="flex items-center gap-2 text-xs text-green-700 border-t pt-2">
            <ArrowRight className="w-3 h-3 shrink-0" />
            Upgrade to <strong>{SIZE_LABELS[upgradeTo.size]}</strong> → max {upgradeTo.maxM.toFixed(2)} m
          </div>
        )}
        <p className="text-xs text-muted-foreground pt-1">Ref: Span Table {nbcRef}</p>
      </div>
      <SpanDiagram requiredM={requiredM} allowableM={maxM} pass={pass} />
    </div>
  );
}

// ── Spacing button group ─────────────────────────────────────────────────────
function SpacingButtons({
  value,
  onChange,
}: {
  value: SpacingMm;
  onChange: (v: SpacingMm) => void;
}) {
  return (
    <div className="flex gap-1">
      {SPACINGS.map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-3 py-1.5 text-sm rounded border font-mono transition-colors ${
            value === s
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-border hover:bg-muted'
          }`}
        >
          {s}mm
        </button>
      ))}
    </div>
  );
}

// ── Shared select components ─────────────────────────────────────────────────
function SpeciesSelect({ value, onChange }: { value: SpeciesGroup; onChange: (v: SpeciesGroup) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Species</label>
      <Select value={value} onValueChange={v => onChange(v as SpeciesGroup)}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {SPECIES.map(s => <SelectItem key={s} value={s}>{SPECIES_LABELS[s]}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function SizeSelect({
  value,
  onChange,
  sizes = SIZES,
}: {
  value: LumberSize;
  onChange: (v: LumberSize) => void;
  sizes?: LumberSize[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Size</label>
      <Select value={value} onValueChange={v => onChange(v as LumberSize)}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {sizes.map(s => <SelectItem key={s} value={s}>{SIZE_LABELS[s]}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Floor / Ceiling Joist Tab ────────────────────────────────────────────────
function JoistTab({ tableType }: { tableType: 'floorJoist' | 'ceilingJoist' }) {
  const [mode,    setMode]    = useState<ModeType>('check');
  const [species, setSpecies] = useState<SpeciesGroup>('SPF');
  const [size,    setSize]    = useState<LumberSize>('38x184');
  const [spacing, setSpacing] = useState<SpacingMm>(400);
  const [spanInput, setSpanInput] = useState('');
  const [sizeSpan, setSizeSpan] = useState('');

  const nbcRef = tableType === 'floorJoist' ? 'NBC 9.23.4.2-A' : 'NBC 9.23.4.2-C';
  const maxM   = getMaxSpan(tableType, species, size, spacing);
  const reqM   = parseFloat(spanInput);
  const hasReq = !isNaN(reqM) && reqM > 0;

  // upgrade suggestion
  const upgradeSize = hasReq && maxM !== null && maxM < reqM
    ? (() => {
        for (const s of SIZES) {
          const m = getMaxSpan(tableType, species, s, spacing);
          if (m !== null && m >= reqM) return { size: s, maxM: m };
        }
        return null;
      })()
    : null;

  // Mode B
  const reqSizeM  = parseFloat(sizeSpan);
  const minSize   = !isNaN(reqSizeM) && reqSizeM > 0
    ? findMinimumSize(tableType, species, spacing, reqSizeM)
    : null;
  const minSizeMaxM = minSize ? getMaxSpan(tableType, species, minSize, spacing) : null;

  const saveData = maxM && hasReq ? {
    tableType, species, size, spacingMm: spacing,
    requiredSpanM: reqM, maxAllowableSpanM: maxM,
    marginM: +(maxM - reqM).toFixed(2),
    isCompliant: maxM >= reqM,
    nbcRef,
  } : null;

  return (
    <div className="space-y-5">
      {tableType === 'ceilingJoist' && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          Attic not accessible by stairway (no storage load). For attic accessible by stairway,
          spans are significantly shorter — see NBC Span Table 9.23.4.2-D or consult your building department.
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(['check', 'size'] as ModeType[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
              mode === m ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m === 'check' ? 'Check my member' : 'Size for me'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SpeciesSelect value={species} onChange={setSpecies} />
        {mode === 'check' && <SizeSelect value={size} onChange={setSize} />}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing (o.c.)</label>
        <SpacingButtons value={spacing} onChange={setSpacing} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {mode === 'check' ? 'Actual span (m)' : 'Required span (m)'}
        </label>
        <input
          type="number"
          min="0.5"
          max="15"
          step="0.01"
          placeholder="e.g. 3.96"
          value={mode === 'check' ? spanInput : sizeSpan}
          onChange={e => mode === 'check' ? setSpanInput(e.target.value) : setSizeSpan(e.target.value)}
          className="w-40 h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* MODE A result */}
      {mode === 'check' && maxM !== null && hasReq && (
        <>
          <ResultCard
            maxM={maxM}
            requiredM={reqM}
            nbcRef={nbcRef}
            upgradeTo={upgradeSize}
          />
          {saveData && (
            <SaveButton
              calculatorType="woodFrameSpan"
              inputs={{ tableType, species, size, spacingMm: spacing }}
              results={saveData}
            />
          )}
        </>
      )}

      {/* MODE B result */}
      {mode === 'size' && !isNaN(reqSizeM) && reqSizeM > 0 && (
        <div className="rounded-lg border p-4 space-y-2 text-sm bg-muted/30">
          {minSize ? (
            <>
              <p className="font-medium">Minimum size required</p>
              <p className="text-lg font-bold text-primary">{SIZE_LABELS[minSize]}</p>
              <p className="text-muted-foreground">Max span at this size: <span className="font-mono font-semibold text-foreground">{minSizeMaxM?.toFixed(2)} m</span></p>
              <p className="text-xs text-muted-foreground">NBC Reference: Span Table {nbcRef}</p>
            </>
          ) : (
            <p className="text-amber-700">Span exceeds all table values for this species and spacing. An engineer-designed member is required.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Roof Rafter Tab ──────────────────────────────────────────────────────────
function RafterTab() {
  const [mode,    setMode]    = useState<ModeType>('check');
  const [species, setSpecies] = useState<SpeciesGroup>('SPF');
  const [size,    setSize]    = useState<LumberSize>('38x184');
  const [spacing, setSpacing] = useState<SpacingMm>(400);
  const [spanInput, setSpanInput] = useState('');
  const [sizeSpan, setSizeSpan]   = useState('');
  const [city,    setCity]    = useState('Calgary');
  const [slopeIdx, setSlopeIdx] = useState(2); // 4:12 default
  const [manualSnow, setManualSnow] = useState('');

  const cityData     = CITY_SNOW_LOADS[city];
  const groundSnow   = cityData?.groundSnowKPa ?? 1.2;
  const slopeFactor  = SLOPE_FACTORS[slopeIdx].factor;
  const roofSnow     = +(groundSnow * slopeFactor).toFixed(2);
  const snowKPa      = parseFloat(manualSnow) > 0 ? parseFloat(manualSnow) : roofSnow;

  const nbcRef = 'NBC 9.23.4.2-E/F/G';
  const maxM   = getRafterMaxSpan(species, size, spacing, snowKPa);
  const reqM   = parseFloat(spanInput);
  const hasReq = !isNaN(reqM) && reqM > 0;

  const upgradeSize = hasReq && maxM !== null && maxM < reqM
    ? (() => {
        for (const s of SIZES) {
          const m = getRafterMaxSpan(species, s, spacing, snowKPa);
          if (m !== null && m >= reqM) return { size: s, maxM: m };
        }
        return null;
      })()
    : null;

  const reqSizeM  = parseFloat(sizeSpan);
  const minSize   = !isNaN(reqSizeM) && reqSizeM > 0
    ? findMinimumRafterSize(species, spacing, reqSizeM, snowKPa)
    : null;
  const minSizeMaxM = minSize ? getRafterMaxSpan(species, minSize, spacing, snowKPa) : null;

  const saveData = maxM && hasReq ? {
    tableType: 'roofRafter' as const,
    species, size, spacingMm: spacing,
    requiredSpanM: reqM, maxAllowableSpanM: maxM,
    marginM: +(maxM - reqM).toFixed(2),
    isCompliant: maxM >= reqM,
    nbcRef,
    snowLoadKPa: snowKPa,
    city,
  } : null;

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(['check', 'size'] as ModeType[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
              mode === m ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m === 'check' ? 'Check my member' : 'Size for me'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SpeciesSelect value={species} onChange={setSpecies} />
        {mode === 'check' && <SizeSelect value={size} onChange={setSize} />}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing (o.c.)</label>
        <SpacingButtons value={spacing} onChange={setSpacing} />
      </div>

      {/* Snow load helper */}
      <div className="rounded-lg border p-3 space-y-3 bg-muted/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Snow Load</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">City (ground snow Ss)</label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CITY_SNOW_LOADS).map(([c, d]) => (
                  <SelectItem key={c} value={c}>{c} ({d.province}) — {d.groundSnowKPa} kPa</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Roof slope</label>
            <Select value={String(slopeIdx)} onValueChange={v => setSlopeIdx(Number(v))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SLOPE_FACTORS.map((sf, i) => (
                  <SelectItem key={i} value={String(i)}>{sf.label} (factor {sf.factor})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Ground snow: <strong className="text-foreground">{groundSnow} kPa</strong></span>
          <span>Slope factor: <strong className="text-foreground">{slopeFactor}</strong></span>
          <span>Roof snow load: <strong className="text-foreground">{roofSnow} kPa</strong></span>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Override roof snow load (kPa)</label>
          <input
            type="number" min="0.5" max="6" step="0.1" placeholder={String(roofSnow)}
            value={manualSnow}
            onChange={e => setManualSnow(e.target.value)}
            className="w-28 h-8 px-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {mode === 'check' ? 'Actual rafter span (m)' : 'Required rafter span (m)'}
        </label>
        <input
          type="number" min="0.5" max="12" step="0.01" placeholder="e.g. 4.20"
          value={mode === 'check' ? spanInput : sizeSpan}
          onChange={e => mode === 'check' ? setSpanInput(e.target.value) : setSizeSpan(e.target.value)}
          className="w-40 h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {mode === 'check' && maxM !== null && hasReq && (
        <>
          <ResultCard maxM={maxM} requiredM={reqM} nbcRef={nbcRef} upgradeTo={upgradeSize} />
          {saveData && (
            <SaveButton
              calculatorType="woodFrameSpan"
              inputs={{ tableType: 'roofRafter', species, size, spacingMm: spacing, snowLoadKPa: snowKPa, city }}
              results={saveData}
            />
          )}
        </>
      )}

      {mode === 'size' && !isNaN(reqSizeM) && reqSizeM > 0 && (
        <div className="rounded-lg border p-4 space-y-2 text-sm bg-muted/30">
          {minSize ? (
            <>
              <p className="font-medium">Minimum size required</p>
              <p className="text-lg font-bold text-primary">{SIZE_LABELS[minSize]}</p>
              <p className="text-muted-foreground">Max span at this size: <span className="font-mono font-semibold text-foreground">{minSizeMaxM?.toFixed(2)} m</span></p>
              <p className="text-xs text-muted-foreground">Roof snow load used: {snowKPa} kPa · Ref: Span Table {nbcRef}</p>
            </>
          ) : (
            <p className="text-amber-700">Span exceeds all table values for this species, spacing, and snow load. Engineer-designed member required.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Beam Tab ─────────────────────────────────────────────────────────────────
function BeamTab() {
  const [size,            setSize]            = useState<LumberSize>('38x235');
  const [supportedLength, setSupportedLength] = useState('');
  const [beamSpan,        setBeamSpan]        = useState('');

  const supM  = parseFloat(supportedLength);
  const reqM  = parseFloat(beamSpan);
  const maxM  = !isNaN(supM) && supM > 0 ? getBeamMaxSpan(size, supM) : null;
  const hasReq = !isNaN(reqM) && reqM > 0;
  const nbcRef = 'NBC 9.23.4.3';

  const upgradeSize = hasReq && maxM !== null && maxM < reqM
    ? (() => {
        for (const s of BEAM_SIZES) {
          const m = !isNaN(supM) ? getBeamMaxSpan(s, supM) : null;
          if (m !== null && m >= reqM) return { size: s, maxM: m };
        }
        return null;
      })()
    : null;

  const saveData = maxM && hasReq ? {
    tableType: 'beam' as const,
    species: 'SPF' as SpeciesGroup,
    size,
    spacingMm: 0 as SpacingMm,
    requiredSpanM: reqM,
    maxAllowableSpanM: maxM,
    marginM: +(maxM - reqM).toFixed(2),
    isCompliant: maxM >= reqM,
    nbcRef,
    supportedLengthM: supM,
  } : null;

  return (
    <div className="space-y-5">
      <div className="text-xs text-muted-foreground bg-muted/30 border rounded p-2">
        <strong>Supported length</strong> = half the sum of joist spans on each side of the beam.
        Measure from beam centreline to outer wall on each side, add them, divide by 2.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SizeSelect value={size} onChange={setSize} sizes={BEAM_SIZES} />
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Plies</label>
          <div className="h-9 flex items-center">
            <Badge variant="secondary" className="text-sm px-3 py-1">3-ply SPF</Badge>
            <span className="text-xs text-muted-foreground ml-2">(2-ply table coming soon)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Supported length (m)</label>
          <input
            type="number" min="1" max="6" step="0.1" placeholder="e.g. 3.0"
            value={supportedLength}
            onChange={e => setSupportedLength(e.target.value)}
            className="w-full h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Beam span (m)</label>
          <input
            type="number" min="0.5" max="8" step="0.01" placeholder="e.g. 3.50"
            value={beamSpan}
            onChange={e => setBeamSpan(e.target.value)}
            className="w-full h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {maxM !== null && hasReq && (
        <>
          <ResultCard maxM={maxM} requiredM={reqM} nbcRef={nbcRef} upgradeTo={upgradeSize} />
          {saveData && (
            <SaveButton
              calculatorType="woodFrameSpan"
              inputs={{ tableType: 'beam', species: 'SPF', size, supportedLengthM: supM }}
              results={saveData}
            />
          )}
        </>
      )}

      {/* Supported length table hint */}
      <div className="overflow-x-auto rounded border text-xs">
        <table className="w-full">
          <thead>
            <tr className="bg-muted">
              <th className="px-3 py-2 text-left font-semibold">3-ply SPF size</th>
              {[1.8, 2.4, 3.0, 3.6, 4.2].map(l => (
                <th key={l} className="px-2 py-2 text-center font-medium text-muted-foreground">{l}m supp.</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BEAM_SPANS_SPF.map((row, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-1.5 font-medium">{SIZE_LABELS[row.size]}</td>
                {[1.8, 2.4, 3.0, 3.6, 4.2].map(l => (
                  <td key={l} className="px-2 py-1.5 text-center font-mono">
                    {row.supportedLengths[l]?.toFixed(2) ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export function WoodFrameSpanCalculator() {
  const [activeTab, setActiveTab] = useState<TabType>('floorJoist');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Layers className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <CardTitle>Wood Frame Span Calculator</CardTitle>
            <CardDescription className="mt-1">
              Floor joists · Ceiling joists · Roof rafters · Beams — NBC Part 9 Span Tables
            </CardDescription>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mt-3 border-b pb-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'floorJoist'   && <JoistTab tableType="floorJoist" />}
        {activeTab === 'ceilingJoist' && <JoistTab tableType="ceilingJoist" />}
        {activeTab === 'roofRafter'   && <RafterTab />}
        {activeTab === 'beam'         && <BeamTab />}
      </CardContent>
    </Card>
  );
}
