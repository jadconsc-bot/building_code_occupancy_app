# BC/AB Building Code Compliance Test Suite

Comprehensive testing framework for BC Energy Step Code and Alberta NBC compliance system.

## Overview

This test suite includes:
- **80+ Vitest unit tests** covering all compliance rules
- **Postman collection** for API endpoint testing
- **Synthetic PDF generator** for drawing analysis testing
- **Test data** for all climate zones and building types

## Test Coverage

### 1. Database & Data Integrity (5 tests)
- ✅ Step Code tiers seeded correctly (25+ rows)
- ✅ Jurisdiction profiles for major cities
- ✅ Foreign key constraints
- ✅ Immutable audit records
- ✅ French translation completeness

### 2. Jurisdiction Detection (7 tests)
- ✅ Vancouver (Zone 4, High Seismic, Tier 3)
- ✅ Calgary (Zone 7a, Low Seismic, No Step Code)
- ✅ Edmonton (Zone 7a, Extreme Cold)
- ✅ Victoria (Zone 4, Intermediate Seismic, Tier 2)
- ✅ Kelowna (Zone 5, Low Seismic, Tier 3)
- ✅ Invalid address error handling
- ✅ Rural BC fallback

### 3. Step Code Compliance (12 tests)
**Part 9 Residential - Zone 4 (Vancouver):**
- ✅ Tier 3: PASS both TEDI/MEUI
- ✅ Tier 3: FAIL TEDI
- ✅ Tier 3: FAIL MEUI
- ✅ Tier 5: PASS both
- ✅ Tier 5: FAIL TEDI
- ✅ Tier 4: Multiplex PASS

**Part 9 - Zone 5 (Kelowna):**
- ✅ Tier 3: PASS
- ✅ Tier 3: FAIL
- ✅ Tier 4: PASS

**Part 9 - Zone 7a (Northern):**
- ✅ Tier 3: PASS
- ✅ Tier 4: PASS
- ✅ Tier 4: FAIL

**Part 3 Commercial:**
- ✅ MURB, Office, Retail compliance checks

### 4. Climate-Dependent Rules (5 tests)
- ✅ Calgary Zone 7 insulation requirements (R-22)
- ✅ Vancouver Zone 4 insulation requirements (R-16)
- ✅ Edmonton design temperature (-37°C)
- ✅ Victoria design temperature (-8°C)

### 5. Seismic Rules (6 tests)
- ✅ Vancouver High Seismic - Regular shape PASS
- ✅ Vancouver High Seismic - Soft story CONDITIONAL
- ✅ Vancouver High Seismic - Irregular shape CONDITIONAL
- ✅ Kelowna Low Seismic - NOT_APPLICABLE
- ✅ Calgary Low Seismic - NOT_APPLICABLE
- ✅ Victoria Intermediate Seismic - PASS

### 6. Bilingual Support (6 tests)
- ✅ French calculator titles
- ✅ French report headers
- ✅ French occupancy labels
- ✅ French error messages
- ✅ All calculator translations EN/FR

### 7. Edge Cases (5 tests)
- ✅ BC/AB border handling (Lloydminster)
- ✅ Negative TEDI validation
- ✅ Zero airtightness validation
- ✅ Duplicate project names
- ✅ Missing required fields

### 8. Data Validation (5 tests)
- ✅ TEDI range validation (0-200)
- ✅ Airtightness range validation (>0, ≤10)
- ✅ Climate zone validation
- ✅ Seismic zone validation
- ✅ Step Code tier validation (1-5)

## Running Tests

### Prerequisites

```bash
# Install dependencies
pnpm install

# Ensure database is migrated
pnpm db:push
```

### Unit Tests (Vitest)

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test stepCode.compliance.test.ts

# Run with coverage
pnpm test -- --coverage

# Watch mode
pnpm test -- --watch
```

### API Tests (Postman)

#### Option 1: Postman Desktop App
1. Open Postman
2. Import `BC_AB_Compliance_API.postman_collection.json`
3. Set `base_url` variable to `http://localhost:3000`
4. Run collection

#### Option 2: Newman CLI
```bash
# Install Newman
npm install -g newman

# Run collection
newman run BC_AB_Compliance_API.postman_collection.json \
  --environment postman-env.json \
  --reporters cli,json \
  --reporter-json-export test-results.json
```

#### Option 3: cURL Commands

**Jurisdiction Detection:**
```bash
curl -X POST http://localhost:3000/api/trpc/jurisdiction.detect \
  -H "Content-Type: application/json" \
  -d '{"address":"123 W Georgia St, Vancouver, BC"}'
```

**Step Code Compliance Check:**
```bash
curl -X POST http://localhost:3000/api/trpc/stepCode.check \
  -H "Content-Type: application/json" \
  -d '{
    "projectId":"proj_001",
    "jurisdictionId":"vancouver",
    "buildingType":"part9_single_family",
    "tier":"3",
    "modelledTedi":28,
    "modelledMeui":45,
    "airtightness":2.3
  }'
```

### Drawing Analysis Tests

#### Generate Synthetic Test Drawings
```bash
# Generate all test PDFs
node tests/generateTestDrawings.mjs

# Output directory: tests/test-drawings/
```

