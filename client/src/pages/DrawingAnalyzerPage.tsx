/**
 * Drawing Analyzer Page
 *
 * Standalone page for the Drawing Analyzer tool, accessible at /drawing-analyzer.
 * Wraps the DrawingAnalysis component with a full-page layout, breadcrumb navigation,
 * and the Prime Directive 2.0 disclaimer gate.
 *
 * Per PD2.0 §6.3: Disclaimer must be acknowledged before any analysis.
 * Per PD2.0 §4.1: LLM only extracts data; deterministic engine evaluates compliance.
 */

import { Link } from "wouter";
import { FileImage, ChevronRight, LayoutDashboard } from "lucide-react";
import { DrawingAnalysis } from "@/components/DrawingAnalysis";

export default function DrawingAnalyzerPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="flex items-center gap-1 text-foreground font-medium">
            <FileImage className="h-3.5 w-3.5" />
            Drawing Analyzer
          </span>
        </nav>

        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-lg">
              <FileImage className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Drawing Analyzer</h1>
              <p className="text-sm text-muted-foreground">
                AI-assisted drawing review — extracts dimensions and measurements for compliance reference
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <span className="font-semibold">PD2.0 Notice:</span>
            <span>
              This tool uses AI to <strong>extract and interpret</strong> drawing data only. All compliance
              determinations are made by a deterministic rule engine referencing NBC 2023 Alberta Edition.
              Results require professional review before use in any regulatory context.
            </span>
          </div>
        </div>

        {/* Drawing Analysis Component */}
        <DrawingAnalysis />
      </div>
    </div>
  );
}
