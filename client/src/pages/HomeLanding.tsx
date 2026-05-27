import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home, Layers, Fence, Warehouse, DoorOpen, Bath, Waves, Pencil, ArrowRight, CheckCircle, Shield, FileText
} from "lucide-react";

interface ProjectType {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  provinces: string[];
}

const PROJECT_TYPES: ProjectType[] = [
  {
    id: "secondary_suite",
    label: "Secondary Suite",
    description: "Basement suite, in-law suite, or above-grade secondary unit",
    icon: <Home className="w-6 h-6" />,
    available: true,
    provinces: ["AB", "BC", "ON"],
  },
  {
    id: "deck_patio",
    label: "Deck / Patio",
    description: "Attached or freestanding deck, patio, or raised platform",
    icon: <Fence className="w-6 h-6" />,
    available: true,
    provinces: ["AB", "BC", "ON"],
  },
  {
    id: "basement_development",
    label: "Basement Development",
    description: "Finishing an unfinished basement — bedrooms, rec rooms, bathrooms",
    icon: <Layers className="w-6 h-6" />,
    available: true,
    provinces: ["AB", "BC", "ON"],
  },
  {
    id: "addition_renovation",
    label: "Addition / Renovation",
    description: "Expanding your home's footprint or major interior renovation",
    icon: <Pencil className="w-6 h-6" />,
    available: false,
    provinces: ["AB", "BC", "ON"],
  },
  {
    id: "detached_garage",
    label: "Detached Garage",
    description: "New detached garage or workshop on your property",
    icon: <Warehouse className="w-6 h-6" />,
    available: false,
    provinces: ["AB", "BC", "ON"],
  },
  {
    id: "interior_alteration",
    label: "Interior Alteration",
    description: "Moving walls, adding a bathroom, or changing room layouts",
    icon: <DoorOpen className="w-6 h-6" />,
    available: false,
    provinces: ["AB", "BC", "ON"],
  },
  {
    id: "new_single_family",
    label: "New Single-Family Home",
    description: "Building a new house on a vacant lot",
    icon: <Home className="w-6 h-6" />,
    available: false,
    provinces: ["AB", "BC", "ON"],
  },
  {
    id: "pool_hot_tub",
    label: "Pool / Hot Tub",
    description: "In-ground pool, above-ground pool, or permanent hot tub",
    icon: <Waves className="w-6 h-6" />,
    available: false,
    provinces: ["AB", "BC", "ON"],
  },
];

export default function HomeLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-10 text-center">
        <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">Alberta · BC · Ontario</Badge>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Does my project need a permit?
        </h1>
        <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
          Answer a few questions about your home project. Get a plain-language building code compliance report in minutes.
        </p>

        <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-10">
          <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-600" /> No drawings needed</span>
          <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-blue-600" /> $29 CAD per report</span>
          <span className="flex items-center gap-1"><FileText className="w-4 h-4 text-indigo-600" /> PDF emailed instantly</span>
        </div>
      </div>

      {/* Project type grid */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Select your project type</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROJECT_TYPES.map((pt) => (
            <button
              key={pt.id}
              onClick={() => pt.available && setLocation(`/home/${pt.id}`)}
              disabled={!pt.available}
              className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                pt.available
                  ? "border-gray-200 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer"
                  : "border-dashed border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              }`}
            >
              {!pt.available && (
                <span className="absolute top-3 right-3 text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                  Coming soon
                </span>
              )}
              <div className={`mb-3 ${pt.available ? "text-blue-700" : "text-gray-400"}`}>
                {pt.icon}
              </div>
              <div className="font-semibold text-gray-900 mb-1">{pt.label}</div>
              <div className="text-sm text-gray-500">{pt.description}</div>
              {pt.available && (
                <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-blue-400" />
              )}
            </button>
          ))}
        </div>

        {/* Trust + disclaimer strip */}
        <div className="mt-12 p-5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <strong>Important:</strong> This report checks building code compliance only. It does not address
          zoning bylaws, land-use regulations, subdivision restrictions, or HOA rules.
          Complex projects should still be reviewed by a licensed professional (P.Eng, architect, or building designer).
        </div>
      </div>
    </div>
  );
}
