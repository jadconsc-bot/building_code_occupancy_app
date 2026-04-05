# BC Energy Step Code Enhancement Components

## Components to Implement

### 1. LanguageToggle.tsx
```
Location: components/ui/LanguageToggle.tsx
Features:
- EN/FR toggle button (visible in BC, conditionally hidden in AB)
- Persist preference in user settings (localStorage + backend)
- Affects: Rule descriptions, report templates, UI labels, error messages
- Integration with uiTranslations table
- Auto-detect browser language for new users
```

### 2. EnergyFeaturesPanel.tsx
```
Location: components/drawings/EnergyFeaturesPanel.tsx
Layout: Side-by-side drawing viewer + extracted data panel
Features:
- Drawing zoom/pan with highlight overlays for detected windows/walls
- Editable extracted data: Window areas, R-values, orientations
- Confidence indicators: Green (>90%), Yellow (70-90%), Red (<70%)
- Manual correction workflow with audit trail
- "Send to Step Code Calculator" button (pre-populates inputs)
- Export to CSV for energy modeller
```

## Rule Evaluation Functions

### 1. evaluateInsulationRule()
Evaluate NBC 9.36.2 insulation requirements based on heating degree days

```typescript
function evaluateInsulationRule(
  rule: NBCRule, 
  project: Project, 
  extraction: DrawingDataExtraction
): ComplianceResult {
  const hdd = project.jurisdictionProfile.heatingDegreeDays;
  const zone = hdd > 5500 ? "Zone 7" : hdd > 4000 ? "Zone 5" : "Zone 4";
  const requiredRValue = rule.rValues[zone];
  const actualRValue = extraction.energyFeatures.wallAreas.find(
    w => w.type === "above_grade"
  )?.rValue;
  
  return {
    status: actualRValue >= requiredRValue ? "PASS" : "FAIL",
    required: requiredRValue,
    actual: actualRValue,
    clause: `NBC 9.36.2.${zone === "Zone 7" ? "4" : "3"}`
  };
}
```

### 2. evaluateStepCodeRule()
BC municipalities enforce different tiers based on adoption dates

```typescript
function evaluateStepCodeRule(project: Project): ComplianceResult {
  const profile = project.jurisdictionProfile;
  if (!profile.stepCodeAdopted) {
    return { status: "NOT_APPLICABLE", message: "Step Code not adopted in this jurisdiction" };
  }
  
  const requiredTier = parseInt(profile.currentStepCodeTier);
  const achievedTier = parseInt(project.energyModel?.stepCodeTier?.tier || "0");
  
  return {
    status: achievedTier >= requiredTier ? "PASS" : "FAIL",
    required: `Tier ${requiredTier}`,
    actual: `Tier ${achievedTier}`,
    message: achievedTier >= requiredTier 
      ? "Complies with municipal Step Code requirements"
      : `Must achieve Tier ${requiredTier} for ${profile.municipality} permits`
  };
}
```

## Awaiting Implementation Data

1. **TEDI/TEUI Targets** — BC Energy Step Code Tiers 1-5 by climate zone and building type
2. **BC Jurisdiction Data** — Municipalities, climate zones, seismic zones, Step Code adoption status
3. **Regulatory References** — Code sections, document links, effective dates

Status: Ready to implement once data is provided
