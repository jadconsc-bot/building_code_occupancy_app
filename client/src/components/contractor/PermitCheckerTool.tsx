import { useState } from 'react';

const CITIES = [
  { id: 'calgary',    label: 'Calgary',     portal: 'https://www.calgary.ca/pda/pd/building-permits.html',      timeline: '3–4 weeks' },
  { id: 'edmonton',   label: 'Edmonton',    portal: 'https://www.edmonton.ca/business_economy/licences_permits/building-permits', timeline: '4–6 weeks' },
  { id: 'airdrie',    label: 'Airdrie',     portal: 'https://www.airdrie.ca/permits',                            timeline: '2–3 weeks' },
  { id: 'red-deer',   label: 'Red Deer',    portal: 'https://www.reddeer.ca/permits',                            timeline: '3–4 weeks' },
  { id: 'lethbridge', label: 'Lethbridge',  portal: 'https://www.lethbridge.ca/permits',                        timeline: '2–3 weeks' },
  { id: 'okotoks',    label: 'Okotoks',     portal: 'https://www.okotoks.ca/permits',                            timeline: '2–3 weeks' },
  { id: 'other',      label: 'Other AB',    portal: 'https://www.alberta.ca/permits',                            timeline: 'Varies' },
];

const PROJECTS = [
  { id: 'suite',      icon: '🏠', label: 'Basement Suite'   },
  { id: 'deck',       icon: '🪵', label: 'Deck'             },
  { id: 'garage',     icon: '🚗', label: 'Garage'           },
  { id: 'addition',   icon: '🏗️', label: 'Addition'         },
  { id: 'bath-reno',  icon: '🛁', label: 'Bathroom Reno'    },
  { id: 'kitchen',    icon: '🍳', label: 'Kitchen Reno'     },
  { id: 'window',     icon: '🪟', label: 'Window Replace'   },
  { id: 'furnace',    icon: '🔥', label: 'Furnace/HWT'      },
  { id: 'new-home',   icon: '🏘️', label: 'New Home'         },
  { id: 'other',      icon: '🔨', label: 'Other'            },
];

interface PermitResult {
  required: boolean;
  types: string[];
  docs: string[];
  note: string;
}

function computeResult(
  projectId: string,
  scopeAnswers: Record<string, boolean | null>,
  cityId: string,
): PermitResult {
  switch (projectId) {
    case 'deck': {
      const high = scopeAnswers.height === true;
      const big  = scopeAnswers.area   === true;
      return {
        required: true,
        types: ['Building Permit'],
        docs: ['Site plan showing deck location', 'Framing drawings (beam sizes, joist spans)', 'Footing details (depth, diameter)', 'Guard rail details if height > 600 mm'],
        note: `Permit required for all decks${high ? ' — guard rail required (height > 600mm)' : ''}.`,
      };
    }
    case 'suite':
      return {
        required: true,
        types: ['Building Permit', scopeAnswers.electrical ? 'Electrical Permit' : '', scopeAnswers.plumbing ? 'Plumbing Permit' : ''].filter(Boolean),
        docs: ['Floor plans (existing + proposed)', '1-hour fire separation details (ULC W301)', 'Egress window schedule', 'Smoke & CO detector locations'],
        note: 'Secondary suite permits require building + mechanical + electrical — apply together.',
      };
    case 'garage':
      return {
        required: true,
        types: ['Building Permit'],
        docs: ['Site plan with setbacks dimensioned', 'Floor plan + elevations', 'Foundation details'],
        note: 'Detached garage > 10 m² requires building permit.',
      };
    case 'addition':
      return {
        required: true,
        types: ['Building Permit', 'Electrical Permit (if any electrical)'],
        docs: ['Existing + proposed floor plans', 'Structural details', 'Site plan with addition shown'],
        note: 'Structural additions always require a permit.',
      };
    case 'bath-reno':
      return {
        required: scopeAnswers.moving === true || scopeAnswers.electrical === true,
        types: ['Building Permit (if moving walls)', 'Electrical Permit (if electrical work)', 'Plumbing Permit (if relocating fixtures)'].filter((_, i) => [scopeAnswers.moving, scopeAnswers.electrical, scopeAnswers.plumbing][i]),
        docs: ['Before/after floor plans', 'Fixture layout'],
        note: 'Cosmetic reno (tile, paint, fixtures in place) — no permit. Moving walls or adding circuits — permit required.',
      };
    case 'kitchen':
      return {
        required: scopeAnswers.moving === true || scopeAnswers.electrical === true,
        types: ['Building Permit (if moving walls)', 'Electrical Permit (if new circuits)'].filter((_, i) => [scopeAnswers.moving, scopeAnswers.electrical][i]),
        docs: ['Kitchen layout before/after', 'Electrical panel schedule if adding circuits'],
        note: 'New island with outlets, range hood circuits, or wall removal all require permits.',
      };
    case 'window':
      return {
        required: false,
        types: [],
        docs: [],
        note: 'Replacing a window in the same opening — no permit required in most Alberta municipalities. Enlarging the opening requires a building permit.',
      };
    case 'furnace':
      return {
        required: true,
        types: ['Gas Permit (TSSA/AB Safety Codes)'],
        docs: ['Equipment specs', 'Gas line sizing'],
        note: 'All gas appliance work requires a gas permit and Safety Codes inspection.',
      };
    case 'new-home':
      return {
        required: true,
        types: ['Development Permit', 'Building Permit', 'Electrical Permit', 'Gas Permit', 'Plumbing Permit'],
        docs: ['Site plan', 'Architectural drawings', 'Structural engineer schedule', 'Energy compliance (NECB/NBC 9.36)', 'Lot grading plan'],
        note: 'New home requires development approval before building permit application.',
      };
    default:
      return {
        required: scopeAnswers.structural === true || scopeAnswers.electrical === true,
        types: ['Building Permit (structural work)', 'Electrical Permit (electrical work)'].filter((_, i) => [scopeAnswers.structural, scopeAnswers.electrical][i]),
        docs: ['Plans showing proposed work', 'Structural details if applicable'],
        note: 'When in doubt, call your local Safety Codes office — unpermitted work can void home insurance.',
      };
  }
}

