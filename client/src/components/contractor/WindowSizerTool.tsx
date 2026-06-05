import { useState, useRef, useCallback } from 'react';

// NBC 9.10.7 minimums
const MIN_HEIGHT_MM   = 380;
const MIN_WIDTH_MM    = 380;
const MIN_AREA_M2     = 0.35;
const MAX_SILL_MM     = 900;
// NBC 9.9.10 window well
const MIN_WELL_PROJ_MM  = 760;

type InputMode = 'manual' | 'camera';
type SwingType = 'in' | 'out' | 'slider';

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

interface CameraMeasureProps {
  onMeasure: (mm: number) => void;
  onClose: () => void;
}

function CameraMeasure({ onMeasure, onClose }: CameraMeasureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [refMm] = useState(85.6);
  const [phase, setPhase] = useState<'ref' | 'measure'>('ref');
  const [refPixels, setRefPixels] = useState<number | null>(null);
  const [error, setError] = useState('');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch {
      setError('Camera unavailable. Enter dimensions manually.');
    }
  };

  const drawOverlay = useCallback((pts: { x: number; y: number }[]) => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#22c55e';
      ctx.fill();
    });
    if (pts.length === 2) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, []);

  const handleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    const newPts = [...points, { x, y }];

    if (newPts.length === 2) {
      const dx = newPts[1].x - newPts[0].x;
      const dy = newPts[1].y - newPts[0].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (phase === 'ref') {
        setRefPixels(dist);
        setPhase('measure');
        setPoints([]);
        drawOverlay([]);
        return;
      } else if (refPixels) {
        const realMm = (dist / refPixels) * refMm;
        onMeasure(Math.round(realMm));
        onClose();
        return;
      }
    }

    setPoints(newPts);
    drawOverlay(newPts);
  }, [points, phase, refPixels, refMm, drawOverlay, onMeasure, onClose]);

  const videoWidth = 320;
  const videoHeight = 240;

  return (
    <div className="space-y-3 bg-black rounded-2xl overflow-hidden">
      {!streaming ? (
        <div className="p-4 space-y-3 text-center">
          <p className="text-white text-sm">
            Place a credit card (85.6 × 54mm) in frame for scale, then tap two points to measure.
          </p>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={startCamera}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-medium"
          >
            📷 Open Camera
          </button>
          <button onClick={onClose} className="w-full text-gray-400 text-sm py-2">Cancel</button>
        </div>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full"
            onLoadedMetadata={() => {
              if (overlayRef.current && videoRef.current) {
                overlayRef.current.width = videoRef.current.videoWidth || videoWidth;
                overlayRef.current.height = videoRef.current.videoHeight || videoHeight;
              }
            }}
          />
          <canvas
            ref={canvasRef}
            className="hidden"
            width={videoWidth}
            height={videoHeight}
          />
          <canvas
            ref={overlayRef}
            width={videoWidth}
            height={videoHeight}
            className="absolute inset-0 w-full h-full touch-none"
            onClick={handleTap}
            onTouchStart={handleTap}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-3 py-2">
            <p className="text-white text-xs text-center">
              {phase === 'ref'
                ? `Step 1: Tap two ends of the credit card (${refMm}mm)`
                : 'Step 2: Tap two points to measure the window'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function WindowSizerTool() {
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [heightMm, setHeightMm] = useState('');
  const [widthMm, setWidthMm] = useState('');
  const [sillMm, setSillMm] = useState('');
  const [belowGrade, setBelowGrade] = useState(false);
  const [wellProjMm, setWellProjMm] = useState('');
  const [wellDepthMm, setWellDepthMm] = useState('');
  const [swingType, setSwingType] = useState<SwingType>('out');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'height' | 'width'>('height');

  const h = parseFloat(heightMm) || 0;
  const w = parseFloat(widthMm) || 0;
  const s = parseFloat(sillMm) || 0;
  const proj = parseFloat(wellProjMm) || 0;
  const area = h > 0 && w > 0 ? (h / 1000) * (w / 1000) : 0;

  const checks = {
    area:   { val: area,  pass: area >= MIN_AREA_M2,           label: 'Opening area',     unit: `${area.toFixed(2)} m²`,   req: `min ${MIN_AREA_M2} m²` },
    height: { val: h,     pass: h >= MIN_HEIGHT_MM,            label: 'Clear height',     unit: `${h} mm`,                 req: `min ${MIN_HEIGHT_MM} mm` },
    width:  { val: w,     pass: w >= MIN_WIDTH_MM,             label: 'Clear width',      unit: `${w} mm`,                 req: `min ${MIN_WIDTH_MM} mm` },
    sill:   { val: s,     pass: s > 0 && s <= MAX_SILL_MM,    label: 'Sill height',      unit: `${s} mm`,                 req: `max ${MAX_SILL_MM} mm AFF` },
    well:   { val: proj,  pass: !belowGrade || proj >= MIN_WELL_PROJ_MM, label: 'Well projection', unit: belowGrade ? `${proj} mm` : 'N/A', req: `min ${MIN_WELL_PROJ_MM} mm` },
  };

  const allAnswered = h > 0 && w > 0 && s > 0;
  const passing = allAnswered && Object.values(checks).every(c => c.pass);
  const anyFail = Object.values(checks).some(c => !c.pass && (c.val > 0 || c.label === 'Opening area'));

  const openMeasureApp = () => {
    if (isIOS()) {
      window.location.href = 'measure://';
    } else {
      alert("Open your phone's Ruler or Measure app, then enter the measurement in the field.");
    }
  };

  const handleCameraMeasure = (mm: number) => {
    if (cameraTarget === 'height') setHeightMm(String(mm));
    else setWidthMm(String(mm));
  };

  return (
    <div className="space-y-5 px-4 py-4 max-w-md mx-auto">
      {/* Mode toggle */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        {(['manual', 'camera'] as InputMode[]).map(m => (
          <button
            key={m}
            onClick={() => setInputMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            {m === 'manual' ? 'Enter manually' : '📷 Camera'}
          </button>
        ))}
        <button
          onClick={openMeasureApp}
          className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          📱 Measure app
        </button>
      </div>

      {inputMode === 'camera' && showCamera ? (
        <CameraMeasure onMeasure={handleCameraMeasure} onClose={() => setShowCamera(false)} />
      ) : inputMode === 'camera' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setCameraTarget('height'); setShowCamera(true); }}
              className="border border-gray-200 rounded-xl p-4 text-center bg-white"
            >
              <p className="text-2xl mb-1">↕️</p>
              <p className="text-sm font-medium">Measure height</p>
            </button>
            <button
              onClick={() => { setCameraTarget('width'); setShowCamera(true); }}
              className="border border-gray-200 rounded-xl p-4 text-center bg-white"
            >
              <p className="text-2xl mb-1">↔️</p>
              <p className="text-sm font-medium">Measure width</p>
            </button>
          </div>
          {(heightMm || widthMm) && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
              {heightMm && <p>Height: {heightMm} mm</p>}
              {widthMm && <p>Width: {widthMm} mm</p>}
            </div>
          )}
        </div>
      ) : null}

      {/* Manual inputs (always shown for manual mode, also shown in camera mode to allow editing) */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Clear height (mm)', val: heightMm, set: setHeightMm },
          { label: 'Clear width (mm)',  val: widthMm,  set: setWidthMm },
          { label: 'Sill height (mm)',  val: sillMm,   set: setSillMm },
        ].map(({ label, val, set }) => (
          <div key={label} className="space-y-1">
            <label className="text-xs font-medium text-gray-600">{label}</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="mm"
              value={val}
              onChange={e => set(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base"
            />
          </div>
        ))}

        {/* Below grade toggle spans full */}
        <div className="col-span-2 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <span className="text-sm font-medium">Below-grade bedroom?</span>
          <button
            onClick={() => setBelowGrade(v => !v)}
            className={`w-12 h-6 rounded-full transition-colors ${belowGrade ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${belowGrade ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>

      {/* Below grade extras */}
      {belowGrade && (
        <div className="space-y-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Window Well — NBC 9.9.10</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Well projection (mm)', val: wellProjMm, set: setWellProjMm },
              { label: 'Well depth (mm)',       val: wellDepthMm, set: setWellDepthMm },
            ].map(({ label, val, set }) => (
              <div key={label} className="space-y-1">
                <label className="text-xs font-medium text-amber-700">{label}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="mm"
                  value={val}
                  onChange={e => set(e.target.value)}
                  className="w-full border border-amber-200 rounded-xl px-3 py-3 text-base bg-white"
                />
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-medium text-amber-700 mb-2">Window swings:</p>
            <div className="flex gap-2">
              {(['in', 'out', 'slider'] as SwingType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setSwingType(t)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors capitalize ${swingType === t ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-amber-200 text-amber-700'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            {swingType === 'in' && (
              <p className="text-xs text-amber-700 mt-2">⚠️ Inward-swinging window — well depth must accommodate sash (NBC 9.9.10.3)</p>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {allAnswered && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className={`px-4 py-3 border-b ${passing ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <p className={`font-bold text-base ${passing ? 'text-green-700' : 'text-red-700'}`}>
              {passing ? '✅ EGRESS COMPLIANT' : '❌ NON-COMPLIANT'} — NBC 9.10.7{belowGrade ? ' + 9.9.10' : ''}
            </p>
          </div>
          <div className="px-4">
            {Object.values(checks).filter(c => c.label !== 'Well projection' || belowGrade).map(c => (
              <div key={c.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <span className="text-sm text-gray-700">{c.label}</span>
                  <span className="text-xs text-gray-400 ml-2">{c.req}</span>
                </div>
                <span className={`text-sm font-semibold flex items-center gap-1 ${c.pass ? 'text-green-700' : 'text-red-600'}`}>
                  {c.unit} {c.pass ? '✅' : '❌'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
