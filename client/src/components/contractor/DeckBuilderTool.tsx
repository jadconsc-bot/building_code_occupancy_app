import { useState, useEffect, useRef } from 'react';

const ALBERTA_CITIES: Record<string, { footingDepth: number; label: string }> = {
  Calgary:         { footingDepth: 1200, label: 'Calgary' },
  Edmonton:        { footingDepth: 1200, label: 'Edmonton' },
  'Red Deer':      { footingDepth: 1200, label: 'Red Deer' },
  Lethbridge:      { footingDepth: 1050, label: 'Lethbridge' },
  'Grande Prairie':{ footingDepth: 1400, label: 'Grande Prairie' },
  'Fort McMurray': { footingDepth: 1400, label: 'Fort McMurray' },
  Airdrie:         { footingDepth: 1200, label: 'Airdrie' },
  'Spruce Grove':  { footingDepth: 1200, label: 'Spruce Grove' },
  Okotoks:         { footingDepth: 1200, label: 'Okotoks' },
  'Medicine Hat':  { footingDepth: 1100, label: 'Medicine Hat' },
};

function useTiltMeasurement() {
  const [pitch, setPitch] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const start = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      const permission = await (DeviceOrientationEvent as any).requestPermission();
      if (permission !== 'granted') return;
    }
    setActive(true);
    const handler = (e: DeviceOrientationEvent) => {
      if (e.beta !== null) setPitch(Math.round(Math.abs(e.beta)));
    };
    window.addEventListener('deviceorientation', handler);
    cleanupRef.current = () => window.removeEventListener('deviceorientation', handler);
  };

  const stop = () => {
    cleanupRef.current?.();
    setActive(false);
  };

  return { pitch, active, start, stop };
}

export function DeckBuilderTool() {
  const [city, setCity] = useState('Calgary');
  const [heightMm, setHeightMm] = useState(600);
  const [areaSqM, setAreaSqM] = useState('');
  const [ledger, setLedger] = useState(true);
  const { pitch, active, start, stop } = useTiltMeasurement();

  const area = parseFloat(areaSqM) || 0;
  const cityData = ALBERTA_CITIES[city];
  const guardRailRequired = heightMm > 600;
  const guardRailHeight = heightMm > 1800 ? 1070 : 900;
  const permitRequired = area > 10 || heightMm > 600;

  const Row = ({ label, value, warn }: { label: string; value: string; warn?: boolean }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold flex items-center gap-1 ${warn ? 'text-amber-600' : 'text-gray-900'}`}>
        {value} {warn && '⚠️'}
      </span>
    </div>
  );

  return (
    <div className="space-y-6 px-4 py-4 max-w-md mx-auto">
      {/* City */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">City</label>
        <select
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-white"
          value={city}
          onChange={e => setCity(e.target.value)}
        >
          {Object.keys(ALBERTA_CITIES).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Height slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <label className="text-sm font-medium">Height above grade</label>
          <span className="text-sm font-bold text-gray-900">{heightMm} mm</span>
        </div>
        <input
          type="range"
          min={0} max={3000} step={50}
          value={heightMm}
          onChange={e => setHeightMm(parseInt(e.target.value))}
          className="w-full h-3 rounded-full accent-amber-500"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0 mm</span>
          <span className="text-amber-500 font-medium">600 mm guard rail threshold</span>
          <span>3000 mm</span>
        </div>
      </div>

      {/* Area */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Deck area (m²)</label>
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            placeholder="e.g. 15"
            value={areaSqM}
            onChange={e => setAreaSqM(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base pr-12"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">m²</span>
        </div>
      </div>

      {/* Ledger toggle */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
        <div>
          <p className="text-sm font-medium">Ledger-attached to house</p>
          <p className="text-xs text-gray-500">vs. freestanding post</p>
        </div>
        <button
          onClick={() => setLedger(l => !l)}
          className={`w-12 h-6 rounded-full transition-colors ${ledger ? 'bg-amber-500' : 'bg-gray-300'}`}
        >
          <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${ledger ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Tilt measurement */}
      <div className="space-y-2">
        <button
          onClick={() => active ? stop() : start()}
          className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium w-full justify-center bg-white active:bg-gray-50"
        >
          📐 {active ? 'Stop measuring slope' : 'Measure slope with phone'}
        </button>
        {pitch !== null && (
          <p className="text-sm text-green-600 text-center font-medium">
            Detected: {pitch}° = {(pitch / 90 * 12).toFixed(1)}:12 pitch
          </p>
        )}
      </div>

      {/* Results */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Results — NBC 9.8.8</p>
        </div>
        <div className="px-4">
          <Row label="Guard rail required?" value={guardRailRequired ? 'YES' : 'NO'} warn={guardRailRequired} />
          {guardRailRequired && (
            <>
              <Row label="Guard rail height" value={`${guardRailHeight} mm`} />
              <Row label="Baluster spacing max" value="100 mm" />
            </>
          )}
          <Row label={`Footing depth (${city})`} value={`${cityData.footingDepth} mm`} />
          <Row label="Ledger type" value={ledger ? 'Attached — use through-bolts' : 'Freestanding — post footings'} />
          <Row label="Permit required?" value={permitRequired ? 'YES' : 'NO'} warn={permitRequired} />
        </div>
        {permitRequired && (
          <div className="bg-amber-50 px-4 py-3 border-t border-amber-100">
            <p className="text-xs text-amber-700">
              {area > 10 ? `Area ${area.toFixed(1)} m² exceeds 10 m² threshold. ` : ''}
              {heightMm > 600 ? `Height ${heightMm} mm exceeds 600 mm threshold.` : ''}
              Building permit required before construction.
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-gray-400">NBC 9.8.8 • ABC 2019 Part 9</p>
    </div>
  );
}
