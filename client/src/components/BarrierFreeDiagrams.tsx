import React from "react";

export const BarrierFreeWashroomDiagram = () => (
  <svg viewBox="0 0 500 400" className="w-full h-auto bg-white rounded-lg border border-border">
    <defs>
      <marker id="arrow-bf" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,8 L8,4 z" fill="#3b82f6" />
      </marker>
    </defs>
    
    {/* Room Outline */}
    <rect x="50" y="50" width="400" height="300" fill="#f8fafc" stroke="#334155" strokeWidth="3" />
    
    {/* Door */}
    <path d="M 50 250 L 50 350" stroke="white" strokeWidth="4" />
    <path d="M 50 350 A 100 100 0 0 1 150 250" fill="none" stroke="#94a3b8" strokeDasharray="4" />
    <line x1="50" y1="350" x2="150" y2="250" stroke="#334155" strokeWidth="2" />
    <text x="100" y="370" className="text-[10px] fill-slate-500">Min 850mm Clear</text>

    {/* Turning Circle */}
    <circle cx="250" cy="200" r="75" fill="#e2e8f0" stroke="#94a3b8" strokeDasharray="4" />
    <text x="250" y="205" textAnchor="middle" className="text-[10px] fill-slate-500 font-bold">1500mm Turning Circle</text>

    {/* Toilet */}
    <rect x="380" y="150" width="40" height="60" fill="white" stroke="#334155" rx="5" />
    <ellipse cx="400" cy="210" rx="15" ry="20" fill="white" stroke="#334155" />
    
    {/* Grab Bars */}
    {/* Rear Bar */}
    <rect x="360" y="140" width="80" height="6" fill="#3b82f6" rx="2" />
    <text x="400" y="135" textAnchor="middle" className="text-[10px] fill-blue-600 font-bold">Rear Bar (Min 600mm)</text>
    
    {/* Side Bar */}
    <rect x="430" y="160" width="6" height="100" fill="#3b82f6" rx="2" />
    <text x="445" y="210" className="text-[10px] fill-blue-600 font-bold" style={{writingMode: "vertical-rl"}}>Side Bar (Min 1200mm)</text>

    {/* Lavatory */}
    <rect x="60" y="60" width="60" height="50" fill="white" stroke="#334155" rx="5" />
    <circle cx="90" cy="85" r="15" fill="#e2e8f0" />
    <text x="90" y="125" textAnchor="middle" className="text-[10px] fill-slate-600">Lavatory</text>
    <text x="90" y="135" textAnchor="middle" className="text-[9px] fill-slate-500">Max 865mm High</text>
    <text x="90" y="145" textAnchor="middle" className="text-[9px] fill-slate-500">Knee Space Required</text>

    {/* Dimensions */}
    {/* Centerline to Side Wall */}
    <line x1="400" y1="210" x2="450" y2="210" stroke="#3b82f6" strokeWidth="1" />
    <text x="425" y="240" textAnchor="middle" className="text-[10px] fill-blue-600 font-bold">460-480mm</text>
    <text x="425" y="250" textAnchor="middle" className="text-[9px] fill-blue-600">Center to Wall</text>

    {/* Transfer Space */}
    <rect x="290" y="150" width="90" height="120" fill="none" stroke="#22c55e" strokeDasharray="2" />
    <text x="335" y="290" textAnchor="middle" className="text-[10px] fill-green-600 font-bold">Transfer Space</text>
    <text x="335" y="300" textAnchor="middle" className="text-[9px] fill-green-600">Min 900mm Wide</text>

  </svg>
);

export const GrabBarDetailDiagram = () => (
  <svg viewBox="0 0 400 200" className="w-full h-auto bg-white rounded-lg border border-border">
    {/* Side View Wall */}
    <rect x="50" y="20" width="300" height="160" fill="#f8fafc" stroke="#334155" />
    <line x1="50" y1="180" x2="350" y2="180" stroke="#334155" strokeWidth="3" /> {/* Floor */}

    {/* Toilet Side View */}
    <path d="M 100 180 L 100 100 L 140 100 L 140 180 Z" fill="white" stroke="#334155" />
    <rect x="90" y="80" width="10" height="40" fill="white" stroke="#334155" /> {/* Tank */}

    {/* Horizontal Bar */}
    <rect x="150" y="90" width="150" height="8" fill="#3b82f6" rx="4" />
    <text x="225" y="80" textAnchor="middle" className="text-[10px] fill-blue-600 font-bold">Horizontal Bar</text>
    
    {/* Vertical/L-Shape Bar (Optional but common) */}
    <rect x="150" y="40" width="8" height="50" fill="#94a3b8" rx="4" opacity="0.5" />
    
    {/* Height Dimension */}
    <line x1="320" y1="180" x2="320" y2="94" stroke="#3b82f6" markerEnd="url(#arrow-bf)" />
    <text x="330" y="140" className="text-[10px] fill-blue-600 font-bold">750mm - 850mm</text>
    <text x="330" y="150" className="text-[9px] fill-blue-600">Height from Floor</text>

    {/* Length Dimension */}
    <line x1="150" y1="110" x2="300" y2="110" stroke="#3b82f6" />
    <text x="225" y="125" textAnchor="middle" className="text-[10px] fill-blue-600 font-bold">Min 1200mm Length</text>
  </svg>
);
