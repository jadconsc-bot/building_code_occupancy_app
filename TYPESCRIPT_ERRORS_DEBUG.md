# TypeScript Errors - Debugging Notes

## Current Status
- 20 TypeScript errors remaining
- Main blockers: stepCodeRouter insert statement, jurisdictionRouter output type mismatch

## Error 1: stepCodeRouter insert statement (Line 265)
**Error:** `No overload matches this call. Object literal may only specify known properties, and 'projectId' does not exist`

**Root Cause:** Drizzle type inference issue with decimal fields. The schema defines `tediTarget`, `tediModelled`, etc. as `decimal()` types, but the insert is receiving JavaScript `number` types.

**Solution Options:**
1. Convert all decimal fields to strings before insert:
   ```typescript
   tediTarget: tierData.tediTarget.toString(),
   tediModelled: input.tediModelled.toString(),
   ```

2. Use Decimal library:
   ```typescript
   import { Decimal } from 'decimal.js';
   tediTarget: new Decimal(tierData.tediTarget),
   ```

3. Let Drizzle auto-generate the `id` field (remove manual `id: analysisId`):
   ```typescript
   // Remove id field - let database auto-generate UUID
   await db.insert(stepCodeAnalyses).values({
     projectId: input.projectId,
     // ... rest of fields
   });
   ```

**Recommended:** Option 3 - Remove manual `id` field and let database generate UUID

## Error 2: jurisdictionRouter listSupported output type (Line 280)
**Error:** `Type 'string | null' is not assignable to type 'string'`

**Root Cause:** Schema defines `municipality` and `stepCodeAdopted` as nullable, but output schema expects non-nullable.

**Solution:** Already applied - changed output schema to accept nullable values:
```typescript
municipality: z.string().nullable(),
stepCodeAdopted: z.boolean().nullable()
```

**Status:** ✅ FIXED

## Error 3: drawingAnalysisRouter fileName property (Line 648)
**Error:** `Property 'fileName' does not exist on type`

**Root Cause:** The `drawingAnalyses` table doesn't have a `fileName` column.

**Solution:** Already applied - removed `fileName: analysis.fileName` from return object

**Status:** ✅ FIXED

## Remaining Issues to Address

### stepCodeRouter Decimal Handling
The `stepCodeTiers` table returns decimal values that need proper conversion:
- `tierData.tediTarget` - decimal
- `tierData.teuiTarget` - decimal
- `tierData.airtightnessMax` - decimal
- `tierData.mechEfficiencyMin` - decimal

These should be converted to strings or Decimal objects before insert.

### Recommended Next Steps

1. **Remove manual UUID generation from stepCodeRouter:**
   - Delete `const analysisId = nanoid();`
   - Remove `id: analysisId,` from insert
   - Let MySQL auto-generate UUID for `id` field

2. **Convert decimal fields:**
   ```typescript
   tediTarget: tierData.tediTarget ? tierData.tediTarget.toString() : "0",
   tediModelled: input.tediModelled.toString(),
   teuiTarget: tierData.teuiTarget ? tierData.teuiTarget.toString() : "0",
   teuiModelled: input.teuiModelled.toString(),
   ```

3. **Verify all decimal conversions are consistent across all routers**

4. **Run `pnpm tsc --noEmit` to verify all errors are resolved**

## Test Plan After Fixes

1. Unit tests: `pnpm test`
2. Build: `pnpm build`
3. Dev server: `pnpm dev`
4. Manual API test: POST /api/trpc/stepCode.check with sample data

## Files Modified
- server/routers/stepCodeRouter.ts (line 265)
- server/routers/jurisdictionRouter.ts (line 280)
- server/routers/drawingAnalysisRouter.ts (line 648)
