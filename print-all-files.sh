#!/bin/bash
# CodeComply — Print All Project Files to Console
# Run from project root: ./print-all-files.sh

echo "=========================================="
echo " 📄 CODECOMPLY — ALL FILES DUMP"
echo "=========================================="
echo ""

# Helper to print file with header
print_file() {
  if [ -f "$1" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo " 📁 $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cat "$1"
    echo ""
    echo ""
  else
    echo "⚠️  NOT FOUND: $1"
    echo ""
  fi
}

# ─── Client files ───
print_file "client/index.html"
print_file "client/src/main.tsx"
print_file "client/src/_core/hooks/useAuth.ts"
print_file "client/src/components/DrawingAnalysis.tsx"
print_file "client/src/components/ProfessionalReviewPanel.tsx"
print_file "client/src/App.tsx"

# ─── Server core (locked) ───
print_file "server/_core/env.ts"
print_file "server/_core/middleware/auth.ts"
print_file "server/services/complianceEngine.ts"
print_file "server/services/compliancePathwayGenerator.ts"
print_file "server/routers/complianceRouter.ts"
print_file "server/routers/drawingAnalysisRouter.ts"

# ─── Engine ───
print_file "server/engine/constraints/index.ts"
print_file "server/engine/types/trace.ts"
print_file "server/engine/rules/egress.ts"
print_file "server/engine/rules/fire.ts"
print_file "server/engine/rules/occupancy.ts"
print_file "server/engine/RuleResolver.ts"
print_file "server/engine/EvaluationContract.ts"
print_file "server/engine/EvaluationEngine.ts"

# ─── Spatial Intelligence ───
print_file "server/engine/spatial/roomDetectionService.ts"
print_file "server/engine/spatial/azureOcrService.ts"
print_file "server/engine/spatial/legendExtractor.ts"
print_file "server/engine/spatial/legendSanitiser.ts"
print_file "server/engine/spatial/promptLibrary.ts"
print_file "server/engine/spatial/roomDetectionPrompt.ts"
print_file "server/engine/spatial/roomDetectionEvaluator.ts"
print_file "server/engine/spatial/roomComplianceEvaluator.ts"
print_file "server/engine/spatial/types.ts"

# ─── Schema & Config ───
print_file "drizzle/schema.ts"
print_file "docs/COMPLIANCE_RULES_SKILL.md"
print_file "package.json"
print_file "tsconfig.json"
print_file ".env.example"

echo "=========================================="
echo " ✅ DUMP COMPLETE — Paste above into chat"
echo "=========================================="
