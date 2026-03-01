/**
 * LegalDisclaimer Component
 * Comprehensive legal disclaimers for court-defensible compliance analysis
 * This component provides the legal framework necessary for results to withstand
 * legal scrutiny and be admissible in regulatory proceedings.
 */

import { useState } from "react";
import { AlertTriangle, FileText, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LegalDisclaimer() {
  const [expanded, setExpanded] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <Card className="border-red-300 bg-red-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <CardTitle className="text-red-900">LEGAL DISCLAIMER & PROFESSIONAL LIABILITY</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-red-600 hover:text-red-700"
          >
            {expanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          <Tabs defaultValue="disclaimer" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="disclaimer">Disclaimer</TabsTrigger>
              <TabsTrigger value="liability">Liability</TabsTrigger>
              <TabsTrigger value="audit">Audit Trail</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
            </TabsList>

            <TabsContent value="disclaimer" className="space-y-4 mt-4">
              <div className="bg-white p-4 rounded-lg border border-red-200 space-y-4 text-sm">
                <div>
                  <h4 className="font-bold text-red-900 mb-2">1. NO WARRANTY</h4>
                  <p className="text-gray-700">
                    This compliance analysis engine is provided "AS IS" without warranty of any kind, express or
                    implied, including but not limited to warranties of merchantability, fitness for a particular
                    purpose, or non-infringement. The analysis results are based on building codes and regulations in
                    effect at the time of evaluation.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-red-900 mb-2">2. PROFESSIONAL REVIEW REQUIRED</h4>
                  <p className="text-gray-700">
                    <strong>These results must be reviewed and validated by a qualified professional</strong> (licensed
                    architect, engineer, or building code official) before use in any legal, regulatory, or commercial
                    context. Automated analysis cannot replace professional judgment and site-specific evaluation.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-red-900 mb-2">3. CODE EDITION SPECIFICITY</h4>
                  <p className="text-gray-700">
                    Results are specific to the selected building code edition (e.g., NBC 2025, amendments). Changes in
                    code editions, amendments, or local amendments may affect compliance determinations. The user is
                    responsible for selecting the correct code edition applicable to their jurisdiction.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-red-900 mb-2">4. JURISDICTIONAL VARIATIONS</h4>
                  <p className="text-gray-700">
                    Building codes vary by jurisdiction. Local amendments, provincial regulations, and municipal bylaws
                    may supersede or modify national code requirements. This tool provides analysis based on the base
                    code edition only. Local variations must be independently verified.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-red-900 mb-2">5. NOT A SUBSTITUTE FOR LEGAL COUNSEL</h4>
                  <p className="text-gray-700">
                    This tool is not a substitute for legal advice. For matters with legal implications, consult with a
                    qualified attorney. Compliance analysis results should not be relied upon as legal advice.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-red-900 mb-2">6. LIMITATION OF LIABILITY</h4>
                  <p className="text-gray-700">
                    In no event shall the developers, providers, or operators of this tool be liable for any indirect,
                    incidental, special, consequential, or punitive damages arising from the use of or inability to use
                    the analysis results, even if advised of the possibility of such damages.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-red-900 mb-2">7. DETERMINISTIC ANALYSIS</h4>
                  <p className="text-gray-700">
                    This engine provides deterministic analysis: identical inputs using the same ruleset will always
                    produce identical outputs. However, the correctness of outputs depends entirely on the accuracy and
                    completeness of inputs provided by the user.
                  </p>
                </div>

                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-xs font-bold text-yellow-900">
                    ⚠️ USER ASSUMES ALL RESPONSIBILITY for the accuracy of input data, selection of applicable code
                    edition, and verification of results by qualified professionals.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="liability" className="space-y-4 mt-4">
              <div className="bg-white p-4 rounded-lg border border-red-200 space-y-4 text-sm">
                <div>
                  <h4 className="font-bold text-red-900 mb-2">PROFESSIONAL LIABILITY FRAMEWORK</h4>
                  <p className="text-gray-700 mb-3">
                    This tool is designed to support professional decision-making, not replace it. The following
                    framework applies:
                  </p>

                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-semibold text-gray-900">User Responsibility</p>
                      <p className="text-gray-700 text-xs mt-1">
                        User is responsible for: (1) selecting correct code edition, (2) providing accurate inputs,
                        (3) obtaining professional review, (4) verifying results on site, (5) complying with local
                        amendments.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-semibold text-gray-900">Tool Provider Responsibility</p>
                      <p className="text-gray-700 text-xs mt-1">
                        Tool provider is responsible for: (1) maintaining accurate rulesets, (2) documenting rule
                        changes, (3) preserving immutable snapshots, (4) providing audit trails, (5) clear disclaimers.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-semibold text-gray-900">Professional Reviewer Responsibility</p>
                      <p className="text-gray-700 text-xs mt-1">
                        Professional reviewer is responsible for: (1) validating inputs, (2) site verification,
                        (3) local amendment compliance, (4) professional judgment, (5) professional liability insurance.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-xs font-bold text-blue-900">
                    💼 This tool maintains immutable audit trails of all analyses for legal discovery and professional
                    liability defense.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audit" className="space-y-4 mt-4">
              <div className="bg-white p-4 rounded-lg border border-red-200 space-y-4 text-sm">
                <div>
                  <h4 className="font-bold text-red-900 mb-2">IMMUTABLE AUDIT TRAIL</h4>
                  <p className="text-gray-700 mb-3">
                    Every compliance analysis creates an immutable snapshot that includes:
                  </p>

                  <ul className="space-y-2 text-gray-700">
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Timestamp:</strong> Exact date/time of analysis creation (UTC)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Ruleset Version:</strong> Specific code edition and version used
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Input Data:</strong> Complete record of all inputs provided
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Rule Trace:</strong> Which rules fired and why
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Output Results:</strong> Complete analysis results
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>User Identity:</strong> Who performed the analysis
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Integrity Hash:</strong> Cryptographic verification of snapshot integrity
                      </span>
                    </li>
                  </ul>

                  <p className="text-gray-700 mt-4">
                    Snapshots are immutable and cannot be modified after creation. This provides a complete audit trail
                    suitable for legal discovery and professional liability defense.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="terms" className="space-y-4 mt-4">
              <div className="bg-white p-4 rounded-lg border border-red-200 space-y-4 text-sm">
                <div>
                  <h4 className="font-bold text-red-900 mb-2">TERMS OF USE</h4>
                  <p className="text-gray-700 mb-3">By using this compliance analysis tool, you agree to:</p>

                  <ol className="space-y-2 text-gray-700 list-decimal list-inside">
                    <li>Obtain professional review before relying on results for any legal or regulatory purpose</li>
                    <li>Verify all inputs are accurate and complete</li>
                    <li>Select the correct building code edition for your jurisdiction</li>
                    <li>Independently verify compliance with local amendments and bylaws</li>
                    <li>Maintain records of all analyses and professional reviews</li>
                    <li>Not misrepresent the tool's capabilities or limitations</li>
                    <li>Not rely on results as a substitute for professional judgment</li>
                    <li>Indemnify and hold harmless the tool provider from any claims arising from misuse</li>
                  </ol>
                </div>

                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="text-xs font-bold text-green-900">
                    ✓ By acknowledging these terms, you accept full responsibility for the use of analysis results.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Acknowledgment Checkbox */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-red-600"
              />
              <span className="text-sm text-gray-700">
                <strong>I acknowledge that:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                  <li>I have read and understand all legal disclaimers</li>
                  <li>Results must be reviewed by a qualified professional</li>
                  <li>I assume responsibility for accuracy of inputs and verification of results</li>
                  <li>I will not rely on this tool as a substitute for professional judgment</li>
                  <li>I understand the limitations and jurisdictional variations</li>
                </ul>
              </span>
            </label>

            {acknowledged && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium">Legal acknowledgment recorded</span>
              </div>
            )}
          </div>
        </CardContent>
      )}

      {!expanded && (
        <CardContent className="pt-4">
          <p className="text-sm text-red-900 font-semibold">
            ⚠️ IMPORTANT: Click to expand and review legal disclaimers before using this tool for any legal or
            regulatory purpose.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
