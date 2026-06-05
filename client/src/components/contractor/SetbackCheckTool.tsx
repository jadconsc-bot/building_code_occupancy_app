import { useState } from 'react';

// NBC 9.10.14 — Spatial separation
// Unprotected opening percentage per limiting distance (LD)
// Simplified: max opening area = LD² × exposing face factor
// For residential buildings (Group C, 1-2 storey):
// maxAllowedPercent by LD per NBC Table 9.10.14.3

function getMaxOpeningPercent(ldM: number): number {
  // NBC Table 9.10.14.3 simplified (Group C, 1 storey, no sprinklers)
  if (ldM < 1.2)  return 0;
  if (ldM < 1.5)  return 5;
  if (ldM < 2.0)  return 10;
  if (ldM < 2.5)  return 20;
  if (ldM < 3.0)  return 35;
  if (ldM < 4.5)  return 60;
  if (ldM < 6.0)  return 80;
  return 100;
}

export function SetbackCheckTool() {
  const [ldM, setLdM] = useState(3.0);
  const [wallHeightM, setWallHeightM] = useState('2.7');
  const [wallWidthM, setWallWidthM] = useState('6.0');

  const wallH = parseFloat(wallHeightM) || 2.7;
  const wallW = parseFloat(wallWidthM) || 6.0;
  const exposingFaceM2 = wallH * wallW;
  const maxPercent = getMaxOpeningPercent(ldM);
  const maxOpeningM2 = +(exposingFaceM2 * maxPercent / 100).toFixed(2);

  const color = ldM < 1.2 ? 'red' : ldM < 4.5 ? 'amber' : 'green';
  const colorClasses = {
    red:   { bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-700',   badge: 'bg-red-100 text-red-800' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
  }[color];

  return (
    <div className="space-y-5 px-4 py-4 max-w-md mx-auto">
      {/* Limiting distance slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <label className="text-sm font-medium">Distance to property line</label>
          <span className="text-2xl font-bold text-gray-900">{ldM.toFixed(1)} m</span>
        </div>
        <input
          type="range"
          min={0.5} max={10} step={0.1}
          value={ldM}
          onChange={e => setLdM(parseFloat(e.target.value))}
          className="w-full h-4 rounded-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0.5 m</span>
          <span className="text-red-500">1.2 m min</span>
          <span>10 m</span>
        </div>
      </div>

      {/* Wall dimensions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Wall height (m)</label>
          <input
            type="number"
            inputMode="decimal"
            value={wallHeightM}
            onChange={e => setWallHeightM(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Wall width (m)</label>
          <input
            type="number"
            inputMode="decimal"
            value={wallWidthM}
            onChange={e => setWallWidthM(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base"
          />
        </div>
      </div>

      {/* Result */}
      <div className={`${colorClasses.bg} ${colorClasses.border} border rounded-2xl overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${colorClasses.border}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${colorClasses.text}`}>
            Result — NBC 9.10.14 Spatial Separation
          </p>
        </div>

        {ldM < 1.2 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-3xl font-bold text-red-700">NO OPENINGS</p>
            <p className="text-sm text-red-600 mt-2">
              Distance &lt; 1.2 m — no unprotected openings permitted
            </p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Max unprotected opening area</p>
              <p className={`text-4xl font-bold ${colorClasses.text}`}>{maxOpeningM2} m²</p>
              <p className="text-sm text-gray-500 mt-1">
                ({maxPercent}% of {exposingFaceM2.toFixed(1)} m² wall)
              </p>
            </div>
            <div className={`rounded-xl px-3 py-2 ${colorClasses.badge} text-xs text-center font-medium`}>
              LD = {ldM.toFixed(1)} m → {maxPercent}% openings allowed
            </div>
          </div>
        )}

        {ldM >= 1.2 && ldM < 4.5 && (
          <div className={`px-4 py-3 border-t ${colorClasses.border}`}>
            <p className={`text-xs ${colorClasses.text}`}>
              ⚠️ Restricted zone — windows and doors count toward unprotected area.
              Consider fireproofing or moving openings to other walls.
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-gray-400">NBC 9.10.14 · Table 9.10.14.3 (Group C, 1-2 storey)</p>
    </div>
  );
}
