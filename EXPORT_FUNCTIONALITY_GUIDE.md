# Guide: Adding Excel Export to Calculators

## Overview
This guide explains how to add Excel export, preset saving, and calculation history to the 14 calculators that don't yet have this functionality.

## Current Status
- **12 calculators** already have export functionality ✅
- **14 calculators** need export functionality added ❌

## Calculators Needing Export Functionality

1. BarrierFreeCalculator
2. BatchStairCalculator
3. BeamSpanCalculator
4. ColumnSpanCalculator
5. ConstructionLimitsCalculator
6. EmergencyLightingCalculator
7. ExitRequirementsCalculator
8. FireAlarmCalculator
9. FireSeparationCalculator
10. FloorJoistSpanCalculator
11. OccupantLoadCalculator
12. PermitFeeCalculator
13. RoofRafterSpanCalculator
14. TravelDistanceCalculator

## Reference Implementation
Use `StairDesignCalculator.tsx` as the reference - it has a complete, working implementation.

## Step-by-Step Implementation

### Step 1: Add Imports
Add these imports at the top of the file:

```typescript
import { CalculatorActions } from "@/components/CalculatorActions";
import { useCalculationHistory } from "@/contexts/CalculationHistoryContext";
import { HistoryPanel } from "@/components/HistoryPanel";
```

Also ensure `useEffect` is imported from React:
```typescript
import { useState, useEffect } from "react";
```

### Step 2: Add State and Context
After the existing `useState` declarations, add:

```typescript
const [results, setResults] = useState<any>(null);
const { addToHistory } = useCalculationHistory();
```

### Step 3: Add useEffect Hook
Add this useEffect to automatically save results when calculations are performed.
**Important:** Customize the dependency array to include your calculator's input state variables.

```typescript
useEffect(() => {
  // Auto-save results when inputs change and calculation is performed
  if (result && Object.keys(result).length > 0) {
    setResults(result);
    addToHistory({
      calculatorType: "your_calculator_id", // e.g., "fire_separation"
      inputs: { /* your input state variables */ },
      results: result,
      preview: `Your Calculator Name calculation`
    });
  }
}, [/* your input state variables, result */]);
```

### Step 4: Implement getExportData Function
Add this function before the `return` statement. **Customize the data array to match your calculator's inputs and results:**

```typescript
const getExportData = () => {
  if (!results) return { filename: "", sheetName: "", data: [] };
  
  const data = [
    ["Parameter", "Value"],
    // Add your input parameters
    ["Input 1", String(inputValue1)],
    ["Input 2", String(inputValue2)],
    ["", ""],
    ["Results", ""],
    // Add your result fields
    ["Result 1", String(results.field1)],
    ["Result 2", String(results.field2)],
  ];
  
  return {
    filename: `Your_Calculator_Name_${new Date().toISOString().split('T')[0]}`,
    sheetName: "Your Calculator Name",
    data,
  };
};
```

### Step 5: Implement Load Handlers
Add these two functions before the `return` statement. **Customize to match your state variables:**

```typescript
const handleLoadPreset = (data: any) => {
  // Load preset data into state
  setInputValue1(data.inputValue1);
  setInputValue2(data.inputValue2);
  // ... set all your input state variables
};

const handleLoadHistory = (item: any) => {
  // Load history item inputs
  setInputValue1(item.inputs.inputValue1);
  setInputValue2(item.inputs.inputValue2);
  // ... set all your input state variables
  setResults(item.results);
};
```

### Step 6: Update CardHeader
Replace your existing `<CardHeader>` with this structure:

```typescript
<CardHeader className="pb-4 border-b border-border bg-muted/20">
  <div className="flex items-start justify-between">
    <div>
      <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
        {/* Your existing title content */}
      </CardTitle>
      {/* Your existing CardDescription if any */}
    </div>
    <div className="flex items-center gap-2">
      <HistoryPanel
        calculatorType="your_calculator_id"
        onLoadHistory={handleLoadHistory}
      />
      <CalculatorActions
        calculatorId="your_calculator_id"
        calculatorName="Your Calculator Name"
        exportData={getExportData}
        currentState={{
          inputValue1,
          inputValue2,
          // ... all your input state variables
        }}
        onLoadPreset={handleLoadPreset}
        hasResults={!!results}
      />
    </div>
  </div>
</CardHeader>
```

## Calculator IDs and Names

Use these consistent IDs and names for each calculator:

| Calculator File | calculatorId | calculatorName |
|----------------|--------------|----------------|
| BarrierFreeCalculator | `barrier_free` | `Barrier Free` |
| BatchStairCalculator | `batch_stair` | `Batch Stair` |
| BeamSpanCalculator | `beam_span` | `Beam Span` |
| ColumnSpanCalculator | `column_span` | `Column Span` |
| ConstructionLimitsCalculator | `construction_limits` | `Construction Limits` |
| EmergencyLightingCalculator | `emergency_lighting` | `Emergency Lighting` |
| ExitRequirementsCalculator | `exit_requirements` | `Exit Requirements` |
| FireAlarmCalculator | `fire_alarm` | `Fire Alarm` |
| FireSeparationCalculator | `fire_separation` | `Fire Separation` |
| FloorJoistSpanCalculator | `floor_joist_span` | `Floor Joist Span` |
| OccupantLoadCalculator | `occupant_load` | `Occupant Load` |
| PermitFeeCalculator | `permit_fee` | `Permit Fee` |
| RoofRafterSpanCalculator | `roof_rafter_span` | `Roof Rafter Span` |
| TravelDistanceCalculator | `travel_distance` | `Travel Distance` |

