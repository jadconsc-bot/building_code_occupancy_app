import { useState } from 'react';
import { checkSuitePermission, getMinSuiteCeilingHeight, type SuitePermissionResult, type SuiteProvince } from '@/lib/secondarySuiteRules';

const MUNICIPALITY_OPTIONS = [
  { value: 'calgary',   label: 'Calgary'   },
  { value: 'edmonton',  label: 'Edmonton'  },
  { value: 'airdrie',   label: 'Airdrie'   },
  { value: 'red deer',  label: 'Red Deer'  },
  { value: 'other',     label: 'Other'     },
];

const CEILING_OPTIONS = [
  { label: "6'5\" (1956mm)", ft: 6.42, mm: 1956 },
  { label: "7'0\" (2134mm)", ft: 7,    mm: 2134 },
  { label: "7'6\" (2286mm)", ft: 7.5,  mm: 2286 },
  { label: "8'0\" (2438mm)", ft: 8,    mm: 2438 },
  { label: "Higher",         ft: 9,    mm: 2743 },
];

const MIN_EGRESS_M2  = 0.35; // NBC 9.10.7

const PROVINCE_OPTIONS: { value: SuiteProvince; label: string }[] = [
  { value: 'AB', label: 'AB' },
  { value: 'BC', label: 'BC' },
  { value: 'ON', label: 'ON' },
];

interface CheckResult {
  label: string;
  pass: boolean | null;
  note: string;
}

