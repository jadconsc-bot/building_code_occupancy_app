/**
 * Compliance Pathway Report Component
 * 
 * Displays compliance pathways and justification narratives
 * Shows applicable clauses, alternative solutions, and risk assessment
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, Download, Copy, AlertCircle } from 'lucide-react';
import { Streamdown } from 'streamdown';

export interface ComplianceClause {
  clauseNumber: string;
  title: string;
  description: string;
  applicability: string;
  requirement: string;
  reference: string;
}

export interface AlternativeSolution {
  approach: string;
  advantages: string[];
  disadvantages: string[];
  nbcReference: string;
}

export interface RiskAssessment {
  issues: string[];
  mitigations: string[];
}

export interface CompliancePathwayReportProps {
  projectSummary?: {
    occupancy: string;
    area_m2: number;
    storeys: number;
    constructionType: string;
    sprinklers: boolean;
  };
  applicableClauses?: ComplianceClause[];
  alternativeSolutions?: AlternativeSolution[];
  riskAssessment?: RiskAssessment;
  justificationNarrative?: string;
  complianceSummary?: string;
  onExport?: () => void;
}

export const CompliancePathwayReport: React.FC<CompliancePathwayReportProps> = ({
  projectSummary,
  applicableClauses = [],
  alternativeSolutions = [],
  riskAssessment,
  justificationNarrative,
  complianceSummary,
  onExport,
}) => {
  const [copiedClause, setCopiedClause] = useState<string | null>(null);

  const copyToClipboard = (text: string, clauseId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClause(clauseId);
    setTimeout(() => setCopiedClause(null), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Project Summary */}
      {projectSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Project Summary</CardTitle>
            <CardDescription>Building parameters and classification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Occupancy</p>
                <p className="text-lg font-semibold">{projectSummary.occupancy}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Area</p>
                <p className="text-lg font-semibold">
                  {projectSummary.area_m2.toLocaleString()} m²
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Storeys</p>
                <p className="text-lg font-semibold">{projectSummary.storeys}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Construction</p>
                <p className="text-lg font-semibold">{projectSummary.constructionType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sprinklers</p>
                <p className="text-lg font-semibold">
                  {projectSummary.sprinklers ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Status */}
      {complianceSummary && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Compliance Status:</strong> {complianceSummary}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for different sections */}
      <Tabs defaultValue="narrative" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="narrative">Narrative</TabsTrigger>
          <TabsTrigger value="clauses">Clauses</TabsTrigger>
          <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
        </TabsList>

        {/* Justification Narrative Tab */}
        <TabsContent value="narrative" className="space-y-4">
          {justificationNarrative ? (
            <Card>
              <CardHeader>
                <CardTitle>Compliance Justification</CardTitle>
                <CardDescription>
                  Code-based justification for this design
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <Streamdown>{justificationNarrative}</Streamdown>
                </div>
                {onExport && (
                  <Button
                    onClick={onExport}
                    className="mt-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No justification narrative available. Run a compliance analysis to generate one.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Applicable Clauses Tab */}
        <TabsContent value="clauses" className="space-y-4">
          {applicableClauses.length > 0 ? (
            <div className="space-y-3">
              {applicableClauses.map((clause) => (
                <Card key={clause.clauseNumber}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{clause.clauseNumber}</Badge>
                          <CardTitle className="text-base">{clause.title}</CardTitle>
                        </div>
                        <CardDescription className="mt-1">
                          {clause.reference}
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          copyToClipboard(
                            `${clause.clauseNumber}: ${clause.title}`,
                            clause.clauseNumber
                          )
                        }
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        Description
                      </p>
                      <p className="text-sm">{clause.description}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        Applicability
                      </p>
                      <p className="text-sm">{clause.applicability}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        Requirement
                      </p>
                      <p className="text-sm">{clause.requirement}</p>
                    </div>
                    {copiedClause === clause.clauseNumber && (
                      <p className="text-xs text-green-600">Copied to clipboard!</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No applicable clauses found. Run a compliance analysis to identify applicable NBC requirements.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Alternative Solutions Tab */}
        <TabsContent value="alternatives" className="space-y-4">
          {alternativeSolutions.length > 0 ? (
            <div className="space-y-3">
              {alternativeSolutions.map((solution, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{solution.approach}</CardTitle>
                        <CardDescription>{solution.nbcReference}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-green-700 mb-2">
                        ✓ Advantages
                      </p>
                      <ul className="text-sm space-y-1">
                        {solution.advantages.map((adv, i) => (
                          <li key={i} className="text-green-600">
                            • {adv}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-700 mb-2">
                        ✗ Disadvantages
                      </p>
                      <ul className="text-sm space-y-1">
                        {solution.disadvantages.map((dis, i) => (
                          <li key={i} className="text-red-600">
                            • {dis}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No alternative solutions available. Run a compliance analysis to generate alternatives.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risks" className="space-y-4">
          {riskAssessment && (riskAssessment.issues.length > 0 || riskAssessment.mitigations.length > 0) ? (
            <div className="space-y-4">
              {riskAssessment.issues.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <CardTitle className="text-base text-orange-900">
                        Identified Issues
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {riskAssessment.issues.map((issue, i) => (
                        <li key={i} className="text-sm text-orange-800">
                          • {issue}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {riskAssessment.mitigations.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-base text-blue-900">
                        Recommended Mitigations
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {riskAssessment.mitigations.map((mitigation, i) => (
                        <li key={i} className="text-sm text-blue-800">
                          • {mitigation}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No risk assessment available. Run a compliance analysis to identify risks and mitigations.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