Generated files:
- `rect_10x20.pdf` - Simple rectangle (200m²)
- `L_shape.pdf` - Complex L-shaped geometry (350m²)
- `multi_room.pdf` - Multi-room floor plan (47m²)
- `north_arrow.pdf` - Site plan with orientation
- `window_callouts.pdf` - Elevation with window dimensions
- `section_with_rvalues.pdf` - Building section with R-values
- `low_quality_scan.pdf` - Low-quality scan for error handling

#### Upload and Test
```bash
# Upload drawing
curl -X POST http://localhost:3000/api/trpc/drawings.upload \
  -F "file=@tests/test-drawings/rect_10x20.pdf" \
  -F "projectId=proj_001"

# Analyze energy features
curl -X POST http://localhost:3000/api/trpc/energyAnalysis.analyze \
  -H "Content-Type: application/json" \
  -d '{"drawingId":"drawing_001","useLLM":true}'
```

## Test Data

### Jurisdiction Profiles
| Municipality | Province | Climate Zone | HDD | Seismic | Step Code |
|---|---|---|---|---|---|
| Vancouver | BC | 4 | 2800 | High | Tier 3 |
| Victoria | BC | 4 | 2400 | Intermediate | Tier 2 |
| Kelowna | BC | 5 | 3200 | Low | Tier 3 |
| Prince George | BC | 7a | 5200 | Low | Tier 3 |
| Calgary | AB | 7a | 5500 | Low | None |
| Edmonton | AB | 7a | 5500 | Low | None |

### Step Code Tiers (Part 9 Single Family)
| Zone | Tier | TEDI (kWh/m²) | MEUI (kWh/m²) | ACH₅₀ |
|---|---|---|---|---|
| 4 | 1 | 50 | 80 | — |
| 4 | 2 | 45 | 60 | ≤3.0 |
| 4 | 3 | 30 | 50 | ≤2.5 |
| 4 | 4 | 20 | 40 | ≤1.5 |
| 4 | 5 | 15 | 25 | ≤1.0 |

## Test Scenarios

### End-to-End: Full Vancouver Project
1. Detect jurisdiction (Vancouver)
2. Upload drawing
3. Extract energy features (LLM)
4. Set Step Code Tier 3
5. Run compliance check
6. Generate report with professional seal

**Expected Result:** Report shows Zone 4, Tier 3 target, TEDI/MEUI compliance status

### End-to-End: Calgary Cold Climate
1. Detect jurisdiction (Calgary)
2. Verify no Step Code option
3. Check insulation rules (NBC 9.36.2)
4. Generate NBC report

**Expected Result:** Report shows Zone 7A, HDD 5500, R-22 required, no Step Code section

### End-to-End: BC Tier Upgrade
1. Create project at Tier 2
2. Recalculate at Tier 3
3. Compare versions

**Expected Result:** Version history shows both calculations, deltas highlighted

## Performance Targets

| Test | Target | Method |
|---|---|---|
| Jurisdiction API response | < 500ms | Load test 100 requests |
| Drawing analysis (LLM) | < 30 seconds | Time Claude Vision extraction |
| Report generation | < 5 seconds | Generate PDF with charts |
| Database query (complex join) | < 100ms | Query projects with calculations |

## Security Tests

| Test | Expected | Method |
|---|---|---|
| SQL injection attempt | Blocked | Try `' OR 1=1 --` in address field |
| Unauthorized access | Denied | User A tries to access User B's project |
| Immutable record tampering | Prevented | Direct SQL UPDATE on calculationResults |
| Signature verification | Fail on tamper | Modify result data, verify signature fails |

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm db:push
      - run: pnpm test
      - run: pnpm test:coverage
```

## Troubleshooting

### Tests fail with "Database not found"
```bash
# Ensure database is migrated
pnpm db:push
```

### Postman tests return 401 Unauthorized
```bash
# Ensure you're authenticated
# Set Authorization header in Postman pre-request script:
pm.request.headers.add({
  key: "Authorization",
  value: "Bearer " + pm.environment.get("auth_token")
});
```

### Drawing analysis returns low confidence
```bash
# Generate higher-quality test drawings
node tests/generateTestDrawings.mjs

# Use real drawings for final validation
```

## Test Maintenance

### Adding New Tests
1. Add test case to `stepCode.compliance.test.ts`
2. Follow existing naming convention: `TEST-ID: Description`
3. Include comments explaining expected behavior
4. Run `pnpm test` to verify
5. Update this README with new test count

### Updating Test Data
1. Edit `drizzle/seed-bc-step-code.sql`
2. Run `pnpm db:push`
3. Verify test data with `pnpm test`

### Postman Collection Updates
1. Export updated collection from Postman
2. Save to `BC_AB_Compliance_API.postman_collection.json`
3. Update test documentation

## Resources

- [BC Energy Step Code Official](https://www.bchousing.org/publications/BC-Energy-Step-Code-2017-Metrics-Full.pdf)
- [NBC 2023 Alberta Edition](https://www.nrc.cnrc.gc.ca/eng/solutions/advisory/codes_standards/codes/national_building_code.html)
- [Vitest Documentation](https://vitest.dev/)
- [Postman Documentation](https://learning.postman.com/)

## Support

For issues or questions about the test suite:
1. Check this README
2. Review test comments in `stepCode.compliance.test.ts`
3. Run tests with `--reporter=verbose` for detailed output
4. Check Postman console for API response details
