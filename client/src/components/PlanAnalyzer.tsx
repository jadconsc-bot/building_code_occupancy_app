import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileImage, AlertTriangle, CheckCircle2, Loader2, X, ZoomIn, ZoomOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";

interface Infraction {
  id: string;
  severity: "critical" | "warning" | "info";
  code: string;
  title: string;
  description: string;
  location: string;
  recommendation: string;
  x?: number;
  y?: number;
}

export function PlanAnalyzer() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [infractions, setInfractions] = useState<Infraction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedInfraction, setSelectedInfraction] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const analyzePlan = trpc.analyzePlan.useMutation({
    onSuccess: (data) => {
      setInfractions(data.infractions);
      setIsAnalyzing(false);
    },
    onError: (error) => {
      console.error("Analysis failed:", error);
      setIsAnalyzing(false);
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setInfractions([]);
      setSelectedInfraction(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setInfractions([]);
      setSelectedInfraction(null);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    
    setIsAnalyzing(true);
    
    // Convert file to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      analyzePlan.mutate({
        imageData: base64,
        fileName: uploadedFile.name,
        occupancyType: "C", // Default to residential, can be made dynamic
      });
    };
    reader.readAsDataURL(uploadedFile);
  };

  const handleClear = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setInfractions([]);
    setSelectedInfraction(null);
    setZoom(1);
  };

  const getSeverityColor = (severity: Infraction["severity"]) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "secondary";
    }
  };

  const getSeverityIcon = (severity: Infraction["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      case "info":
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            Architectural Plan Analyzer
          </CardTitle>
          <CardDescription>
            Upload floor plans, elevations, or site plans to automatically detect NBC 2025 code infractions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          {!uploadedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
            >
              <input
                type="file"
                id="plan-upload"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="plan-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Drop your architectural plan here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse (PDF, JPG, PNG)
                </p>
                <Button type="button" variant="outline">
                  Select File
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileImage className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isAnalyzing && infractions.length === 0 && (
                    <Button onClick={handleAnalyze}>
                      Analyze Plan
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={handleClear}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Analysis Progress */}
              {isAnalyzing && (
                <Alert>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <AlertTitle>Analyzing Plan...</AlertTitle>
                  <AlertDescription>
                    AI is examining your architectural plan for NBC 2025 compliance issues. This may take 30-60 seconds.
                  </AlertDescription>
                </Alert>
              )}

              {/* Results */}
              {infractions.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Plan Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Plan Preview</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                        >
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground w-16 text-center">
                          {(zoom * 100).toFixed(0)}%
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="border rounded-lg overflow-auto max-h-[600px] bg-muted/30">
                      <div className="relative inline-block min-w-full">
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt="Architectural plan"
                            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
                            className="w-full"
                          />
                        )}
                        {/* Infraction Markers */}
                        {infractions.map((infraction) =>
                          infraction.x && infraction.y ? (
                            <div
                              key={infraction.id}
                              className={`absolute w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                                selectedInfraction === infraction.id
                                  ? "bg-primary border-primary scale-125 z-10"
                                  : infraction.severity === "critical"
                                  ? "bg-destructive/20 border-destructive hover:scale-110"
                                  : "bg-yellow-500/20 border-yellow-500 hover:scale-110"
                              }`}
                              style={{
                                left: `${infraction.x * zoom}%`,
                                top: `${infraction.y * zoom}%`,
                                transform: "translate(-50%, -50%)",
                              }}
                              onClick={() => setSelectedInfraction(infraction.id)}
                            >
                              <span className="text-xs font-bold">!</span>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Infractions List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        Code Infractions ({infractions.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">
                          {infractions.filter((i) => i.severity === "critical").length} Critical
                        </Badge>
                        <Badge variant="default">
                          {infractions.filter((i) => i.severity === "warning").length} Warnings
                        </Badge>
                      </div>
                    </div>
                    <ScrollArea className="h-[600px] border rounded-lg">
                      <div className="p-4 space-y-3">
                        {infractions.map((infraction) => (
                          <Card
                            key={infraction.id}
                            className={`cursor-pointer transition-all ${
                              selectedInfraction === infraction.id
                                ? "ring-2 ring-primary"
                                : ""
                            }`}
                            onClick={() => setSelectedInfraction(infraction.id)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2">
                                  {getSeverityIcon(infraction.severity)}
                                  <div>
                                    <CardTitle className="text-sm">
                                      {infraction.title}
                                    </CardTitle>
                                    <Badge
                                      variant={getSeverityColor(infraction.severity)}
                                      className="mt-1"
                                    >
                                      {infraction.code}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              <div>
                                <p className="font-medium text-muted-foreground">Issue:</p>
                                <p>{infraction.description}</p>
                              </div>
                              <div>
                                <p className="font-medium text-muted-foreground">Location:</p>
                                <p>{infraction.location}</p>
                              </div>
                              <div>
                                <p className="font-medium text-muted-foreground">
                                  Recommendation:
                                </p>
                                <p className="text-primary">{infraction.recommendation}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {infractions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {infractions.filter((i) => i.severity === "critical").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Must be resolved before permit approval
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {infractions.filter((i) => i.severity === "warning").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Should be addressed for compliance
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {Math.max(
                  0,
                  100 -
                    infractions.filter((i) => i.severity === "critical").length * 10 -
                    infractions.filter((i) => i.severity === "warning").length * 5
                )}
                %
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on detected issues
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
