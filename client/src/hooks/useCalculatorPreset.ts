import { useState, useEffect } from "react";

export interface CalculatorPreset {
  id: string;
  name: string;
  data: any;
  createdAt: string;
  isDefault?: boolean;
}

// Default presets for each calculator
const DEFAULT_PRESETS: Record<string, CalculatorPreset[]> = {
  stair_design: [
    {
      id: "default_stair_1",
      name: "Standard Residential Stair",
      data: { totalRise: "2700", occupancyType: "residential", stairWidth: "860" },
      createdAt: new Date().toISOString(),
      isDefault: true
    },
    {
      id: "default_stair_2",
      name: "Commercial Stair",
      data: { totalRise: "3600", occupancyType: "commercial", stairWidth: "1100" },
      createdAt: new Date().toISOString(),
      isDefault: true
    }
  ],
  guard_handrail: [
    {
      id: "default_guard_1",
      name: "Residential Deck",
      data: { occupancyType: "residential", location: "deck", height: "1200" },
      createdAt: new Date().toISOString(),
      isDefault: true
    },
    {
      id: "default_guard_2",
      name: "Assembly Balcony",
      data: { occupancyType: "assembly", location: "balcony", height: "1500" },
      createdAt: new Date().toISOString(),
      isDefault: true
    }
  ],
  snow_load: [
    {
      id: "default_snow_1",
      name: "Calgary Residential",
      data: { location: "Calgary", groundSnow: "1.5", roofType: "sloped", roofSlope: "20", importance: "1.0", exposure: "normal" },
      createdAt: new Date().toISOString(),
      isDefault: true
    },
    {
      id: "default_snow_2",
      name: "Edmonton Residential",
      data: { location: "Edmonton", groundSnow: "1.8", roofType: "sloped", roofSlope: "20", importance: "1.0", exposure: "normal" },
      createdAt: new Date().toISOString(),
      isDefault: true
    }
  ],
  accessibility_ramp: [
    {
      id: "default_ramp_1",
      name: "Standard Entrance Ramp",
      data: { totalRise: "600" },
      createdAt: new Date().toISOString(),
      isDefault: true
    },
    {
      id: "default_ramp_2",
      name: "Multi-Level Access",
      data: { totalRise: "1800" },
      createdAt: new Date().toISOString(),
      isDefault: true
    }
  ],
  thermal_resistance: [
    {
      id: "default_thermal_1",
      name: "Zone 7B Standard 2×6 Wall",
      data: { climateZone: "7B", assemblyType: "wall", studSize: "38x140", insulationType: "batt", insulationThickness: "140" },
      createdAt: new Date().toISOString(),
      isDefault: true
    }
  ],
  ventilation_rate: [
    {
      id: "default_vent_1",
      name: "100m² Residential Dwelling",
      data: { occupancyType: "residential", floorArea: "100", ceilingHeight: "2.7", occupants: "4" },
      createdAt: new Date().toISOString(),
      isDefault: true
    },
    {
      id: "default_vent_2",
      name: "150m² Restaurant",
      data: { occupancyType: "restaurant", floorArea: "150", ceilingHeight: "3.0", occupants: "30" },
      createdAt: new Date().toISOString(),
      isDefault: true
    }
  ],
  stud_spacing: [
    {
      id: "default_stud_1",
      name: "2×4 @ 16\" o.c. (Standard)",
      data: { studSize: "38x89", wallHeight: "2400", spacing: "400" },
      createdAt: new Date().toISOString(),
      isDefault: true
    },
    {
      id: "default_stud_2",
      name: "2×6 @ 24\" o.c. (Energy Efficient)",
      data: { studSize: "38x140", wallHeight: "2400", spacing: "600" },
      createdAt: new Date().toISOString(),
      isDefault: true
    }
  ],
  lintel_span: [
    {
      id: "default_lintel_1",
      name: "Standard Door Opening",
      data: { openingWidth: "900", wallType: "exterior", floorsAbove: "1", roofLoad: "yes", species: "spf" },
      createdAt: new Date().toISOString(),
      isDefault: true
    },
    {
      id: "default_lintel_2",
      name: "Wide Window",
      data: { openingWidth: "2400", wallType: "exterior", floorsAbove: "1", roofLoad: "yes", species: "df" },
      createdAt: new Date().toISOString(),
      isDefault: true
    }
  ]
};

export function useCalculatorPreset(calculatorId: string) {
  const storageKey = `calculator_preset_${calculatorId}`;
  
  const [presets, setPresets] = useState<CalculatorPreset[]>(() => {
    const saved = localStorage.getItem(storageKey);
    const userPresets = saved ? JSON.parse(saved) : [];
    const defaults = DEFAULT_PRESETS[calculatorId] || [];
    // Merge defaults with user presets
    return [...defaults, ...userPresets];
  });

  useEffect(() => {
    // Only save user presets (not defaults) to localStorage
    const userPresets = presets.filter(p => !p.isDefault);
    localStorage.setItem(storageKey, JSON.stringify(userPresets));
  }, [presets, storageKey]);

  const savePreset = (name: string, data: any) => {
    const newPreset: CalculatorPreset = {
      id: Date.now().toString(),
      name,
      data,
      createdAt: new Date().toISOString(),
    };
    setPresets([...presets, newPreset]);
  };

  const loadPreset = (id: string): any | null => {
    const preset = presets.find(p => p.id === id);
    return preset ? preset.data : null;
  };

  const deletePreset = (id: string) => {
    // Don't allow deleting default presets
    const preset = presets.find(p => p.id === id);
    if (preset?.isDefault) {
      console.warn("Cannot delete default presets");
      return;
    }
    setPresets(presets.filter(p => p.id !== id));
  };

  return {
    presets,
    savePreset,
    loadPreset,
    deletePreset,
  };
}
