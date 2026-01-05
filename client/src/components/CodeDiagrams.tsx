import React from 'react';

export const FireSeparationDiagram = () => (
  <svg viewBox="0 0 400 300" className="w-full h-auto bg-white rounded-lg border border-border">
    <defs>
      <pattern id="gypsum" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.5" fill="#94a3b8" />
      </pattern>
      <pattern id="insulation" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M0,10 Q5,0 10,10 T20,10" fill="none" stroke="#fbbf24" strokeWidth="1" />
      </pattern>
    </defs>
    
    {/* Main House Floor */}
    <rect x="50" y="50" width="300" height="20" fill="#e2e8f0" stroke="#64748b" />
    <text x="200" y="40" textAnchor="middle" className="text-xs font-medium fill-foreground">Main Dwelling Unit</text>
    
    {/* Floor Joists */}
    <rect x="60" y="70" width="10" height="60" fill="#cbd5e1" />
    <rect x="120" y="70" width="10" height="60" fill="#cbd5e1" />
    <rect x="180" y="70" width="10" height="60" fill="#cbd5e1" />
    <rect x="240" y="70" width="10" height="60" fill="#cbd5e1" />
    <rect x="300" y="70" width="10" height="60" fill="#cbd5e1" />
    
    {/* Insulation */}
    <rect x="70" y="70" width="50" height="60" fill="url(#insulation)" opacity="0.5" />
    <rect x="130" y="70" width="50" height="60" fill="url(#insulation)" opacity="0.5" />
    <rect x="190" y="70" width="50" height="60" fill="url(#insulation)" opacity="0.5" />
    <rect x="250" y="70" width="50" height="60" fill="url(#insulation)" opacity="0.5" />
    
    {/* Fire Separation (Gypsum Board) */}
    <rect x="50" y="130" width="300" height="8" fill="#f87171" stroke="#dc2626" strokeWidth="1" />
    
    {/* Secondary Suite Ceiling */}
    <text x="200" y="180" textAnchor="middle" className="text-xs font-medium fill-foreground">Secondary Suite</text>
    
    {/* Labels */}
    <line x1="360" y1="134" x2="380" y2="134" stroke="#64748b" />
    <text x="385" y="138" className="text-[10px] fill-muted-foreground">12.7mm Gypsum</text>
    <text x="385" y="148" className="text-[10px] fill-muted-foreground">(Smoke-tight barrier)</text>
    
    <line x1="20" y1="100" x2="40" y2="100" stroke="#64748b" />
    <text x="15" y="100" textAnchor="end" className="text-[10px] fill-muted-foreground">Sound Insulation</text>
  </svg>
);

export const EgressWindowDiagram = () => (
  <svg viewBox="0 0 400 300" className="w-full h-auto bg-white rounded-lg border border-border">
    {/* Wall */}
    <rect x="50" y="20" width="300" height="260" fill="#f1f5f9" stroke="#cbd5e1" />
    
    {/* Window Frame */}
    <rect x="100" y="60" width="200" height="180" fill="#fff" stroke="#475569" strokeWidth="2" />
    
    {/* Openable Area */}
    <rect x="110" y="70" width="180" height="160" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 2" />
    
    {/* Dimensions */}
    {/* Width */}
    <line x1="110" y1="240" x2="290" y2="240" stroke="#ef4444" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
    <text x="200" y="255" textAnchor="middle" className="text-xs font-bold fill-destructive">Min 380 mm</text>
    
    {/* Height */}
    <line x1="300" y1="70" x2="300" y2="230" stroke="#ef4444" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
    <text x="310" y="150" className="text-xs font-bold fill-destructive" style={{ writingMode: 'vertical-rl' }}>Min 380 mm</text>
    
    {/* Area Label */}
    <text x="200" y="150" textAnchor="middle" className="text-sm font-bold fill-blue-600">Min Area: 0.35 m²</text>
    <text x="200" y="165" textAnchor="middle" className="text-[10px] fill-blue-500">(Unobstructed Opening)</text>
    
    {/* Markers */}
    <defs>
      <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
        <path d="M0,0 L10,5 L0,10" fill="#ef4444" />
      </marker>
    </defs>
  </svg>
);

export const GFCIZoneDiagram = () => (
  <svg viewBox="0 0 400 250" className="w-full h-auto bg-white rounded-lg border border-border">
    <defs>
      <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
      </marker>
    </defs>
    
    {/* Countertop */}
    <rect x="20" y="120" width="360" height="10" fill="#e5e7eb" stroke="#9ca3af" />
    <rect x="20" y="130" width="360" height="80" fill="#f9fafb" stroke="#e5e7eb" />
    
    {/* Sink */}
    <path d="M 160 120 L 160 150 Q 200 170 240 150 L 240 120" fill="#dbeafe" stroke="#3b82f6" />
    <text x="200" y="145" textAnchor="middle" className="text-xs fill-blue-800 font-bold" stroke="none">SINK</text>
    
    {/* Faucet */}
    <path d="M 200 120 L 200 90 Q 200 80 220 90" stroke="#9ca3af" strokeWidth="3" fill="none" />
    
    {/* GFCI Zone - Left */}
    <rect x="40" y="60" width="120" height="60" fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" strokeDasharray="4 4" />
    <path d="M 160 110 L 40 110" markerEnd="url(#arrow-blue)" stroke="#3b82f6" />
    <text x="100" y="100" textAnchor="middle" className="text-xs fill-blue-600 font-bold" stroke="none">1.5m (5ft)</text>
    
    {/* GFCI Zone - Right */}
    <rect x="240" y="60" width="120" height="60" fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" strokeDasharray="4 4" />
    <path d="M 240 110 L 360 110" markerEnd="url(#arrow-blue)" stroke="#3b82f6" />
    <text x="300" y="100" textAnchor="middle" className="text-xs fill-blue-600 font-bold" stroke="none">1.5m (5ft)</text>
    
    {/* Receptacle Icon */}
    <rect x="80" y="70" width="20" height="30" rx="2" fill="white" stroke="#374151" />
    <circle cx="90" cy="78" r="1" fill="#374151" stroke="none" />
    <circle cx="90" cy="92" r="1" fill="#374151" stroke="none" />
    <text x="90" y="55" textAnchor="middle" className="text-[10px] fill-red-600 font-bold" stroke="none">GFCI REQ.</text>
    
    {/* Safe Receptacle Icon */}
    <rect x="370" y="70" width="20" height="30" rx="2" fill="white" stroke="#374151" />
    <text x="380" y="55" textAnchor="middle" className="text-[10px] fill-green-600 font-bold" stroke="none">OK</text>
  </svg>
);
