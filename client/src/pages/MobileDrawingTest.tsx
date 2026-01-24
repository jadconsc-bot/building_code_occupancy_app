import { useRef, useEffect, useState } from "react";

/**
 * Minimal Mobile Drawing Test Page
 * This is a stripped-down version to isolate why mobile drawing isn't working.
 * Based on the reference DrawingCanvas code that works.
 */
export default function MobileDrawingTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to fill container
    canvas.width = window.innerWidth - 40;
    canvas.height = 400;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.strokeStyle = "#1E3A8A";
    ctx.lineWidth = 3;

    ctxRef.current = ctx;

    // Draw grid background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    // Reset stroke style for drawing
    ctx.strokeStyle = "#1E3A8A";
    ctx.lineWidth = 3;

    addLog("Canvas initialized");
  }, []);

  const getCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };

    if ("touches" in e && e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      return {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top,
      };
    } else if ("changedTouches" in e && e.changedTouches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.changedTouches[0];
      return {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top,
      };
    } else if ("nativeEvent" in e) {
      const mouseEvent = e as React.MouseEvent;
      return {
        offsetX: mouseEvent.nativeEvent.offsetX,
        offsetY: mouseEvent.nativeEvent.offsetY,
      };
    }
    return { offsetX: 0, offsetY: 0 };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const { offsetX, offsetY } = getCoordinates(e);
    addLog(`START: x=${offsetX.toFixed(0)}, y=${offsetY.toFixed(0)}`);

    if (!ctxRef.current) {
      addLog("ERROR: No canvas context!");
      return;
    }

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const { offsetX, offsetY } = getCoordinates(e);
    addLog(`MOVE: x=${offsetX.toFixed(0)}, y=${offsetY.toFixed(0)}`);

    if (!ctxRef.current) {
      addLog("ERROR: No canvas context in draw!");
      return;
    }

    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  const stopDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    addLog("STOP drawing");

    if (!ctxRef.current) return;

    ctxRef.current.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "#1E3A8A";
    ctx.lineWidth = 3;
    setDebugLog([]);
    addLog("Canvas cleared");
  };

  return (
    <div className="p-4 max-w-full overflow-hidden">
      <h1 className="text-xl font-bold mb-4">Mobile Drawing Test</h1>
      <p className="text-sm text-gray-600 mb-4">
        This is a minimal test page to debug mobile drawing. Try drawing below.
      </p>

      <div className="mb-4">
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
        >
          Clear Canvas
        </button>
        <span className="text-sm text-gray-500">
          Drawing: {isDrawing ? "YES" : "NO"}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          border: "2px solid #1E3A8A",
          touchAction: "none",
          display: "block",
          backgroundColor: "#fff",
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Debug Log:</h2>
        <div
          className="bg-gray-100 p-2 rounded text-xs font-mono overflow-y-auto"
          style={{ maxHeight: "200px" }}
        >
          {debugLog.length === 0 ? (
            <p className="text-gray-500">No events yet. Try drawing on the canvas.</p>
          ) : (
            debugLog.map((log, i) => (
              <div key={i} className="border-b border-gray-200 py-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800">Troubleshooting Tips:</h3>
        <ul className="text-sm text-yellow-700 mt-2 list-disc pl-4">
          <li>If no events appear, touch events may be blocked</li>
          <li>If START appears but no MOVE, touchmove may be blocked</li>
          <li>If events appear but no drawing, canvas context issue</li>
          <li>Check if "Drawing: YES" appears when touching</li>
        </ul>
      </div>
    </div>
  );
}
