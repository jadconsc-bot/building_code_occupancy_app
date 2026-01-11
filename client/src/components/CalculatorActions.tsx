import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Save, FolderOpen, FileText } from "lucide-react";
import { exportToExcel } from "@/lib/excelExport";
import { useCalculatorPreset } from "@/hooks/useCalculatorPreset";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CalculatorActionsProps {
  calculatorId: string;
  calculatorName: string;
  exportData: () => { filename: string; sheetName: string; data: any[][] };
  currentState: any;
  onLoadPreset: (data: any) => void;
  hasResults?: boolean;
  pdfData?: () => {
    nbcReference: string;
    inputs: Array<{ label: string; value: string; unit?: string }>;
    results: Array<{ label: string; value: string; unit?: string; status?: 'pass' | 'fail' | 'warning' }>;
    notes?: string[];
    codeRequirements?: string[];
  };
}

export function CalculatorActions({
  calculatorId,
  calculatorName,
  exportData,
  currentState,
  onLoadPreset,
  hasResults = false,
  pdfData,
}: CalculatorActionsProps) {
  const { presets, savePreset, loadPreset, deletePreset } = useCalculatorPreset(calculatorId);
  const [presetName, setPresetName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [projectDetails, setProjectDetails] = useState({
    projectName: "",
    projectAddress: "",
    projectNumber: "",
    preparedBy: "",
    preparedFor: "",
    engineerName: "",
    engineerLicense: "",
    companyName: "",
  });

  const handleSavePreset = () => {
    if (presetName.trim()) {
      savePreset(presetName, currentState);
      setPresetName("");
      setShowSaveDialog(false);
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const data = loadPreset(presetId);
    if (data) {
      onLoadPreset(data);
      setShowLoadDialog(false);
    }
  };

  const handleExport = () => {
    const data = exportData();
    exportToExcel(data);
  };

  const handleGeneratePDF = async () => {
    if (!pdfData) return;
    
    const { generateCalculatorPDF } = await import('@/lib/pdfReportGenerator');
    
    const calculatorData = {
      calculatorName,
      ...pdfData(),
    };

    const projectInfo = {
      ...projectDetails,
      date: new Date().toLocaleDateString(),
    };

    generateCalculatorPDF(projectInfo, calculatorData);
    setShowPdfDialog(false);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Save Preset */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <Save className="w-4 h-4" />
            <span>Save Preset</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Calculator Preset</DialogTitle>
            <DialogDescription>
              Save your current {calculatorName} settings for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., Standard Residential Stair"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Preset */}
      {presets.length > 0 && (
        <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <FolderOpen className="w-4 h-4" />
              <span>Load Preset</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Load Calculator Preset</DialogTitle>
              <DialogDescription>
                Choose a saved preset to load into the calculator.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-3 border border-border rounded hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(preset.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleLoadPreset(preset.id)}
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePreset(preset.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Export to Excel */}
      {hasResults && (
        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel</span>
        </Button>
      )}

      {/* Generate PDF Report */}
      {hasResults && pdfData && (
        <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <FileText className="w-4 h-4" />
              <span>PDF Report</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate PDF Report</DialogTitle>
              <DialogDescription>
                Enter project details to generate a professional calculation report.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name *</Label>
                  <Input
                    id="project-name"
                    placeholder="e.g., Smith Residence"
                    value={projectDetails.projectName}
                    onChange={(e) => setProjectDetails({ ...projectDetails, projectName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-number">Project Number</Label>
                  <Input
                    id="project-number"
                    placeholder="e.g., 2024-001"
                    value={projectDetails.projectNumber}
                    onChange={(e) => setProjectDetails({ ...projectDetails, projectNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-address">Project Address *</Label>
                <Input
                  id="project-address"
                  placeholder="e.g., 123 Main St, Calgary, AB"
                  value={projectDetails.projectAddress}
                  onChange={(e) => setProjectDetails({ ...projectDetails, projectAddress: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prepared-by">Prepared By *</Label>
                  <Input
                    id="prepared-by"
                    placeholder="Your name"
                    value={projectDetails.preparedBy}
                    onChange={(e) => setProjectDetails({ ...projectDetails, preparedBy: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prepared-for">Prepared For</Label>
                  <Input
                    id="prepared-for"
                    placeholder="Client name"
                    value={projectDetails.preparedFor}
                    onChange={(e) => setProjectDetails({ ...projectDetails, preparedFor: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="engineer-name">Engineer Name</Label>
                  <Input
                    id="engineer-name"
                    placeholder="P.Eng name"
                    value={projectDetails.engineerName}
                    onChange={(e) => setProjectDetails({ ...projectDetails, engineerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engineer-license">License Number</Label>
                  <Input
                    id="engineer-license"
                    placeholder="e.g., P.Eng 12345"
                    value={projectDetails.engineerLicense}
                    onChange={(e) => setProjectDetails({ ...projectDetails, engineerLicense: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="Your company"
                  value={projectDetails.companyName}
                  onChange={(e) => setProjectDetails({ ...projectDetails, companyName: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPdfDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleGeneratePDF}
                disabled={!projectDetails.projectName || !projectDetails.projectAddress || !projectDetails.preparedBy}
              >
                Generate PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
