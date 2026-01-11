import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Save, FolderOpen } from "lucide-react";
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
}

export function CalculatorActions({
  calculatorId,
  calculatorName,
  exportData,
  currentState,
  onLoadPreset,
  hasResults = false,
}: CalculatorActionsProps) {
  const { presets, savePreset, loadPreset, deletePreset } = useCalculatorPreset(calculatorId);
  const [presetName, setPresetName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

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

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Save Preset */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save Preset</span>
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
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Load Preset</span>
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
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export Excel</span>
        </Button>
      )}
    </div>
  );
}
