import { useState, useEffect, useRef } from 'react';

const CITIES: Record<string, { kPa: number; label: string }> = {
  Calgary:          { kPa: 1.2, label: 'Calgary' },
  Edmonton:         { kPa: 1.1, label: 'Edmonton' },
  'Red Deer':       { kPa: 1.1, label: 'Red Deer' },
  Lethbridge:       { kPa: 0.9, label: 'Lethbridge' },
  'Grande Prairie': { kPa: 1.3, label: 'Grande Prairie' },
  'Fort McMurray':  { kPa: 1.4, label: 'Fort McMurray' },
  Airdrie:          { kPa: 1.2, label: 'Airdrie' },
  'Medicine Hat':   { kPa: 0.8, label: 'Medicine Hat' },
  'Spruce Grove':   { kPa: 1.1, label: 'Spruce Grove' },
};

const SLOPES = [
  { label: 'Flat 0°',  factor: 1.0, deg: 0   },
  { label: '2:12',     factor: 0.9, deg: 9.5  },
  { label: '4:12',     factor: 0.8, deg: 18.4 },
  { label: '6:12',     factor: 0.7, deg: 26.6 },
  { label: '8:12+',    factor: 0.5, deg: 33.7 },
];

function useTiltMeasurement() {
  const [pitch, setPitch] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const start = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      const perm = await (DeviceOrientationEvent as any).requestPermission();
      if (perm !== 'granted') return;
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

export function SnowLoadTool() {
  const [city, setCity] = useState('Calgary');
  const [slopeIdx, setSlopeIdx] = useState(2); // 4:12 default
  const { pitch, active, start, stop } = useTiltMeasurement();

  // Auto-pick nearest slope from tilt
  useEffect(() => {
    if (pitch === null) return;
    let nearest = 0;
    let minDiff = Infinity;
    SLOPES.forEach((s, i) => {
      const diff = Math.abs(s.deg - pitch);
      if (diff < minDiff) { minDiff = diff; nearest = i; }
    });
    setSlopeIdx(nearest);
  }, [pitch]);

  const ground = CITIES[city].kPa;
  const slope  = SLOPES[slopeIdx];
  const roofLoad = +(ground * slope.factor).toFixed(2);

  const loadColor = roofLoad >= 1.2 ? 'text-red-600' : roofLoad >= 0.9 ? 'text-amber-600' : 'text-green-700';

  return (
    <div className="space-y-5 px-4 py-4 max-w-md mx-auto">
      {/* City selector */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">City</label>
        <select
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-white"
          value={city}
          onChange={e => setCity(e.target.value)}
        >
          {Object.keys(CITIES).map(c => (
            <option key={c} value={c}>{c} — {CITIES[c].kPa} kPa</option>
          ))}
        </select>
      </div>

      {/* Slope buttons */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Roof slope</label>
        <div className="grid grid-cols-5 gap-1.5">
          {SLOPES.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setSlopeIdx(i)}
              className={`py-3 rounded-xl text-xs font-medium border transition-colors ${slopeIdx === i ? 'bg-sky-600 text-white border-sky-600' : 'bg-white border-gray-200 text-gray-700'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tilt measurement */}
      <button
        onClick={() => active ? stop() : start()}
        className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium w-full bg-white active:bg-gray-50"
      >
        📐 {active ? 'Stop measuring' : 'Measure slope with phone'}
      </button>
      {pitch !== null && (
        <p className="text-sm text-green-600 text-center font-medium">
          Detected: {pitch}° ≈ {(pitch / 90 * 12).toFixed(1)}:12 → auto-selected {SLOPES[slopeIdx].label}
        </p>
      )}

      {/* Result card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="bg-sky-50 px-4 py-3 border-b border-sky-100">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-800">Snow loads — NBC 4.1.6</p>
        </div>
        <div className="px-4">
          <div className="flex justify-between items-center py-3.5 border-b border-gray-50">
            <span className="text-sm text-gray-600">Ground snow (Ss)</span>
            <span className="font-semibold">{ground} kPa</span>
          </div>
          <div className="flex justify-between items-center py-3.5 border-b border-gray-50">
            <span className="text-sm text-gray-600">Roof slope factor (Cs)</span>
            <span className="font-semibold">{slope.factor}</span>
          </div>
          <div className="flex justify-between items-center py-4">
            <span className="text-sm font-bold">Roof snow load</span>
            <span className={`text-2xl font-bold ${loadColor}`}>{roofLoad} kPa</span>
          </div>
        </div>
        <div className="bg-amber-50 px-4 py-3 border-t border-amber-100">
          <p className="text-xs text-amber-700">
            ⚠️ Drift zone at walls/parapets — add 50% to drift areas (NBC 4.1.6.6)
          </p>
        </div>
      </div>

      <p className="text-xs text-center text-gray-400">NBC 4.1.6 · Supplement to NBC Climatic Data</p>
    </div>
  );
}
