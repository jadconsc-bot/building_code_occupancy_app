export interface CalculatorPreset {
  id: string;
  name: string;
  category: "Residential" | "Commercial" | "Industrial" | "Custom";
  calculatorType: "floor-joist" | "beam" | "roof-rafter" | "column";
  parameters: Record<string, string | number>;
  createdAt: string;
  occupancyType?: string;
}

const STORAGE_KEY = "calculator_presets";

// Default presets
const defaultPresets: CalculatorPreset[] = [
  {
    id: "preset-1",
    name: "Standard Residential Floor",
    category: "Residential",
    calculatorType: "floor-joist",
    parameters: {
      species: "Spruce-Pine-Fir (S-P-F)",
      grade: "No. 1/No. 2",
      joistSize: "38 x 235 mm",
      spacing: "400mm",
    },
    createdAt: new Date().toISOString(),
    occupancyType: "C",
  },
  {
    id: "preset-2",
    name: "Heavy Commercial Beam",
    category: "Commercial",
    calculatorType: "beam",
    parameters: {
      species: "Douglas Fir - Larch",
      grade: "Select Structural",
      size: "89 x 286 mm",
      loading: "Two Floors",
    },
    createdAt: new Date().toISOString(),
    occupancyType: "D",
  },
  {
    id: "preset-3",
    name: "Typical Roof Rafter 4:12",
    category: "Residential",
    calculatorType: "roof-rafter",
    parameters: {
      species: "Spruce-Pine-Fir (S-P-F)",
      grade: "No. 1/No. 2",
      size: "38 x 140 mm",
      spacing: "600mm",
      pitch: "4:12",
      snowLoad: "2.0",
    },
    createdAt: new Date().toISOString(),
    occupancyType: "C",
  },
  {
    id: "preset-4",
    name: "Calgary Snow Load Rafter",
    category: "Residential",
    calculatorType: "roof-rafter",
    parameters: {
      species: "Douglas Fir - Larch",
      grade: "No. 1/No. 2",
      size: "38 x 184 mm",
      spacing: "400mm",
      pitch: "6:12",
      snowLoad: "2.0",
    },
    createdAt: new Date().toISOString(),
    occupancyType: "C",
  },
  {
    id: "preset-5",
    name: "Standard Support Column",
    category: "Residential",
    calculatorType: "column",
    parameters: {
      species: "Douglas Fir - Larch",
      grade: "Select Structural",
      size: "140 x 140 mm",
      length: "2.7",
    },
    createdAt: new Date().toISOString(),
    occupancyType: "C",
  },
  {
    id: "preset-6",
    name: "Industrial Heavy Beam",
    category: "Industrial",
    calculatorType: "beam",
    parameters: {
      species: "Douglas Fir - Larch",
      grade: "Select Structural",
      size: "89 x 286 mm",
      loading: "Two Floors",
    },
    createdAt: new Date().toISOString(),
    occupancyType: "F-2",
  },
];

/**
 * Get all presets from localStorage, merging with defaults
 */
export function getAllPresets(): CalculatorPreset[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const userPresets = JSON.parse(stored) as CalculatorPreset[];
      // Merge defaults with user presets, avoiding duplicates
      const allPresets = [...defaultPresets];
      userPresets.forEach((preset) => {
        if (!allPresets.find((p) => p.id === preset.id)) {
          allPresets.push(preset);
        }
      });
      return allPresets;
    }
    return defaultPresets;
  } catch (error) {
    console.error("Error loading presets:", error);
    return defaultPresets;
  }
}

/**
 * Get presets filtered by calculator type
 */
export function getPresetsByType(
  calculatorType: CalculatorPreset["calculatorType"]
): CalculatorPreset[] {
  return getAllPresets().filter((preset) => preset.calculatorType === calculatorType);
}

/**
 * Get presets filtered by category
 */
export function getPresetsByCategory(
  category: CalculatorPreset["category"]
): CalculatorPreset[] {
  return getAllPresets().filter((preset) => preset.category === category);
}

/**
 * Save a new preset
 */
export function savePreset(preset: Omit<CalculatorPreset, "id" | "createdAt">): CalculatorPreset {
  const newPreset: CalculatorPreset = {
    ...preset,
    id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const userPresets = stored ? JSON.parse(stored) : [];
    userPresets.push(newPreset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userPresets));
    return newPreset;
  } catch (error) {
    console.error("Error saving preset:", error);
    throw error;
  }
}

/**
 * Update an existing preset
 */
export function updatePreset(id: string, updates: Partial<CalculatorPreset>): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const userPresets = JSON.parse(stored) as CalculatorPreset[];
    const index = userPresets.findIndex((p) => p.id === id);
    if (index !== -1) {
      userPresets[index] = { ...userPresets[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userPresets));
    }
  } catch (error) {
    console.error("Error updating preset:", error);
    throw error;
  }
}

/**
 * Delete a preset
 */
export function deletePreset(id: string): void {
  try {
    // Don't allow deleting default presets
    if (defaultPresets.find((p) => p.id === id)) {
      throw new Error("Cannot delete default presets");
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const userPresets = JSON.parse(stored) as CalculatorPreset[];
    const filtered = userPresets.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting preset:", error);
    throw error;
  }
}

/**
 * Export presets as JSON
 */
export function exportPresets(): string {
  const presets = getAllPresets();
  return JSON.stringify(presets, null, 2);
}

/**
 * Import presets from JSON
 */
export function importPresets(jsonString: string): void {
  try {
    const imported = JSON.parse(jsonString) as CalculatorPreset[];
    const stored = localStorage.getItem(STORAGE_KEY);
    const existing = stored ? JSON.parse(stored) : [];
    
    // Merge imported with existing, avoiding duplicates by name
    imported.forEach((preset) => {
      if (!existing.find((p: CalculatorPreset) => p.name === preset.name)) {
        existing.push({
          ...preset,
          id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        });
      }
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error("Error importing presets:", error);
    throw error;
  }
}
