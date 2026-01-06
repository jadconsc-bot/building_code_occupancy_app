import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getChecklistForOccupancy, getChecklistForPhase, getCriticalItems, ConstructionPhase, ChecklistItem } from '@/lib/inspectorChecklistData';
import { ClipboardList, Printer, Download, AlertCircle, Camera, X } from 'lucide-react';

interface InspectorChecklistGeneratorProps {
  occupancyCode: string;
  occupancyName: string;
  projectId?: string;
  onProgressUpdate?: (phase: ConstructionPhase, completed: number, total: number) => void;
}

export function InspectorChecklistGeneratorEnhanced({ 
  occupancyCode, 
  occupancyName,
  projectId,
  onProgressUpdate 
}: InspectorChecklistGeneratorProps) {
  const [selectedPhase, setSelectedPhase] = useState<ConstructionPhase>('Foundation');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [itemPhotos, setItemPhotos] = useState<Record<string, string[]>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const storageKey = projectId ? `checklist-${projectId}` : `checklist-${occupancyCode}`;

  // Load saved state from localStorage
  useEffect(() => {
    const savedChecked = localStorage.getItem(`${storageKey}-checked`);
    const savedPhotos = localStorage.getItem(`${storageKey}-photos`);
    
    if (savedChecked) {
      setCheckedItems(new Set(JSON.parse(savedChecked)));
    }
    if (savedPhotos) {
      setItemPhotos(JSON.parse(savedPhotos));
    }
  }, [storageKey]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(`${storageKey}-checked`, JSON.stringify(Array.from(checkedItems)));
  }, [checkedItems, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}-photos`, JSON.stringify(itemPhotos));
  }, [itemPhotos, storageKey]);

  const allChecklists = getChecklistForOccupancy(occupancyCode);
  const currentPhaseItems = getChecklistForPhase(occupancyCode, selectedPhase);
  const criticalItems = getCriticalItems(occupancyCode);

  const handleCheckItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);

    // Notify parent of progress update
    if (onProgressUpdate) {
      const completed = currentPhaseItems.filter(item => newChecked.has(item.id)).length;
      onProgressUpdate(selectedPhase, completed, currentPhaseItems.length);
    }
  };

  const handlePhotoUpload = async (itemId: string, file: File) => {
    setUploadingPhoto(itemId);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setItemPhotos(prev => ({
          ...prev,
          [itemId]: [...(prev[itemId] || []), base64String]
        }));
        setUploadingPhoto(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setUploadingPhoto(null);
    }
  };

  const handleRemovePhoto = (itemId: string, photoIndex: number) => {
    setItemPhotos(prev => ({
      ...prev,
      [itemId]: prev[itemId].filter((_, index) => index !== photoIndex)
    }));
  };

  const handlePhaseChange = (phase: ConstructionPhase) => {
    setSelectedPhase(phase);
    
    // Notify parent of progress for new phase
    if (onProgressUpdate) {
      const phaseItems = getChecklistForPhase(occupancyCode, phase);
      const completed = phaseItems.filter(item => checkedItems.has(item.id)).length;
      onProgressUpdate(phase, completed, phaseItems.length);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const completionPercentage = currentPhaseItems.length > 0
    ? Math.round((currentPhaseItems.filter(item => checkedItems.has(item.id)).length / currentPhaseItems.length) * 100)
    : 0;

  const criticalItemsCount = currentPhaseItems.filter(item => item.critical).length;
  const criticalItemsChecked = currentPhaseItems.filter(item => item.critical && checkedItems.has(item.id)).length;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex-1 w-full sm:w-auto">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
            Construction Phase
          </label>
          <Select value={selectedPhase} onValueChange={(value) => handlePhaseChange(value as ConstructionPhase)}>
            <SelectTrigger className="w-full sm:w-[250px] rounded-none border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Foundation">Foundation</SelectItem>
              <SelectItem value="Framing">Framing</SelectItem>
              <SelectItem value="Mechanical">Mechanical</SelectItem>
              <SelectItem value="Insulation & Vapour Barrier">Insulation & Vapour Barrier</SelectItem>
              <SelectItem value="Drywall">Drywall</SelectItem>
              <SelectItem value="Final">Final</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="rounded-none border-border"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="default"
            size="sm"
            className="rounded-none"
          >
            <Download className="w-4 h-4 mr-2" />
            Save PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <Card className="rounded-none border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Completion</p>
                <p className="text-2xl font-bold">{completionPercentage}%</p>
              </div>
              <div className="text-4xl font-bold text-primary opacity-20">{completionPercentage}%</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Items</p>
                <p className="text-2xl font-bold">{currentPhaseItems.length}</p>
              </div>
              <ClipboardList className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical Items</p>
                <p className="text-2xl font-bold text-destructive">
                  {criticalItemsChecked}/{criticalItemsCount}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Printable Checklist */}
      <div ref={printRef} className="print:p-8">
        {/* Print Header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-2xl font-bold mb-2">Building Code Inspector Checklist</h1>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Occupancy:</strong> {occupancyCode} - {occupancyName}</p>
              <p><strong>Phase:</strong> {selectedPhase}</p>
            </div>
            <div>
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Inspector:</strong> _______________________</p>
            </div>
          </div>
          <hr className="my-4 border-gray-300" />
        </div>

        {/* Checklist Items */}
        <Card className="rounded-none border-border print:border-0 print:shadow-none">
          <CardHeader className="print:hidden">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              {selectedPhase} Phase Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentPhaseItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 border rounded ${
                  item.critical ? 'border-destructive/30 bg-destructive/5' : 'border-border'
                } print:border-gray-300 print:bg-white`}
              >
                <div className="pt-1 print:pt-0">
                  <Checkbox
                    checked={checkedItems.has(item.id)}
                    onCheckedChange={() => handleCheckItem(item.id)}
                    className="print:appearance-none print:w-4 print:h-4 print:border print:border-gray-400"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="text-sm font-medium flex-1">{item.description}</p>
                    {item.critical && (
                      <Badge variant="destructive" className="text-[10px] print:bg-red-100 print:text-red-800">
                        CRITICAL
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono print:text-gray-600">
                    NBC/ABC {item.codeReference}
                  </p>
                  
                  {/* Photo Upload Section */}
                  <div className="mt-2 space-y-2 print:hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Camera Capture Button (Mobile) */}
                      <label htmlFor={`photo-camera-${item.id}`} className="cursor-pointer">
                        <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs border border-border rounded hover:bg-accent transition-colors">
                          <Camera className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{uploadingPhoto === item.id ? 'Uploading...' : 'Take Photo'}</span>
                          <span className="sm:hidden">{uploadingPhoto === item.id ? 'Uploading...' : 'Camera'}</span>
                        </div>
                      </label>
                      <Input
                        id={`photo-camera-${item.id}`}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(item.id, file);
                        }}
                        disabled={uploadingPhoto === item.id}
                      />
                      
                      {/* Photo Library Button */}
                      <label htmlFor={`photo-library-${item.id}`} className="cursor-pointer">
                        <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs border border-border rounded hover:bg-accent transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="hidden sm:inline">Choose Photo</span>
                          <span className="sm:hidden">Library</span>
                        </div>
                      </label>
                      <Input
                        id={`photo-library-${item.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(item.id, file);
                        }}
                        disabled={uploadingPhoto === item.id}
                      />
                      
                      {itemPhotos[item.id]?.length > 0 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          {itemPhotos[item.id].length} photo{itemPhotos[item.id].length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    {/* Photo Thumbnails */}
                    {itemPhotos[item.id]?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {itemPhotos[item.id].map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo}
                              alt={`Photo ${index + 1} for ${item.description}`}
                              className="w-16 h-16 object-cover rounded border border-border"
                            />
                            <button
                              onClick={() => handleRemovePhoto(item.id, index)}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Photos in Print View */}
                  {itemPhotos[item.id]?.length > 0 && (
                    <div className="hidden print:block mt-2">
                      <p className="text-xs font-semibold mb-1">Attached Photos:</p>
                      <div className="flex flex-wrap gap-2">
                        {itemPhotos[item.id].map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-24 h-24 object-cover border border-gray-300"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Print Footer */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-300">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Inspector Signature:</strong></p>
              <div className="border-b border-gray-400 mt-2 w-3/4"></div>
            </div>
            <div>
              <p><strong>Date:</strong></p>
              <div className="border-b border-gray-400 mt-2 w-3/4"></div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Generated by Building Code Occupancy Classifier - Alberta Edition
          </p>
        </div>
      </div>

      {/* Phase Navigation */}
      <div className="print:hidden">
        <Card className="rounded-none border-border bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">All Phases Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {allChecklists.map((phaseChecklist) => {
                const phaseTotal = phaseChecklist.items.length;
                const phaseChecked = phaseChecklist.items.filter(item => checkedItems.has(item.id)).length;
                const phasePercentage = phaseTotal > 0 ? Math.round((phaseChecked / phaseTotal) * 100) : 0;

                return (
                  <button
                    key={phaseChecklist.phase}
                    onClick={() => handlePhaseChange(phaseChecklist.phase)}
                    className={`p-3 border rounded text-left transition-colors ${
                      selectedPhase === phaseChecklist.phase
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <p className="text-xs font-bold mb-1">{phaseChecklist.phase}</p>
                    <p className="text-lg font-bold">{phasePercentage}%</p>
                    <p className="text-[10px] text-muted-foreground">
                      {phaseChecked}/{phaseTotal} items
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
