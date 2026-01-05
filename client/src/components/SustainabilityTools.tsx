import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Zap, Droplet, Network, Leaf, CheckCircle2, AlertCircle } from "lucide-react";

export function SolarPVDiagram() {
  return (
    <Card className="rounded-none border-border shadow-sm overflow-hidden">
      <CardHeader className="pb-2 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          Solar PV System Components
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <svg viewBox="0 0 400 300" className="w-full h-auto">
          {/* Roof outline */}
          <path d="M 50 150 L 200 80 L 350 150 L 350 250 L 50 250 Z" fill="#e5e7eb" stroke="#374151" strokeWidth="2" />
          
          {/* Solar panels */}
          <rect x="100" y="110" width="80" height="60" fill="#1e3a8a" stroke="#1e40af" strokeWidth="2" />
          <rect x="190" y="110" width="80" height="60" fill="#1e3a8a" stroke="#1e40af" strokeWidth="2" />
          <line x1="100" y1="140" x2="180" y2="140" stroke="#60a5fa" strokeWidth="1" />
          <line x1="190" y1="140" x2="270" y2="140" stroke="#60a5fa" strokeWidth="1" />
          <line x1="140" y1="110" x2="140" y2="170" stroke="#60a5fa" strokeWidth="1" />
          <line x1="230" y1="110" x2="230" y2="170" stroke="#60a5fa" strokeWidth="1" />
          
          {/* Conduit */}
          <line x1="270" y1="140" x2="320" y2="180" stroke="#f59e0b" strokeWidth="3" strokeDasharray="5,5" />
          
          {/* Inverter */}
          <rect x="300" y="180" width="40" height="30" fill="#f3f4f6" stroke="#374151" strokeWidth="2" rx="2" />
          <text x="320" y="200" textAnchor="middle" fontSize="10" fill="#374151" fontWeight="bold">INV</text>
          
          {/* Service panel */}
          <rect x="300" y="220" width="40" height="25" fill="#6b7280" stroke="#374151" strokeWidth="2" rx="2" />
          <text x="320" y="237" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">PANEL</text>
          
          {/* Connections */}
          <line x1="320" y1="210" x2="320" y2="220" stroke="#374151" strokeWidth="2" />
          
          {/* Labels */}
          <text x="140" y="100" textAnchor="middle" fontSize="11" fill="#1e40af" fontWeight="bold">PV Array</text>
          <text x="320" y="175" textAnchor="middle" fontSize="10" fill="#f59e0b" fontWeight="bold">Conduit</text>
          <text x="280" y="195" textAnchor="end" fontSize="9" fill="#374151">Inverter</text>
          <text x="280" y="233" textAnchor="end" fontSize="9" fill="#374151">Service</text>
          
          {/* Annotations */}
          <text x="200" y="30" textAnchor="middle" fontSize="10" fill="#6b7280">Roof-Mounted Installation</text>
          <text x="200" y="280" textAnchor="middle" fontSize="9" fill="#9ca3af">CEC Rule 84 | ABC 9.23.17</text>
        </svg>
        
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded">
            <span className="font-bold text-blue-900 dark:text-blue-100">Racking:</span>
            <span className="text-blue-800 dark:text-blue-200 ml-1">Engineered for wind/snow</span>
          </div>
          <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded">
            <span className="font-bold text-amber-900 dark:text-amber-100">Disconnect:</span>
            <span className="text-amber-800 dark:text-amber-200 ml-1">Within sight of panel</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EVChargingDiagram() {
  return (
    <Card className="rounded-none border-border shadow-sm overflow-hidden">
      <CardHeader className="pb-2 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500" />
          EV Charging Circuit (Level 2)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <svg viewBox="0 0 400 280" className="w-full h-auto">
          {/* Service panel */}
          <rect x="50" y="50" width="60" height="80" fill="#374151" stroke="#1f2937" strokeWidth="2" rx="2" />
          <text x="80" y="75" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="bold">Service</text>
          <text x="80" y="90" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="bold">Panel</text>
          <circle cx="70" cy="105" r="3" fill="#ef4444" />
          <circle cx="90" cy="105" r="3" fill="#000" />
          <text x="80" y="120" textAnchor="middle" fontSize="9" fill="#fbbf24">50A Breaker</text>
          
          {/* Conduit run */}
          <line x1="110" y1="90" x2="250" y2="90" stroke="#f59e0b" strokeWidth="4" />
          <text x="180" y="80" textAnchor="middle" fontSize="9" fill="#f59e0b" fontWeight="bold">EMT Conduit</text>
          
          {/* Disconnect switch */}
          <rect x="250" y="70" width="40" height="40" fill="#f3f4f6" stroke="#374151" strokeWidth="2" rx="2" />
          <line x1="260" y1="90" x2="280" y2="90" stroke="#374151" strokeWidth="3" />
          <circle cx="280" cy="90" r="4" fill="#374151" />
          <text x="270" y="125" textAnchor="middle" fontSize="9" fill="#374151" fontWeight="bold">Disconnect</text>
          
          {/* EVSE unit */}
          <rect x="310" y="50" width="70" height="100" fill="#1e40af" stroke="#1e3a8a" strokeWidth="2" rx="4" />
          <circle cx="345" cy="80" r="8" fill="#60a5fa" />
          <rect x="325" y="100" width="40" height="3" fill="#10b981" rx="1" />
          <rect x="325" y="110" width="40" height="3" fill="#10b981" rx="1" />
          <rect x="325" y="120" width="40" height="3" fill="#10b981" rx="1" />
          <text x="345" y="140" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">EVSE</text>
          
          {/* Charging cable */}
          <path d="M 345 150 Q 345 180 320 200" stroke="#1f2937" strokeWidth="5" fill="none" />
          <circle cx="320" cy="200" r="8" fill="#374151" stroke="#1f2937" strokeWidth="2" />
          
          {/* Vehicle outline */}
          <ellipse cx="280" cy="230" rx="80" ry="30" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
          <rect x="240" y="210" width="80" height="30" fill="#d1d5db" stroke="#6b7280" strokeWidth="2" rx="4" />
          <circle cx="250" cy="245" r="8" fill="#374151" />
          <circle cx="310" cy="245" r="8" fill="#374151" />
          <text x="280" y="230" textAnchor="middle" fontSize="11" fill="#374151" fontWeight="bold">EV</text>
          
          {/* Connection line */}
          <line x1="290" y1="90" x2="310" y2="90" stroke="#374151" strokeWidth="2" />
          
          {/* Labels */}
          <text x="80" y="35" textAnchor="middle" fontSize="10" fill="#6b7280">200A Service</text>
          <text x="200" y="270" textAnchor="middle" fontSize="9" fill="#9ca3af">CEC Rule 86 | 240V 50A Circuit</text>
        </svg>
        
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded">
            <span className="font-bold text-blue-900 dark:text-blue-100">Wire:</span>
            <span className="text-blue-800 dark:text-blue-200 ml-1">#6 AWG copper (3-wire + ground)</span>
          </div>
          <div className="p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded">
            <span className="font-bold text-green-900 dark:text-green-100">GFCI:</span>
            <span className="text-green-800 dark:text-green-200 ml-1">Required per CEC 86-302</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TanklessHeaterDiagram() {
  return (
    <Card className="rounded-none border-border shadow-sm overflow-hidden">
      <CardHeader className="pb-2 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Droplet className="w-4 h-4 text-cyan-500" />
          Gas Tankless Water Heater Installation
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <svg viewBox="0 0 400 300" className="w-full h-auto">
          {/* Wall */}
          <rect x="0" y="0" width="400" height="300" fill="#f3f4f6" />
          <line x1="200" y1="0" x2="200" y2="300" stroke="#d1d5db" strokeWidth="2" strokeDasharray="10,5" />
          <text x="100" y="20" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="bold">INTERIOR</text>
          <text x="300" y="20" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="bold">EXTERIOR</text>
          
          {/* Tankless unit */}
          <rect x="120" y="80" width="60" height="100" fill="#fff" stroke="#374151" strokeWidth="2" rx="4" />
          <circle cx="150" cy="110" r="8" fill="#3b82f6" />
          <rect x="135" y="130" width="30" height="3" fill="#ef4444" rx="1" />
          <rect x="135" y="140" width="30" height="3" fill="#3b82f6" rx="1" />
          <rect x="135" y="150" width="30" height="3" fill="#10b981" rx="1" />
          <text x="150" y="170" textAnchor="middle" fontSize="9" fill="#374151" fontWeight="bold">Tankless</text>
          
          {/* Gas line */}
          <line x1="120" y1="160" x2="80" y2="160" stroke="#fbbf24" strokeWidth="3" />
          <text x="100" y="175" textAnchor="middle" fontSize="8" fill="#f59e0b" fontWeight="bold">3/4" Gas</text>
          
          {/* Cold water in */}
          <line x1="120" y1="140" x2="80" y2="140" stroke="#3b82f6" strokeWidth="3" />
          <text x="100" y="135" textAnchor="middle" fontSize="8" fill="#3b82f6" fontWeight="bold">Cold In</text>
          
          {/* Hot water out */}
          <line x1="180" y1="140" x2="220" y2="140" stroke="#ef4444" strokeWidth="3" />
          <text x="200" y="135" textAnchor="middle" fontSize="8" fill="#ef4444" fontWeight="bold">Hot Out</text>
          
          {/* Vent pipe through wall */}
          <rect x="180" y="95" width="120" height="20" fill="#9ca3af" stroke="#6b7280" strokeWidth="2" />
          <text x="240" y="110" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">4" PVC Vent</text>
          
          {/* Vent termination */}
          <rect x="290" y="85" width="30" height="40" fill="#d1d5db" stroke="#6b7280" strokeWidth="2" rx="2" />
          <line x1="295" y1="95" x2="315" y2="95" stroke="#6b7280" strokeWidth="1" />
          <line x1="295" y1="105" x2="315" y2="105" stroke="#6b7280" strokeWidth="1" />
          <line x1="295" y1="115" x2="315" y2="115" stroke="#6b7280" strokeWidth="1" />
          
          {/* Combustion air intake */}
          <rect x="180" y="120" width="120" height="15" fill="#60a5fa" stroke="#3b82f6" strokeWidth="2" />
          <text x="240" y="132" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">3" Air Intake</text>
          
          {/* Air intake termination */}
          <rect x="290" y="115" width="30" height="25" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2" rx="2" />
          <path d="M 295 125 L 305 125 L 300 130 Z" fill="#3b82f6" />
          
          {/* Condensate drain */}
          <line x1="150" y1="180" x2="150" y2="220" stroke="#6b7280" strokeWidth="2" />
          <circle cx="150" cy="220" r="5" fill="#374151" />
          <text x="150" y="235" textAnchor="middle" fontSize="8" fill="#6b7280">Drain</text>
          
          {/* Clearances */}
          <line x1="120" y1="70" x2="120" y2="80" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="110" y1="75" x2="130" y2="75" stroke="#ef4444" strokeWidth="1" />
          <text x="150" y="70" textAnchor="start" fontSize="8" fill="#ef4444">6" min clearance</text>
          
          {/* Labels */}
          <text x="200" y="260" textAnchor="middle" fontSize="10" fill="#6b7280">Sealed Combustion (Direct Vent)</text>
          <text x="200" y="280" textAnchor="middle" fontSize="9" fill="#9ca3af">NPC 2.6.3 | ABC 9.32.4</text>
        </svg>
        
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded">
            <span className="font-bold text-amber-900 dark:text-amber-100">BTU:</span>
            <span className="text-amber-800 dark:text-amber-200 ml-1">150,000-200,000 BTU/hr typical</span>
          </div>
          <div className="p-2 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900 rounded">
            <span className="font-bold text-cyan-900 dark:text-cyan-100">Flow Rate:</span>
            <span className="text-cyan-800 dark:text-cyan-200 ml-1">6-8 GPM for whole home</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GridIntegrationDiagram() {
  return (
    <Card className="rounded-none border-border shadow-sm overflow-hidden">
      <CardHeader className="pb-2 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Network className="w-4 h-4 text-purple-500" />
          Net Metering System Architecture
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <svg viewBox="0 0 500 280" className="w-full h-auto">
          {/* Solar panels */}
          <rect x="30" y="40" width="60" height="40" fill="#1e3a8a" stroke="#1e40af" strokeWidth="2" />
          <line x1="30" y1="60" x2="90" y2="60" stroke="#60a5fa" strokeWidth="1" />
          <line x1="60" y1="40" x2="60" y2="80" stroke="#60a5fa" strokeWidth="1" />
          <text x="60" y="100" textAnchor="middle" fontSize="10" fill="#1e40af" fontWeight="bold">Solar PV</text>
          
          {/* Inverter */}
          <rect x="140" y="50" width="50" height="30" fill="#f3f4f6" stroke="#374151" strokeWidth="2" rx="2" />
          <text x="165" y="70" textAnchor="middle" fontSize="10" fill="#374151" fontWeight="bold">Inverter</text>
          <text x="165" y="100" textAnchor="middle" fontSize="8" fill="#6b7280">DC→AC</text>
          
          {/* AC Disconnect */}
          <rect x="230" y="50" width="40" height="30" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" rx="2" />
          <line x1="240" y1="65" x2="260" y2="65" stroke="#f59e0b" strokeWidth="3" />
          <circle cx="260" cy="65" r="4" fill="#f59e0b" />
          <text x="250" y="100" textAnchor="middle" fontSize="8" fill="#f59e0b" fontWeight="bold">AC Disc.</text>
          
          {/* Bi-directional meter */}
          <rect x="310" y="45" width="50" height="40" fill="#10b981" stroke="#059669" strokeWidth="2" rx="2" />
          <circle cx="335" cy="65" r="12" fill="#d1fae5" stroke="#059669" strokeWidth="1" />
          <path d="M 330 65 L 335 60 L 340 65" stroke="#059669" strokeWidth="2" fill="none" />
          <path d="M 340 65 L 335 70 L 330 65" stroke="#059669" strokeWidth="2" fill="none" />
          <text x="335" y="100" textAnchor="middle" fontSize="8" fill="#059669" fontWeight="bold">Net Meter</text>
          
          {/* Service panel */}
          <rect x="400" y="40" width="60" height="50" fill="#374151" stroke="#1f2937" strokeWidth="2" rx="2" />
          <text x="430" y="60" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">Service</text>
          <text x="430" y="75" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">Panel</text>
          <text x="430" y="105" textAnchor="middle" fontSize="8" fill="#9ca3af">200A</text>
          
          {/* Utility grid */}
          <rect x="310" y="150" width="50" height="40" fill="#6366f1" stroke="#4f46e5" strokeWidth="2" rx="2" />
          <text x="335" y="165" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">Utility</text>
          <text x="335" y="178" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">Grid</text>
          <text x="335" y="205" textAnchor="middle" fontSize="8" fill="#6366f1" fontWeight="bold">EPCOR/ENMAX</text>
          
          {/* Home loads */}
          <rect x="400" y="150" width="60" height="40" fill="#f59e0b" stroke="#d97706" strokeWidth="2" rx="2" />
          <text x="430" y="165" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">Home</text>
          <text x="430" y="178" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">Loads</text>
          <circle cx="415" cy="205" r="3" fill="#fbbf24" />
          <circle cx="430" cy="205" r="3" fill="#fbbf24" />
          <circle cx="445" cy="205" r="3" fill="#fbbf24" />
          
          {/* Connections */}
          <line x1="90" y1="65" x2="140" y2="65" stroke="#1e40af" strokeWidth="2" />
          <line x1="190" y1="65" x2="230" y2="65" stroke="#374151" strokeWidth="2" />
          <line x1="270" y1="65" x2="310" y2="65" stroke="#374151" strokeWidth="2" />
          <line x1="360" y1="65" x2="400" y2="65" stroke="#374151" strokeWidth="2" />
          <line x1="335" y1="85" x2="335" y2="150" stroke="#6366f1" strokeWidth="2" />
          <line x1="430" y1="90" x2="430" y2="150" stroke="#f59e0b" strokeWidth="2" />
          
          {/* Power flow arrows */}
          <path d="M 120 50 L 120 40 L 125 45 L 120 40 L 115 45" stroke="#10b981" strokeWidth="2" fill="none" />
          <text x="120" y="35" textAnchor="middle" fontSize="8" fill="#10b981" fontWeight="bold">Solar Power</text>
          
          <path d="M 335 120 L 335 130 L 340 125 L 335 130 L 330 125" stroke="#ef4444" strokeWidth="2" fill="none" />
          <text x="280" y="125" textAnchor="end" fontSize="8" fill="#ef4444" fontWeight="bold">Import (Night)</text>
          
          <path d="M 345 130 L 345 120 L 350 125 L 345 120 L 340 125" stroke="#10b981" strokeWidth="2" fill="none" />
          <text x="390" y="125" textAnchor="start" fontSize="8" fill="#10b981" fontWeight="bold">Export (Day)</text>
          
          {/* Legend */}
          <rect x="20" y="230" width="460" height="40" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1" rx="2" />
          <text x="250" y="245" textAnchor="middle" fontSize="9" fill="#374151" fontWeight="bold">Net Metering: Excess solar power credited at retail rate</text>
          <text x="250" y="260" textAnchor="middle" fontSize="8" fill="#6b7280">Alberta Micro-Generation Regulation | CEC Rule 84-030</text>
        </svg>
      </CardContent>
    </Card>
  );
}
