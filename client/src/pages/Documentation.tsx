import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  Workflow,
} from "lucide-react";
import { useLocation } from "wouter";

const workflowSteps = [
  "Create a Project",
  "Fill in the Project Brief (3 inputs)",
  "Upload your site plan",
  "Upload your floor plan",
  "Run the CARL Permit Readiness check",
  "Generate the Permit Package",
];

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 border-b border-border pb-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {number}
        </span>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </div>
      <div className="space-y-4 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

function BulletList({ children }: { children: React.ReactNode }) {
  return <ul className="ml-5 list-disc space-y-1.5">{children}</ul>;
}

export default function Documentation() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" className="gap-2" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/project-checklists")}>
              Start a Project
            </Button>
            <Button onClick={() => navigate("/drawing-analyzer")}>
              Open Drawing Analyzer
            </Button>
          </div>
        </div>

        <header className="mb-8 space-y-3">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              CodeComply — User Guide
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Alberta &amp; BC Building Code Compliance Tool
          </p>
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            Covers NBC 2020 (federal) and NBC(AE) 2023 (Alberta Edition). All compliance values verified against primary source.
          </p>
        </header>

        <div className="space-y-10">
          <Section number={1} title="How to Get the Best Results">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-5">
                <div className="mb-4 flex items-start gap-3">
                  <Workflow className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="font-medium text-foreground">
                    Follow this workflow in order. Each step feeds the next. Skipping steps produces incomplete results.
                  </p>
                </div>
                <ol className="grid gap-2 sm:grid-cols-2">
                  {workflowSteps.map((step, index) => (
                    <li key={step} className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm text-foreground shadow-sm">
                      <span className="font-semibold text-primary">STEP {index + 1}</span>
                      <span aria-hidden="true">→</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </Section>

          <Section number={2} title="Step-by-Step Guide">
            <div>
              <h3 className="text-base font-semibold text-foreground">2.1 Create a Project</h3>
              <p>
                Navigate to the Project Brief card on the home screen, or go to Projects. Give your project a name and address. Your project stores all inputs and results in one place.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-foreground">2.2 Project Brief (Start Here)</h3>
              <p>The Brief is your pre-design compliance snapshot. Enter:</p>
              <BulletList>
                <li>Occupancy Group (what the building is used for)</li>
                <li>Gross Floor Area (m²)</li>
                <li>Number of Storeys</li>
              </BulletList>
              <p className="mt-2">The Brief instantly shows:</p>
              <BulletList>
                <li>Occupant Load (NBC Table 3.1.17.1)</li>
                <li>Required Exits (NBC 3.4.2.2)</li>
                <li>Travel Distance limits (NBC 3.4.2.5)</li>
                <li>Required Exit Width (NBC 3.4.3.2)</li>
                <li>Sprinkler Requirement (NBC 3.2.5)</li>
                <li>Construction Type guidance (NBC 3.2.2)</li>
                <li>Accessibility Triggers (NBC 3.8)</li>
              </BulletList>
              <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-900">
                <strong>Tip — Group C (Residential):</strong> Enter your bedroom count for an accurate occupant load. The Brief uses 2 persons/bedroom per NBC Table 3.1.17.1 Note (2).
              </div>
              <p className="mt-2">Each result links directly to the relevant calculator for detailed analysis.</p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-foreground">2.3 Site Plan Upload</h3>
              <p>In the Drawing Analyzer, select “Site Plan” as the drawing type before uploading. The AI extracts:</p>
              <BulletList>
                <li>Parcel dimensions and area</li>
                <li>Front, rear, and side setbacks</li>
                <li>Building footprint and lot coverage</li>
                <li>Geodetic elevations (main floor, roof peak, footing)</li>
                <li>Parking stalls and surface type</li>
                <li>Rear lane detection</li>
                <li>Municipal address and drawing scale</li>
              </BulletList>
              <p className="mt-2 font-medium text-foreground">
                Important: Always set calibration before analyzing. Use the calibration tool to set a known dimension on the drawing. Accurate calibration means accurate room areas and compliance checks.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-foreground">2.4 Floor Plan Upload</h3>
              <p>In the Drawing Analyzer, select your drawing type—typically “Floor Plan — Residential” for Part 9, or the appropriate occupancy for Part 3.</p>
              <p className="mt-2">For best detection results:</p>
              <BulletList>
                <li>Use clear, high-resolution scans (300 DPI minimum)</li>
                <li>Ensure room labels are legible</li>
                <li>Set calibration using a known wall or dimension before clicking Analyze</li>
              </BulletList>
              <p className="mt-2">
                The analyzer detects rooms, checks compliance rules, and flags issues with room context—for example, “Room 101: Verify corridor width ≥ 1100mm — NBC 3.3.1.9.(1).”
              </p>
              <p className="mt-2">Results show as:</p>
              <BulletList>
                <li><strong className="text-foreground">Compliant</strong> — requirement confirmed met</li>
                <li><strong className="text-foreground">Verify required</strong> — detected but needs professional confirmation on stamped drawings</li>
                <li><strong className="text-foreground">Not assessable from drawing</strong> — provide documentation for professional review</li>
                <li><strong className="text-foreground">Non-compliant</strong> — does not meet minimum requirement</li>
              </BulletList>
            </div>

            <div>
              <h3 className="text-base font-semibold text-foreground">2.5 CARL Permit Readiness</h3>
              <p>After running a drawing analysis, open the “Permit Readiness” tab. The CARL scorer evaluates your project across 13 sections against the Calgary Application Requirements List.</p>
              <p className="mt-2">Score interpretation:</p>
              <BulletList>
                <li>80%+ with no blocking failures → Ready to submit</li>
                <li>Blocking failures present → Must resolve before submitting; items are shown in red</li>
                <li>Advisory items → Need professional verification</li>
                <li>Not evaluated → Missing data; see the recommendation</li>
              </BulletList>
              <p className="mt-2">The permit package PDF is disabled until blocking failures are resolved.</p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-foreground">2.6 Permit Package</h3>
              <p>Once your CARL score is acceptable, generate the Permit Package from the project view. The package compiles your project inputs, calculation results, and compliance summary into a structured PDF.</p>
              <p className="mt-2 font-medium text-foreground">
                Important: The permit package is a compliance assistance tool, not a professionally stamped document. All outputs must be reviewed and verified by a licensed professional before submission.
              </p>
            </div>
          </Section>

          <Section number={3} title="Calculators">
            <p>Access calculators from the Calculations tab within any project, or via the links in your Project Brief.</p>
            <BulletList>
              <li>Occupant Load — NBC Table 3.1.17.1</li>
              <li>Fire Exit — exit count and width requirements</li>
              <li>Travel Distance — NBC 3.4.2.5 per occupancy group</li>
              <li>Construction Type — 72-article NBC 3.2.2 scenario engine</li>
              <li>Barrier-Free — NBC 3.8 accessibility requirements</li>
              <li>Washroom Fixtures — NBC 3.7.2.2 (male/female split)</li>
              <li>Span Tables — Part 9 residential structural members</li>
            </BulletList>
          </Section>

          <Section number={4} title="Jurisdiction Coverage">
            <BulletList>
              <li><strong className="text-foreground">Federal (NBC 2020):</strong> All Part 3 occupancy groups</li>
              <li>
                <strong className="text-foreground">Alberta (NBC(AE) 2023):</strong> Three confirmed overrides
                <BulletList>
                  <li>Secondary suite ceiling height: 1.95m (vs 2.10m)</li>
                  <li>Secondary suite beam clearance: 1.85m (vs 2.00m)</li>
                  <li>Secondary suite door height: 1890mm (vs 1980mm)</li>
                </BulletList>
              </li>
              <li><strong className="text-foreground">BC (BCBC 2024):</strong> Referenced but verify locally</li>
            </BulletList>
          </Section>

          <Section number={5} title="What the App Does Not Do">
            <p>Be clear with your clients and authority having jurisdiction about these limitations:</p>
            <BulletList>
              <li>Results are AI-assisted, not engineer-stamped</li>
              <li>Drawing detection accuracy depends on scan quality and calibration—always verify on stamped drawings</li>
              <li>Fire Resistance Rating calculator is temporarily unavailable (rebuild in progress)</li>
              <li>Structural design, including beam sizing and load paths, is out of scope</li>
              <li>Zoning and land use compliance is not covered</li>
              <li>Site-specific soil, drainage, and grading requirements require a site engineer</li>
            </BulletList>
          </Section>

          <Section number={6} title="Professional Disclaimer">
            <Card className="border-amber-300 bg-amber-50">
              <CardContent className="flex gap-3 p-5 text-amber-900">
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
                <p>
                  CodeComply is a compliance assistance tool for use by qualified professionals and informed permit applicants. All results must be independently verified by a licensed architect, engineer, or safety codes officer before permit submission. Compliance with the National Building Code and applicable provincial amendments is the responsibility of the permit applicant.
                </p>
              </CardContent>
            </Card>
          </Section>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Follow the workflow in order for the most complete result.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/project-checklists")}>
              <FileText className="mr-2 h-4 w-4" /> Start a Project
            </Button>
            <Button onClick={() => navigate("/drawing-analyzer")}>Open Drawing Analyzer</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
