import { useState, useEffect } from "react";

export interface CalculatorPreset {
  id: string;
  name: string;
  data: any;
  createdAt: string;
}

export function useCalculatorPreset(calculatorId: string) {
  const storageKey = `calculator_preset_${calculatorId}`;
  
  const [presets, setPresets] = useState<CalculatorPreset[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(presets));
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
    setPresets(presets.filter(p => p.id !== id));
  };

  return {
    presets,
    savePreset,
    loadPreset,
    deletePreset,
  };
}
