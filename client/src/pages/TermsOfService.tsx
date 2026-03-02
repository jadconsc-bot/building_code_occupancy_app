/**
 * Terms of Service Page
 * Legal terms and conditions for using the Building Code Occupancy Classifier
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export default function TermsOfService() {
  const [location, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Building Code Occupancy Classifier - Legal Terms and Conditions
          </p>
          <p className="text-sm text-muted-foreground">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Table of Contents */}
        <Card>
          <CardHeader>
            <CardTitle>Table of Contents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li><a href="#disclaimer" className="text-primary hover:underline">1. Disclaimer of Warranties</a></li>
              <li><a href="#professional-review" className="text-primary hover:underline">2. Professional Review Required</a></li>
              <li><a href="#liability" className="text-primary hover:underline">3. Limitation of Liability</a></li>
              <li><a href="#code-versions" className="text-primary hover:underline">4. Building Code Versions</a></li>
              <li><a href="#user-responsibility" className="text-primary hover:underline">5. User Responsibility</a></li>
              <li><a href="#acceptable-use" className="text-primary hover:underline">6. Acceptable Use</a></li>
              <li><a href="#audit-trail" className="text-primary hover:underline">7. Audit Trail and Records</a></li>
              <li><a href="#modifications" className="text-primary hover:underline">8. Modifications to Terms</a></li>
            </ul>
          </CardContent>
        </Card>

        {/* 1. Disclaimer */}
        <Card id="disclaimer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              1. Disclaimer of Warranties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              This Building Code Occupancy Classifier tool is provided "AS IS" without warranty of any kind, express or implied, 
              including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
            <p>
              The analysis results are based on building codes and regulations in effect at the time of evaluation. The developers, 
              operators, and distributors of this application make no warranty that the results will be accurate, complete, or 
              suitable for any particular purpose.
            </p>
            <p className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <strong>Important:</strong> This tool is not a substitute for professional engineering, architectural, or legal advice. 
              All results must be reviewed and validated by a qualified professional before use in any legal, regulatory, or commercial context.
            </p>
          </CardContent>
        </Card>

        {/* 2. Professional Review */}
        <Card id="professional-review">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              2. Professional Review Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              <strong>All compliance analysis results must be reviewed and validated by a qualified professional</strong> before 
              implementation. Qualified professionals include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Licensed Professional Engineers (P.Eng)</li>
              <li>Licensed Architects (OAA, RAIC)</li>
              <li>Certified Building Code Officials</li>
              <li>Other professionals with relevant expertise in building codes and compliance</li>
            </ul>
            <p>
              Automated analysis cannot replace professional judgment, site-specific evaluation, and verification of local amendments. 
              The professional reviewer assumes responsibility for the accuracy and appropriateness of the analysis results.
            </p>
          </CardContent>
        </Card>

        {/* 3. Limitation of Liability */}
        <Card id="liability">
          <CardHeader>
            <CardTitle>3. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              In no event shall the developers, providers, operators, or distributors of this tool be liable for any direct, indirect, 
              incidental, special, consequential, or punitive damages arising from the use of or inability to use the analysis results, 
              including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Loss of profits or revenue</li>
              <li>Loss of data or business interruption</li>
              <li>Regulatory fines or penalties</li>
              <li>Project delays or cost overruns</li>
              <li>Professional liability claims</li>
              <li>Any other indirect or consequential damages</li>
            </ul>
            <p>
              This limitation applies even if advised of the possibility of such damages. Some jurisdictions do not allow the exclusion 
              or limitation of incidental or consequential damages, so this limitation may not apply to you.
            </p>
          </CardContent>
        </Card>

        {/* 4. Building Code Versions */}
        <Card id="code-versions">
          <CardHeader>
            <CardTitle>4. Building Code Versions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              This application is based on the <strong>National Building Code 2023 Alberta Edition (NBC 2023 AE)</strong>. 
              Building codes are updated periodically, and local amendments may supersede or modify national code requirements.
            </p>
            <p>
              Users are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Selecting the correct building code edition applicable to their jurisdiction</li>
              <li>Verifying compliance with current applicable building codes</li>
              <li>Checking for local municipal amendments and bylaws</li>
              <li>Confirming code edition currency before proceeding with any construction project</li>
            </ul>
            <p>
              Changes in code editions, amendments, or local amendments may affect compliance determinations. The tool provider 
              is not responsible for changes in building codes or local regulations.
            </p>
          </CardContent>
        </Card>

        {/* 5. User Responsibility */}
        <Card id="user-responsibility">
          <CardHeader>
            <CardTitle>5. User Responsibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              By using this tool, you agree to assume full responsibility for:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Accuracy and completeness of all input data provided</li>
              <li>Selection of the correct building code edition for your jurisdiction</li>
              <li>Obtaining professional review of all results before implementation</li>
              <li>Verifying compliance with local amendments and municipal bylaws</li>
              <li>Maintaining records of all analyses and professional reviews</li>
              <li>Compliance with all applicable laws and regulations</li>
              <li>Any consequences arising from misuse or misinterpretation of results</li>
            </ol>
          </CardContent>
        </Card>

        {/* 6. Acceptable Use */}
        <Card id="acceptable-use">
          <CardHeader>
            <CardTitle>6. Acceptable Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Misrepresent the tool's capabilities or limitations</li>
              <li>Rely on results as a substitute for professional judgment</li>
              <li>Use results for any unlawful purpose</li>
              <li>Attempt to reverse-engineer or modify the tool</li>
              <li>Use the tool to harm others or violate their rights</li>
              <li>Interfere with the tool's operation or security</li>
              <li>Share login credentials or unauthorized access</li>
            </ul>
          </CardContent>
        </Card>

        {/* 7. Audit Trail */}
        <Card id="audit-trail">
          <CardHeader>
            <CardTitle>7. Audit Trail and Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              This tool maintains immutable audit trails of all analyses, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Timestamp of analysis creation (UTC)</li>
              <li>Building code edition and version used</li>
              <li>Complete record of all inputs provided</li>
              <li>Rules that fired and reasoning</li>
              <li>Complete analysis results</li>
              <li>User identity and authentication</li>
              <li>Cryptographic integrity verification</li>
            </ul>
            <p>
              These immutable records are maintained for legal discovery and professional liability defense. Users may request 
              copies of their analysis records for documentation purposes.
            </p>
          </CardContent>
        </Card>

        {/* 8. Modifications */}
        <Card id="modifications">
          <CardHeader>
            <CardTitle>8. Modifications to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to this page. 
              Your continued use of the tool following the posting of revised terms means that you accept and agree to the changes.
            </p>
            <p>
              We recommend reviewing these terms periodically to stay informed of any updates.
            </p>
          </CardContent>
        </Card>

        {/* Acknowledgment */}
        <Card className="bg-primary/5 border-primary">
          <CardHeader>
            <CardTitle>Acknowledgment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              By using the Building Code Occupancy Classifier, you acknowledge that you have read, understood, and agree to be bound 
              by these Terms of Service. If you do not agree to these terms, please do not use this tool.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => navigate(-1)} variant="outline">
                Back
              </Button>
              <Button>Accept Terms</Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Questions?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>If you have questions about these Terms of Service, please contact us at:</p>
            <p className="text-muted-foreground">
              Email: legal@buildingcode.example.com<br/>
              Address: Building Code Compliance, Alberta, Canada
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