function getScopeQuestions(projectId: string): { key: string; label: string }[] {
  switch (projectId) {
    case 'deck':     return [{ key: 'height', label: 'Height above grade > 600 mm?' }, { key: 'area', label: 'Area > 10 m²?' }];
    case 'suite':    return [{ key: 'electrical', label: 'Electrical work?' }, { key: 'plumbing', label: 'New bathroom/plumbing?' }];
    case 'bath-reno':
    case 'kitchen':  return [{ key: 'moving', label: 'Moving or removing walls?' }, { key: 'electrical', label: 'Adding electrical circuits?' }, { key: 'plumbing', label: 'Relocating plumbing fixtures?' }];
    case 'other':    return [{ key: 'structural', label: 'Structural or framing changes?' }, { key: 'electrical', label: 'Electrical work?' }];
    default:         return [];
  }
}

export function PermitCheckerTool() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cityId, setCityId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [scopeAnswers, setScopeAnswers] = useState<Record<string, boolean | null>>({});

  const scopeQs = getScopeQuestions(projectId);
  const allAnswered = scopeQs.length === 0 || scopeQs.every(q => scopeAnswers[q.key] !== undefined && scopeAnswers[q.key] !== null);
  const result = allAnswered && cityId && projectId ? computeResult(projectId, scopeAnswers, cityId) : null;
  const city = CITIES.find(c => c.id === cityId);

  return (
    <div className="space-y-5 px-4 py-4 max-w-md mx-auto">
      {/* Step 1 — City */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Step 1 — City</p>
        <div className="grid grid-cols-2 gap-2">
          {CITIES.map(c => (
            <button
              key={c.id}
              onClick={() => { setCityId(c.id); setStep(2); }}
              className={`py-3 px-3 rounded-xl text-sm font-medium border transition-colors ${cityId === c.id ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-700'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — Project type */}
      {step >= 2 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">Step 2 — Project type</p>
          <div className="grid grid-cols-2 gap-2">
            {PROJECTS.map(p => (
              <button
                key={p.id}
                onClick={() => { setProjectId(p.id); setScopeAnswers({}); setStep(3); }}
                className={`flex items-center gap-2 py-3 px-3 rounded-xl text-sm font-medium border transition-colors ${projectId === p.id ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-700'}`}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Scope questions */}
      {step >= 3 && scopeQs.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Step 3 — Scope</p>
          {scopeQs.map(q => (
            <div key={q.key} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-700">{q.label}</span>
              <div className="flex gap-2">
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    onClick={() => setScopeAnswers(prev => ({ ...prev, [q.key]: v }))}
                    className={`px-4 py-1.5 rounded-xl text-xs font-medium border transition-colors ${scopeAnswers[q.key] === v ? (v ? 'bg-green-500 text-white border-green-500' : 'bg-gray-500 text-white border-gray-500') : 'bg-white border-gray-200 text-gray-600'}`}
                  >
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-2xl overflow-hidden border ${result.required ? 'border-red-200' : 'border-green-200'}`}>
          <div className={`px-4 py-3 ${result.required ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            <p className="font-bold text-lg">
              {result.required ? '🔴 PERMIT REQUIRED' : '✅ LIKELY NO PERMIT'}
            </p>
          </div>

          {result.types.length > 0 && (
            <div className="px-4 py-3 bg-white border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Permit types</p>
              {result.types.map(t => (
                <p key={t} className="text-sm font-medium text-gray-900">• {t}</p>
              ))}
            </div>
          )}

          {result.docs.length > 0 && (
            <div className="px-4 py-3 bg-white border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">What to bring</p>
              {result.docs.map(d => (
                <p key={d} className="text-sm text-gray-700">• {d}</p>
              ))}
            </div>
          )}

          {city && (
            <div className="px-4 py-3 bg-white border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{city.label} timeline</p>
              <p className="text-sm font-medium text-gray-900">~{city.timeline}</p>
            </div>
          )}

          <div className="px-4 py-3 bg-gray-50">
            <p className="text-xs text-gray-600 mb-3">{result.note}</p>
            {city && (
              <a
                href={city.portal}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#1B3A6B] text-white py-3 rounded-xl text-sm font-medium"
              >
                Open {city.label} Permits Portal →
              </a>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-center text-gray-400">Alberta Safety Codes Act • NBC 2020</p>
    </div>
  );
}
