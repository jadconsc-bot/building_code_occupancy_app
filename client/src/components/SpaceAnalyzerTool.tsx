import { useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Building, Upload, Loader2, LayoutGrid, Sun, Wind, Leaf, Award } from "lucide-react";
import { toast } from "sonner";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export function SpaceAnalyzerTool() {
  const [spaceAnalysisImage, setSpaceAnalysisImage] = useState<string | null>(null);
  const [spaceAnalysisImageMime, setSpaceAnalysisImageMime] = useState<string>("image/jpeg");
  const [spaceAnalysisResult, setSpaceAnalysisResult] = useState<any>(null);
  const [spaceAnalysisLoading, setSpaceAnalysisLoading] = useState(false);
  const spaceAnalysisFileRef = useRef<HTMLInputElement>(null);
  const [spacePdfPages, setSpacePdfPages] = useState<string[]>([]);
  const [spaceSelectedPage, setSpaceSelectedPage] = useState<number>(0);
  const analyzeSpaceMutation = trpc.analyzeSpace.useMutation();

  const runSpaceAnalysis = async () => {
    if (!spaceAnalysisImage) { toast.error("Please upload a floor plan or drawing first."); return; }
    setSpaceAnalysisLoading(true); setSpaceAnalysisResult(null);
    try {
      const result = await analyzeSpaceMutation.mutateAsync({ imageBase64: spaceAnalysisImage, mimeType: spaceAnalysisImageMime, climateZone: undefined });
      if (result.success && result.result) setSpaceAnalysisResult(result.result);
      else toast.error("Analysis returned no data. Please try again.");
    } catch (err) { toast.error("Analysis failed: " + (err instanceof Error ? err.message : "Unknown error")); }
    finally { setSpaceAnalysisLoading(false); }
  };

  return (
<section className="mt-8 pt-8 border-t border-border">
  {/* Architectural Space Analyzer */}
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <Building className="w-5 h-5 text-primary" />
      <h3 className="text-lg font-semibold">Architectural Space Analyzer</h3>
    </div>
    <p className="text-sm text-muted-foreground">
      Upload a floor plan to receive AI-powered recommendations for space efficiency,
      natural light, ventilation, sustainable materials, and LEED gap analysis.
    </p>

    {/* Upload Area */}
    <div
      className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
      onClick={() => spaceAnalysisFileRef.current?.click()}
    >
      {spaceAnalysisImage ? (
        <div className="space-y-2">
          <img
            src={`data:${spaceAnalysisImageMime};base64,${spaceAnalysisImage}`}
            alt="Uploaded plan"
            className="max-h-48 mx-auto rounded object-contain"
          />
          <p className="text-xs text-muted-foreground">Click to replace</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium">Drop your floor plan here</p>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG supported</p>
        </div>
      )}
    </div>
    <input
      ref={spaceAnalysisFileRef}
      type="file"
      accept="image/*,.pdf"
      className="hidden"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const pageCount = Math.min(pdf.numPages, 20);
          const pages: string[] = [];
          for (let i = 1; i <= pageCount; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d')!;
            await page.render({ canvasContext: ctx, viewport } as any).promise;
            pages.push(canvas.toDataURL('image/png'));
          }
          setSpacePdfPages(pages);
          setSpaceSelectedPage(0);
          const base64 = pages[0].split(',')[1];
          setSpaceAnalysisImage(base64);
          setSpaceAnalysisImageMime('image/png');
        } else {
          setSpacePdfPages([]);
          setSpaceSelectedPage(0);
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            const base64 = result.split(',')[1];
            setSpaceAnalysisImage(base64);
            setSpaceAnalysisImageMime(file.type || 'image/jpeg');
          };
          reader.readAsDataURL(file);
        }
      }}
    />

    {spacePdfPages.length > 1 && (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">SELECT PAGE TO ANALYZE</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {spacePdfPages.map((page, idx) => (
            <div
              key={idx}
              onClick={() => {
                setSpaceSelectedPage(idx);
                setSpaceAnalysisImage(page.split(',')[1]);
                setSpaceAnalysisImageMime('image/png');
              }}
              className={`flex-shrink-0 cursor-pointer rounded border-2 transition-all ${
                spaceSelectedPage === idx
                  ? 'border-primary shadow-md'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <img
                src={page}
                alt={`Page ${idx + 1}`}
                className="h-24 w-auto rounded object-contain"
              />
              <p className="text-xs text-center text-muted-foreground py-1">
                Page {idx + 1}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}

    <Button
      onClick={runSpaceAnalysis}
      disabled={!spaceAnalysisImage || spaceAnalysisLoading}
      className="w-full"
    >
      {spaceAnalysisLoading ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
      ) : (
        <><Building className="w-4 h-4 mr-2" /> Analyze Space</>
      )}
    </Button>

    {/* Results */}
    {spaceAnalysisResult && (
      <div className="space-y-6 mt-4">

        {/* Overall Score */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-lg">Overall Design Score</span>
            <span className="text-2xl font-bold text-primary">{spaceAnalysisResult.overallScore}/100</span>
          </div>
          <Progress value={spaceAnalysisResult.overallScore} className="h-2" />
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>Drawing: {spaceAnalysisResult.drawingType}</span>
            <span>Climate Zone: {spaceAnalysisResult.climateZone}</span>
          </div>
        </div>

        {/* Six Dimension Cards */}
        {[
          { key: 'spaceDistribution', label: 'Space Distribution', icon: LayoutGrid },
          { key: 'naturalLight', label: 'Natural Light', icon: Sun },
          { key: 'roomLayout', label: 'Room Layout', icon: Building },
          { key: 'ventilation', label: 'Wind & Ventilation', icon: Wind },
          { key: 'sustainableMaterials', label: 'Sustainable Materials', icon: Leaf },
        ].map(({ key, label, icon: Icon }) => {
          const section = spaceAnalysisResult[key];
          if (!section) return null;
          return (
            <div key={key} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={section.score} className="w-24 h-1.5" />
                  <span className="text-sm font-semibold">{section.score}/100</span>
                </div>
              </div>
              {section.findings?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">FINDINGS</p>
                  <ul className="space-y-1">
                    {section.findings.map((f: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {section.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">RECOMMENDATIONS</p>
                  <ul className="space-y-1">
                    {section.recommendations.map((r: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-green-500 mt-0.5">→</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}

        {/* LEED Gap Analysis */}
        {spaceAnalysisResult.leedGapAnalysis && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">LEED Gap Analysis</span>
              </div>
              <Badge variant="outline" className="border-green-400 text-green-700">
                ~{spaceAnalysisResult.leedGapAnalysis.estimatedPoints} / {spaceAnalysisResult.leedGapAnalysis.maxPossiblePoints} pts
              </Badge>
            </div>
            <div className="space-y-3">
              {spaceAnalysisResult.leedGapAnalysis.categories?.map((cat: any, i: number) => (
                <div key={i} className="bg-white rounded p-3 space-y-1 border border-green-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{cat.category}</span>
                    <Badge className="bg-green-100 text-green-700 text-xs">{cat.estimatedPoints} pts</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground"><span className="font-medium">Status:</span> {cat.status}</p>
                  <p className="text-xs text-amber-700"><span className="font-medium">Gap:</span> {cat.gap}</p>
                  <p className="text-xs text-green-700"><span className="font-medium">Action:</span> {cat.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority Actions */}
        {spaceAnalysisResult.priorityActions?.length > 0 && (
          <div className="border border-border rounded-lg p-4 space-y-2">
            <p className="font-medium text-sm">Priority Actions</p>
            <ol className="space-y-2">
              {spaceAnalysisResult.priorityActions.map((action: string, i: number) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">{i + 1}</span>
                  <span>{action}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

      </div>
    )}
  </div>
</section>
  );
}