function PermBadge({ r }: { r: SuitePermissionResult }) {
  const base = r.allowed === 'yes' ? 'bg-green-50 border-green-200 text-green-800'
    : r.allowed === 'conditional' ? 'bg-amber-50 border-amber-200 text-amber-800'
    : r.allowed === 'no' ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-gray-50 border-gray-200 text-gray-700';
  const icon = r.allowed === 'yes' ? '✅' : r.allowed === 'conditional' ? '⚠️' : r.allowed === 'no' ? '🚫' : 'ℹ️';
  const label = r.allowed === 'yes' ? 'Suite permitted' : r.allowed === 'conditional' ? 'Conditional approval' : r.allowed === 'no' ? 'Suite not permitted' : 'Zone unknown';
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${base}`}>
      <p className="font-semibold">{icon} {label}</p>
      <p className="mt-0.5">{r.reason}</p>
      <p className="text-xs mt-1 opacity-70">{r.bylaw}</p>
      {r.notes && <p className="text-xs mt-0.5 italic opacity-70">{r.notes}</p>}
    </div>
  );
}

export function SuiteCheckerTool() {
  const [province, setProvince] = useState<SuiteProvince>('AB');
  const [municipality, setMunicipality] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [ceilingMm, setCeilingMm] = useState(2134);
  const [hasEgress, setHasEgress] = useState<boolean | null>(null);
  const [egressAreaM2, setEgressAreaM2] = useState('');
  const [smokeAlarms, setSmokeAlarms] = useState<boolean | null>(null);
  const [coDetectors, setCoDetectors] = useState<boolean | null>(null);
  const [fireSep, setFireSep] = useState<boolean | null>(null);

  const egressArea = parseFloat(egressAreaM2) || 0;
  const minCeilingMm = Math.round(getMinSuiteCeilingHeight(province) * 1000);
  const ceilingRef = province === 'AB' ? 'NBC(AE) 2023 s.9.5.3.1(2)' : province === 'BC' ? 'BCBC 2024 9.7.2.1' : 'NBC 9.7.2.1';

  const checks: CheckResult[] = [
    {
      label: 'Ceiling height',
      pass: ceilingMm >= minCeilingMm,
      note: ceilingMm >= minCeilingMm
        ? `${ceilingMm} mm ✓ (min ${minCeilingMm} mm — ${ceilingRef})`
        : `${ceilingMm} mm ✗ Below ${minCeilingMm} mm minimum — must raise ceiling`,
    },
    {
      label: 'Egress window',
      pass: hasEgress === null ? null : hasEgress ? egressArea >= MIN_EGRESS_M2 : false,
      note: hasEgress === null
        ? 'Answer above'
        : !hasEgress
          ? 'No egress window — required in every sleeping room (NBC 9.10.7)'
          : egressArea >= MIN_EGRESS_M2
            ? `${egressArea.toFixed(2)} m² ✓ (min 0.35 m²)`
            : `${egressArea.toFixed(2)} m² ✗ Below 0.35 m² minimum`,
    },
    {
      label: 'Interconnected smoke alarms',
      pass: smokeAlarms,
      note: smokeAlarms === null
        ? 'Answer above'
        : smokeAlarms
          ? 'Interconnected ✓ (NBC 9.10.19)'
          : 'Not interconnected ✗ — all alarms must sound together',
    },
    {
      label: 'CO detectors',
      pass: coDetectors,
      note: coDetectors === null
        ? 'Answer above'
        : coDetectors
          ? 'Installed ✓'
          : 'Missing ✗ — required if fuel-burning appliance or attached garage',
    },
    {
      label: '1-hour fire separation',
      pass: fireSep,
      note: fireSep === null
        ? 'Answer above'
        : fireSep
          ? '1hr FRR ✓ (NBC 9.10.9.7 — ULC W301)'
          : '✗ Fire separation required between suite and house',
    },
  ];

  const answered = checks.filter(c => c.pass !== null);
  const passing  = answered.filter(c => c.pass === true);
  const failing  = answered.filter(c => c.pass === false);

  const overall = failing.length > 0 ? 'FAIL' : answered.length < checks.length ? 'CONDITIONAL' : 'PASS';
  const overallColor = overall === 'PASS' ? 'bg-green-100 text-green-800 border-green-200'
    : overall === 'FAIL' ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-amber-100 text-amber-800 border-amber-200';

  const Toggle = ({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) => (
    <div className="flex gap-2">
      <button
        onClick={() => onChange(true)}
        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${value === true ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-200 text-gray-700'}`}
      >
        Yes
      </button>
      <button
        onClick={() => onChange(false)}
        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${value === false ? 'bg-red-500 text-white border-red-500' : 'bg-white border-gray-200 text-gray-700'}`}
      >
        No
      </button>
    </div>
  );

  const permResult = municipality && municipality !== 'other'
    ? checkSuitePermission(municipality, zoneCode || undefined)
    : null;

  return (
    <div className="space-y-5 px-4 py-4 max-w-md mx-auto">
      {/* Province selector */}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-gray-700">Province</p>
        <div className="flex gap-2">
          {PROVINCE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setProvince(opt.value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${province === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Zone permission lookup */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Zone check (optional)</p>
        <div className="grid grid-cols-2 gap-2">
          {MUNICIPALITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setMunicipality(opt.value); setZoneCode(''); }}
              className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors ${municipality === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {municipality && municipality !== 'other' && (
          <input
            type="text"
            placeholder="Zone code — e.g. R-1, RF1 (optional)"
            value={zoneCode}
            onChange={e => setZoneCode(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
          />
        )}
        {permResult && <PermBadge r={permResult} />}
        {municipality === 'other' && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
            Contact your local planning department to confirm secondary suite eligibility.
          </p>
        )}
      </div>

      <div className="h-px bg-gray-100" />

      {/* Ceiling height */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Ceiling height</label>
        <div className="grid grid-cols-3 gap-2">
          {CEILING_OPTIONS.map(opt => (
            <button
              key={opt.mm}
              onClick={() => setCeilingMm(opt.mm)}
              className={`py-2.5 px-2 rounded-xl text-xs font-medium border transition-colors text-center ${ceilingMm === opt.mm ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Egress window */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Egress window present?</label>
        <Toggle value={hasEgress} onChange={setHasEgress} />
        {hasEgress && (
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Opening area (e.g. 0.35)"
              value={egressAreaM2}
              onChange={e => setEgressAreaM2(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">m²</span>
          </div>
        )}
      </div>

      {/* Smoke alarms */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Smoke alarms interconnected?</label>
        <Toggle value={smokeAlarms} onChange={setSmokeAlarms} />
      </div>

      {/* CO detectors */}
      <div className="space-y-2">
        <label className="text-sm font-medium">CO detectors installed?</label>
        <Toggle value={coDetectors} onChange={setCoDetectors} />
      </div>

      {/* Fire separation */}
      <div className="space-y-2">
        <label className="text-sm font-medium">1-hour fire separation (suite ↔ house)?</label>
        <Toggle value={fireSep} onChange={setFireSep} />
      </div>

      {/* Overall badge */}
      <div className={`border rounded-2xl px-4 py-3 text-center font-bold text-lg ${overallColor}`}>
        {overall === 'CONDITIONAL' ? '⚠️ ANSWER ALL QUESTIONS' : overall === 'PASS' ? '✅ PASS' : '❌ FAIL'}
      </div>

      {/* Results list */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Checklist</p>
        </div>
        {checks.map(c => (
          <div key={c.label} className="flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
            <span className="text-base mt-0.5 shrink-0">
              {c.pass === true ? '✅' : c.pass === false ? '❌' : '⬜'}
            </span>
            <div>
              <p className="text-sm font-medium">{c.label}</p>
              <p className={`text-xs mt-0.5 ${c.pass === false ? 'text-red-600' : 'text-gray-500'}`}>{c.note}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-gray-400">
        {province === 'AB' ? 'NBC(AE) 2023' : province === 'BC' ? 'BCBC 2024' : 'OBC 2012'} · s.9.5.3.1 · 9.10.7 · 9.10.9 · 9.10.19
      </p>
    </div>
  );
}
