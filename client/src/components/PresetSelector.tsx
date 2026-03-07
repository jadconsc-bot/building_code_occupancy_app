import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalculatorPreset,
  getAllPresets,
  getPresetsByType,
  savePreset,
  deletePreset,
} from "@/lib/calculatorPresets";
import { Save, FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PresetSelectorProps {
  calculatorType: CalculatorPreset["calculatorType"];
  currentParameters: Record<string, string | number>;
  onLoadPreset: (parameters: Record<string, string | number>) => void;
}

export function PresetSelector({
  calculatorType,
  currentParameters,
  onLoadPreset,
}: PresetSelectorProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetCategory, setPresetCategory] = useState<CalculatorPreset["category"]>("Custom");


  const presets = getPresetsByType(calculatorType);

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }

    try {
      savePreset({
        name: presetName,
        category: presetCategory,
        calculatorType,
        parameters: currentParameters,
      });

      toast.success(`Preset "${presetName}" saved successfully`);

      setPresetName("");
      setSaveDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save preset");
    }
  };

  const handleLoadPreset = (preset: CalculatorPreset) => {
    onLoadPreset(preset.parameters);
    toast.success(`Loaded "${preset.name}"`);
    setLoadDialogOpen(false);
  };

  const handleDeletePreset = (id: string, name: string) => {
    try {
      deletePreset(id);
      toast.success(`Deleted "${name}"`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete preset");
    }
  };

  const getCategoryColor = (category: CalculatorPreset["category"]) => {
    switch (category) {
      case "Residential":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Commercial":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Industrial":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Custom":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Save Preset Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Preset
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Calculator Preset</DialogTitle>
            <DialogDescription>
              Save your current calculator settings for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., My Custom Floor Joist"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="preset-category">Category</Label>
              <Select
                value={presetCategory}
                onValueChange={(v) => setPresetCategory(v as CalculatorPreset["category"])}
              >
                <SelectTrigger id="preset-category" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>Save Preset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Preset Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Load Preset
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Calculator Preset</DialogTitle>
            <DialogDescription>
              Select a saved preset to quickly configure your calculator.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {presets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No presets saved yet. Save your first preset to get started!
              </p>
            ) : (
              <div className="space-y-2">
                {presets.map((preset) => {
                  const isDefault = preset.id.startsWith("preset-") && parseInt(preset.id.split("-")[1]) < 100;
                  return (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between p-3 border border-border rounded-none hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold">{preset.name}</h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(
                              preset.category
                            )}`}
                          >
                            {preset.category}
                          </span>
                          {preset.occupancyType && (
                            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {preset.occupancyType}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {Object.entries(preset.parameters)
                            .slice(0, 3)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(" • ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleLoadPreset(preset)}
                        >
                          Load
                        </Button>
                        {!isDefault && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePreset(preset.id, preset.name)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