## Example: Complete Implementation

Here's a simplified example for a hypothetical calculator:

```typescript
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalculatorActions } from "@/components/CalculatorActions";
import { useCalculationHistory } from "@/contexts/CalculationHistoryContext";
import { HistoryPanel } from "@/components/HistoryPanel";

export function ExampleCalculator() {
  // Existing state
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [result, setResult] = useState<{ area: number } | null>(null);
  
  // New state for export
  const [results, setResults] = useState<any>(null);
  const { addToHistory } = useCalculationHistory();

  // Auto-save results
  useEffect(() => {
    if (result && Object.keys(result).length > 0) {
      setResults(result);
      addToHistory({
        calculatorType: "example",
        inputs: { width, height },
        results: result,
        preview: `Example calculation: ${width}m × ${height}m`
      });
    }
  }, [width, height, result]);

  // Export function
  const getExportData = () => {
    if (!results) return { filename: "", sheetName: "", data: [] };
    
    const data = [
      ["Parameter", "Value"],
      ["Width (m)", width],
      ["Height (m)", height],
      ["", ""],
      ["Results", ""],
      ["Area (m²)", String(results.area)],
    ];
    
    return {
      filename: `Example_Calculator_${new Date().toISOString().split('T')[0]}`,
      sheetName: "Example",
      data,
    };
  };

  // Load handlers
  const handleLoadPreset = (data: any) => {
    setWidth(data.width);
    setHeight(data.height);
  };

  const handleLoadHistory = (item: any) => {
    setWidth(item.inputs.width);
    setHeight(item.inputs.height);
    setResults(item.results);
  };

  // Calculate function
  const calculate = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    if (!isNaN(w) && !isNaN(h)) {
      setResult({ area: w * h });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Example Calculator
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <HistoryPanel
              calculatorType="example"
              onLoadHistory={handleLoadHistory}
            />
            <CalculatorActions
              calculatorId="example"
              calculatorName="Example"
              exportData={getExportData}
              currentState={{ width, height }}
              onLoadPreset={handleLoadPreset}
              hasResults={!!results}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Your calculator UI */}
      </CardContent>
    </Card>
  );
}
```

## Testing Checklist

After implementing export functionality for each calculator:

1. ✅ Calculator loads without errors
2. ✅ Perform a calculation - results appear
3. ✅ Click Excel export button - downloads .xlsx file
4. ✅ Open Excel file - verify all inputs and results are present
5. ✅ Click Save Preset - modal appears
6. ✅ Save a preset with a name
7. ✅ Click Load Preset - see your saved preset
8. ✅ Load the preset - inputs are restored
9. ✅ Click History button - see calculation history
10. ✅ Load a history item - inputs and results are restored

## Common Issues

### Issue: `result` is undefined in useEffect
**Solution:** Check that your calculator sets a `result` state variable when calculations are performed. If it uses a different variable name, adjust the useEffect accordingly.

### Issue: Excel file is empty
**Solution:** Verify that `getExportData()` returns the correct structure with `filename`, `sheetName`, and `data` array.

### Issue: History doesn't save
**Solution:** Ensure the `useEffect` dependency array includes all input variables that should trigger a save.

### Issue: TypeScript errors about missing properties
**Solution:** Make sure all state variables referenced in `currentState` prop are defined in your component.

## Priority Order

If implementing incrementally, prioritize these calculators (most commonly used):

1. **High Priority:**
   - ExitRequirementsCalculator
   - FireSeparationCalculator
   - OccupantLoadCalculator
   - TravelDistanceCalculator

2. **Medium Priority:**
   - BeamSpanCalculator
   - FloorJoistSpanCalculator
   - RoofRafterSpanCalculator
   - ColumnSpanCalculator

3. **Lower Priority:**
   - BarrierFreeCalculator
   - ConstructionLimitsCalculator
   - EmergencyLightingCalculator
   - FireAlarmCalculator
   - PermitFeeCalculator
   - BatchStairCalculator

## Notes

- The `CalculatorActions` component handles all the UI for export/save/load buttons
- The `HistoryPanel` component manages the calculation history sidebar
- The `useCalculationHistory` context stores history in localStorage
- All export files use the `.xlsx` format via the `xlsx` library
- Presets are stored in localStorage with the key pattern: `calculator_presets_{calculatorId}`

## Next Steps

1. Choose a calculator to implement
2. Follow the 6-step process above
3. Test thoroughly using the checklist
4. Move to the next calculator
5. After completing all 14, save a checkpoint with description: "Added Excel export functionality to all 14 remaining calculators"
