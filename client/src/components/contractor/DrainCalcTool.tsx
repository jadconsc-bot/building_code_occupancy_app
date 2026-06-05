import { useState } from 'react';

const FIXTURES = [
  { key: 'toilets',     label: 'Toilets',      fu: 4, icon: '🚽' },
  { key: 'sinks',       label: 'Sinks',        fu: 1, icon: '🪣' },
  { key: 'showers',     label: 'Showers',      fu: 2, icon: '🚿' },
  { key: 'bathtubs',    label: 'Bathtubs',     fu: 2, icon: '🛁' },
  { key: 'washers',     label: 'Washers',      fu: 2, icon: '🧺' },
  { key: 'dishwashers', label: 'Dishwasher',   fu: 1, icon: '🍽️' },
] as const;

type FixtureKey = (typeof FIXTURES)[number]['key'];

function getMinDrainMm(fu: number): { mm: number; imperial: string } {
  if (fu <=  1) return { mm: 32,  imperial: '1¼"' };
  if (fu <=  3) return { mm: 38,  imperial: '1½"' };
  if (fu <=  6) return { mm: 50,  imperial: '2"'  };
  if (fu <= 20) return { mm: 75,  imperial: '3"'  };
  if (fu <= 60) return { mm: 100, imperial: '4"'  };
  if (fu <= 100)return { mm: 125, imperial: '5"'  };
  return               { mm: 150, imperial: '6"'  };
}

function getMinVentMm(fu: number): { mm: number; imperial: string } {
  if (fu <= 24) return { mm: 32,  imperial: '1¼"' };
  if (fu <= 50) return { mm: 38,  imperial: '1½"' };
  return               { mm: 50,  imperial: '2"'  };
}

export function DrainCalcTool() {
  const [counts, setCounts] = useState<Record<FixtureKey, number>>({
    toilets: 1, sinks: 2, showers: 1, bathtubs: 0, washers: 1, dishwashers: 0,
  });

  const totalFU = FIXTURES.reduce((sum, f) => sum + f.fu * counts[f.key], 0);
  const drain = getMinDrainMm(totalFU);
  const vent  = getMinVentMm(totalFU);

  const adjust = (key: FixtureKey, delta: number) => {
    setCounts(prev => ({ ...prev, [key]: Math.max(0, prev[key] + delta) }));
  };

  return (
    <div className="space-y-4 px-4 py-4 max-w-md mx-auto">
      <p className="text-xs text-gray-500 text-center">Tap +/− to set fixture count</p>

      {/* Fixture counters */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {FIXTURES.map((f, idx) => (
          <div key={f.key} className={`flex items-center px-4 py-4 ${idx < FIXTURES.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <span className="text-2xl mr-3">{f.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-xs text-gray-400">{f.fu} FU each</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => adjust(f.key, -1)}
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 text-xl font-bold flex items-center justify-center active:bg-gray-200"
              >
                −
              </button>
              <span className="text-lg font-bold w-5 text-center">{counts[f.key]}</span>
              <button
                onClick={() => adjust(f.key, 1)}
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 text-xl font-bold flex items-center justify-center active:bg-gray-200"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FU breakdown */}
      <div className="text-center">
        <span className="text-4xl font-bold text-purple-700">{totalFU}</span>
        <span className="text-lg text-gray-500 ml-2">fixture units</span>
      </div>

      {/* Result card */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-purple-100">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-800">Minimum pipe sizes</p>
        </div>
        <div className="px-4">
          <div className="flex justify-between items-center py-4 border-b border-purple-100">
            <div>
              <p className="text-sm text-gray-700">Main drain</p>
              <p className="text-xs text-gray-400">NBC 7.2.2.2</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-700">{drain.mm} mm</p>
              <p className="text-sm text-gray-500">({drain.imperial})</p>
            </div>
          </div>
          <div className="flex justify-between items-center py-4">
            <div>
              <p className="text-sm text-gray-700">Vent stack</p>
              <p className="text-xs text-gray-400">NBC 7.2.5.3</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-700">{vent.mm} mm</p>
              <p className="text-sm text-gray-500">({vent.imperial})</p>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">FU breakdown</p>
        {FIXTURES.filter(f => counts[f.key] > 0).map(f => (
          <div key={f.key} className="flex justify-between text-xs text-gray-600">
            <span>{counts[f.key]}× {f.label}</span>
            <span className="font-medium">{counts[f.key] * f.fu} FU</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-gray-400">NBC 7.2.2.2 (drain) · NBC 7.2.5.3 (vent)</p>
    </div>
  );
}
