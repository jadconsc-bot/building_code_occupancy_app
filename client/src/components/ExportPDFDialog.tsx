import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Mail, Share2, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { OccupancyGroup } from '@/lib/occupancyData';
import { generatePDFChecklist, generateBatchPDFChecklists, ChecklistSection } from '@/lib/pdfChecklistGenerator';

interface ExportPDFDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedGroup: OccupancyGroup | null;
  allGroups: OccupancyGroup[];
  bookmarkedIds: string[];
  activeTab: string;
  getSectionsForGroup: (group: OccupancyGroup, tab: string) => ChecklistSection[];
}

export function ExportPDFDialog({
  open,
  onOpenChange,
  selectedGroup,
  allGroups,
  bookmarkedIds,
  activeTab,
  getSectionsForGroup,
}: ExportPDFDialogProps) {
  const [projectName, setProjectName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [exportMode, setExportMode] = useState<'single' | 'batch' | 'bookmarks'>('single');
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportMode === 'single' && selectedGroup) {
        const sections = getSectionsForGroup(selectedGroup, activeTab);
        await generatePDFChecklist({
          occupancyCode: selectedGroup.code,
          occupancyName: selectedGroup.name,
          projectName: projectName || 'Unnamed Project',
          projectAddress,
          inspectorName,
          sections,
          includeQRCode: true,
        });
        toast.success('PDF exported successfully!');
      } else if (exportMode === 'batch' && selectedForBatch.length > 0) {
        const checklistsOptions = selectedForBatch.map(id => {
          const group = allGroups.find(g => g.id === id);
          if (!group) return null;
          return {
            occupancyCode: group.code,
            occupancyName: group.name,
            projectName: projectName || 'Unnamed Project',
            projectAddress,
            inspectorName,
            sections: getSectionsForGroup(group, activeTab),
            includeQRCode: true,
          };
        }).filter(Boolean) as Parameters<typeof generateBatchPDFChecklists>[0];

        await generateBatchPDFChecklists(checklistsOptions);
        toast.success(`Batch PDF with ${selectedForBatch.length} checklists exported!`);
      } else if (exportMode === 'bookmarks' && bookmarkedIds.length > 0) {
        const checklistsOptions = bookmarkedIds.map(id => {
          const group = allGroups.find(g => g.id === id);
          if (!group) return null;
          return {
            occupancyCode: group.code,
            occupancyName: group.name,
            projectName: projectName || 'Unnamed Project',
            projectAddress,
            inspectorName,
            sections: getSectionsForGroup(group, activeTab),
            includeQRCode: true,
          };
        }).filter(Boolean) as Parameters<typeof generateBatchPDFChecklists>[0];

        await generateBatchPDFChecklists(checklistsOptions);
        toast.success(`Bookmarked checklists (${bookmarkedIds.length}) exported!`);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!selectedGroup) return;

    const shareData = {
      title: `Building Code Checklist - ${selectedGroup.code}`,
      text: `Building Code Inspection Checklist for ${selectedGroup.code} - ${selectedGroup.name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        );
        toast.success('Link copied to clipboard!');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  const handleEmailShare = () => {
    if (!selectedGroup) return;

    const subject = encodeURIComponent(`Building Code Checklist - ${selectedGroup.code}`);
    const body = encodeURIComponent(
      `Building Code Inspection Checklist\n\n` +
      `Occupancy: ${selectedGroup.code} - ${selectedGroup.name}\n` +
      `Project: ${projectName || 'Not specified'}\n` +
      `Address: ${projectAddress || 'Not specified'}\n\n` +
      `View online: ${window.location.href}\n\n` +
      `Based on National Building Code - 2023 Alberta Edition`
    );

    window.open(`mailto:?subject=${subject}&body=${body}`);
    toast.info('Email client opened');
  };

  const toggleBatchSelection = (id: string) => {
    setSelectedForBatch(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllForBatch = () => {
    setSelectedForBatch(allGroups.map(g => g.id));
  };

  const clearBatchSelection = () => {
    setSelectedForBatch([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Export PDF Checklist
          </DialogTitle>
          <DialogDescription>
            Configure your export options and project details
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Project Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Project Information
            </h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="Enter project name..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="projectAddress">Project Address</Label>
                <Input
                  id="projectAddress"
                  placeholder="Enter project address..."
                  value={projectAddress}
                  onChange={(e) => setProjectAddress(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inspectorName">Inspector Name</Label>
                <Input
                  id="inspectorName"
                  placeholder="Enter inspector name..."
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Export Mode */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Export Mode
            </h3>
            <div className="grid gap-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="exportMode"
                  value="single"
                  checked={exportMode === 'single'}
                  onChange={() => setExportMode('single')}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium">Single Checklist</p>
                  <p className="text-sm text-muted-foreground">
                    Export checklist for {selectedGroup?.code || 'selected occupancy'}
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="exportMode"
                  value="bookmarks"
                  checked={exportMode === 'bookmarks'}
                  onChange={() => setExportMode('bookmarks')}
                  className="w-4 h-4"
                  disabled={bookmarkedIds.length === 0}
                />
                <div className="flex-1">
                  <p className="font-medium">Bookmarked Checklists</p>
                  <p className="text-sm text-muted-foreground">
                    Export all {bookmarkedIds.length} bookmarked occupancies
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="exportMode"
                  value="batch"
                  checked={exportMode === 'batch'}
                  onChange={() => setExportMode('batch')}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium">Batch Export</p>
                  <p className="text-sm text-muted-foreground">
                    Select multiple occupancies to export
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Batch Selection */}
          {exportMode === 'batch' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Select Occupancies ({selectedForBatch.length} selected)
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllForBatch}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearBatchSelection}>
                    Clear
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-48 border rounded-lg p-2">
                <div className="grid gap-2">
                  {allGroups.map((group) => (
                    <label
                      key={group.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedForBatch.includes(group.id)}
                        onCheckedChange={() => toggleBatchSelection(group.id)}
                      />
                      <span className="font-mono text-sm font-medium text-primary">
                        {group.code}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
                        {group.name}
                      </span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Share Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Share Options
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleShare} className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share Link
              </Button>
              <Button variant="outline" onClick={handleEmailShare} className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={
              isExporting ||
              (exportMode === 'single' && !selectedGroup) ||
              (exportMode === 'batch' && selectedForBatch.length === 0) ||
              (exportMode === 'bookmarks' && bookmarkedIds.length === 0)
            }
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
