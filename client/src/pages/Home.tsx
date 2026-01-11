import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Info, AlertTriangle, CheckCircle2, Building2, Ruler, DoorOpen, Flame, Zap, Droplets, Camera, MapPin, ShieldAlert, Calculator, Activity, Layers, Star, Bookmark, Mic, MicOff, History, Clock, Printer, StickyNote, Save, Moon, Sun, Share2, Download, Leaf, FileText, ClipboardList, FolderOpen, ArrowLeftRight, Accessibility } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/contexts/ThemeContext";
import { useProject } from "@/contexts/ProjectContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectDashboard } from "@/components/ProjectDashboard";
import { occupancyData, OccupancyGroup } from "@/lib/occupancyData";
import { constructionLimits, separationMatrix } from "@/lib/constructionData";
import { electricalChecklists } from "@/lib/electricalData";
import { plumbingChecklists } from "@/lib/plumbingData";
import { additionsData } from "@/lib/additionsData";
import { sustainabilityData } from "@/lib/sustainabilityData";
import { heightLimitsByOccupancy, setbackRequirements, allowableOpenings, ergonomicRequirements } from "@/lib/buildingRequirementsData";
import { getLoadFactors } from "@/lib/loadCalculationData";
import { WetVentingDiagram, FixtureUnitCalculator, GasLineCalculator } from "@/components/PlumbingTools";
import { SolarPVDiagram, EVChargingDiagram, TanklessHeaterDiagram, GridIntegrationDiagram } from "@/components/SustainabilityTools";
import { ServiceLoadCalculator, VoltageDropCalculator, ConduitFillCalculator } from "@/components/ElectricalTools";
import { FireSeparationDiagram, EgressWindowDiagram, GFCIZoneDiagram, SetbackDiagram, DeckCrossSectionDiagram } from "@/components/CodeDiagrams";
import { BarrierFreeWashroomDiagram, GrabBarDetailDiagram } from "@/components/BarrierFreeDiagrams";
import { AllowableOpeningsDiagram, StairErgonomicsDiagram, AccessibilityDiagram } from '@/components/BuildingRequirementsDiagrams';
import { FloorJoistSpanCalculator } from "@/components/FloorJoistSpanCalculator";
import { BeamSpanCalculator } from "@/components/BeamSpanCalculator";
import { RoofRafterSpanCalculator } from "@/components/RoofRafterSpanCalculator";
import { ColumnSpanCalculator } from "@/components/ColumnSpanCalculator";
import { InteractiveBeamDiagram } from "@/components/InteractiveBeamDiagram";
import { CeilingHeightTable } from "@/components/CeilingHeightTable";
import { FireSeparationCalculator } from "@/components/FireSeparationCalculator";
import { OccupantLoadCalculator } from "@/components/OccupantLoadCalculator";
import { ExitRequirementsCalculator } from "@/components/ExitRequirementsCalculator";
import { TravelDistanceCalculator } from "@/components/TravelDistanceCalculator";
import { ConstructionTypeSelector } from "@/components/ConstructionTypeSelector";
import { ConstructionLimitsCalculator } from "@/components/ConstructionLimitsCalculator";
import { BarrierFreeCalculator } from "@/components/BarrierFreeCalculator";
import { FireAlarmCalculator } from "@/components/FireAlarmCalculator";
import { EmergencyLightingCalculator } from '@/components/EmergencyLightingCalculator';
import { SpanTables } from '@/components/SpanTables';
import { CodeAmendmentTracker } from '@/components/CodeAmendmentTracker';
import { InspectorChecklistGeneratorEnhanced } from '@/components/InspectorChecklistGeneratorEnhanced';
import { OccupancyComparison } from '@/components/OccupancyComparison';
import { PermitFeeCalculator } from "@/components/PermitFeeCalculator";
import { StairDesignCalculator } from "@/components/StairDesignCalculator";
import { GuardHandrailCalculator } from "@/components/GuardHandrailCalculator";
import { SnowLoadCalculator } from "@/components/SnowLoadCalculator";
import { AccessibilityRampCalculator } from "@/components/AccessibilityRampCalculator";
import { ThermalResistanceCalculator } from "@/components/ThermalResistanceCalculator";
import { VentilationRateCalculator } from "@/components/VentilationRateCalculator";
import { StudSpacingCalculator } from "@/components/StudSpacingCalculator";
import { LintelSpanCalculator } from "@/components/LintelSpanCalculator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<OccupancyGroup | null>(null);
  const [activeTab, setActiveTab] = useState("building");
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem("occupancy_bookmarks");
    return saved ? JSON.parse(saved) : [];
  });
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("occupancy_search_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("occupancy_notes");
    return saved ? JSON.parse(saved) : {};
  });
  const { theme, toggleTheme } = useTheme();
  const { activeProjectId, updateProjectProgress } = useProject();
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    const saved = localStorage.getItem("selected_region");
    return saved || "AB";
  });

  useEffect(() => {
    localStorage.setItem("selected_region", selectedRegion);
  }, [selectedRegion]);

  useEffect(() => {
    localStorage.setItem("occupancy_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem("occupancy_search_history", JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem("occupancy_notes", JSON.stringify(notes));
  }, [notes]);

  const handleNoteChange = (id: string, content: string) => {
    setNotes(prev => ({ ...prev, [id]: content }));
  };

  const addToHistory = (id: string) => {
    setSearchHistory(prev => {
      const newHistory = [id, ...prev.filter(item => item !== id)].slice(0, 5);
      return newHistory;
    });
  };

  const handleGroupSelect = (group: OccupancyGroup) => {
    setSelectedGroup(group);
    addToHistory(group.id);
    // Update URL hash for sharing
    window.location.hash = group.code;
  };

  // Handle initial load from URL hash
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const group = occupancyData.find(g => g.code === hash);
      if (group) {
        setSelectedGroup(group);
        addToHistory(group.id);
      }
    }
  }, []);

  const copyShareLink = () => {
    if (selectedGroup) {
      const url = `${window.location.origin}/#${selectedGroup.code}`;
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const exportBookmarks = () => {
    const data = bookmarks.map(id => {
      const group = occupancyData.find(g => g.id === id);
      return group ? `${group.code} - ${group.name}` : null;
    }).filter(Boolean).join("\n");
    
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-occupancy-bookmarks.txt";
    a.click();
  };

  const exportToPDF = () => {
    if (!selectedGroup) return;
    
    // Create a styled print window
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      return;
    }
    
    const content = document.querySelector('.print\\:block')?.closest('.flex-1');
    if (!content) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedGroup.code} - ${selectedGroup.name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 48px; font-weight: 900; margin-bottom: 10px; }
            h2 { font-size: 24px; font-weight: 700; margin-bottom: 20px; }
            h3 { font-size: 16px; font-weight: 700; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: 600; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const toggleBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBookmarks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      
      // Synonym mapping
      let command = transcript;
      if (command.includes("wiring") || command.includes("lights") || command.includes("power")) command = command.replace(/wiring|lights|power/g, "electrical");
      if (command.includes("drainage") || command.includes("pipes") || command.includes("water")) command = command.replace(/drainage|pipes|water/g, "plumbing");
      if (command.includes("reno") || command.includes("extension")) command = command.replace(/reno|extension/g, "additions");
      if (command.includes("solar") || command.includes("green") || command.includes("ev") || command.includes("renewable")) command = command.replace(/solar|green|ev|renewable/g, "sustainability");

      // Check for tab navigation commands
      if (command.includes("plumbing")) {
        setActiveTab("plumbing");
        const cleanQuery = command.replace("plumbing", "").trim();
        if (cleanQuery) {
          setSearchQuery(cleanQuery);
          const match = occupancyData.find(g => 
            g.name.toLowerCase().includes(cleanQuery) || 
            g.examples.some(ex => ex.toLowerCase().includes(cleanQuery))
          );
          if (match) setSelectedGroup(match);
        }
      } else if (command.includes("electrical")) {
        setActiveTab("electrical");
        const cleanQuery = command.replace("electrical", "").trim();
        if (cleanQuery) {
          setSearchQuery(cleanQuery);
          const match = occupancyData.find(g => 
            g.name.toLowerCase().includes(cleanQuery) || 
            g.examples.some(ex => ex.toLowerCase().includes(cleanQuery))
          );
          if (match) setSelectedGroup(match);
        }
      } else if (command.includes("additions") || command.includes("deck") || command.includes("garage")) {
        setActiveTab("additions");
        const cleanQuery = command.replace("additions", "").trim();
        if (cleanQuery) setSearchQuery(cleanQuery);
      } else if (command.includes("sustainability") || command.includes("solar") || command.includes("ev") || command.includes("tankless")) {
        setActiveTab("sustainability");
        const cleanQuery = command.replace("sustainability", "").trim();
        if (cleanQuery) setSearchQuery(cleanQuery);
      } else {
        setSearchQuery(transcript);
      }
    };

    recognition.start();
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return occupancyData;
    
    const lowerQuery = searchQuery.toLowerCase();
    return occupancyData.filter(group => 
      group.code.toLowerCase().includes(lowerQuery) ||
      group.name.toLowerCase().includes(lowerQuery) ||
      group.description.toLowerCase().includes(lowerQuery) ||
      group.examples.some(ex => ex.toLowerCase().includes(lowerQuery))
    );
  }, [searchQuery]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search with "/"
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Show keyboard help with "?"
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowKeyboardHelp(true);
        return;
      }

      // Arrow key navigation in list
      if (e.key === "ArrowDown" && filteredData.length > 0) {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, filteredData.length - 1));
        setSelectedGroup(filteredData[Math.min(focusedIndex + 1, filteredData.length - 1)]);
      }
      if (e.key === "ArrowUp" && filteredData.length > 0) {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        setSelectedGroup(filteredData[Math.max(focusedIndex - 1, 0)]);
      }

      // Tab switching with numbers
      if (e.key >= "1" && e.key <= "6" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const tabs = ["building", "plumbing", "electrical", "additions", "sustainability", "fire-safety"];
        setActiveTab(tabs[parseInt(e.key) - 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredData, focusedIndex]);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar / Search Area */}
      <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-border bg-sidebar flex flex-col h-screen overflow-hidden z-10 ${selectedGroup ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-border bg-sidebar">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                {selectedRegion}
              </div>
              <h1 className="font-bold text-lg tracking-tight text-sidebar-foreground leading-tight">
                Building Code<br/>Occupancy Classifier
              </h1>
            </div>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[80px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AB">Alberta</SelectItem>
                <SelectItem value="BC">BC</SelectItem>
                <SelectItem value="ON">Ontario</SelectItem>
                <SelectItem value="SK">Sask</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input 
                ref={searchInputRef}
                type="text"
                placeholder="Search building type... (Press / to focus)" 
                className="pl-9 bg-background border-input focus-visible:ring-1 rounded-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={startListening}
                    className={`p-2 border border-input rounded-none transition-all relative overflow-hidden ${isListening ? "bg-red-50 text-red-600 border-red-200" : "bg-background hover:bg-accent text-muted-foreground"}`}
                  >
                    {isListening ? (
                      <div className="flex items-center justify-center w-4 h-4">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                        <MicOff className="w-4 h-4 relative z-10" />
                      </div>
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-bold mb-1">Voice Commands:</p>
                  <ul className="text-xs list-disc pl-4 space-y-1">
                    <li>"Residential Plumbing"</li>
                    <li>"Office Electrical"</li>
                    <li>"Deck Additions"</li>
                    <li>"Wiring" (Electrical)</li>
                    <li>"Drainage" (Plumbing)</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-muted-foreground">
              {isListening ? "Listening..." : 'Try "Restaurant", "Hospital"'}
            </p>
            {isListening && (
              <div className="flex gap-0.5 h-3 items-end">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-0.5 bg-red-500 animate-pulse" style={{height: `${Math.random() * 100}%`, animationDuration: '0.5s'}}></div>
                ))}
              </div>
            )}
          </div>
          
          <div className="max-h-[30vh] overflow-y-auto">
            {bookmarks.length > 0 && !searchQuery && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Bookmark className="w-3 h-3" /> Bookmarked
                  </h3>
                  <button 
                    onClick={exportBookmarks}
                    className="text-[10px] flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    title="Export list"
                  >
                    <Download className="w-3 h-3" /> Export
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bookmarks.map(id => {
                    const group = occupancyData.find(g => g.id === id);
                    if (!group) return null;
                    return (
                      <Badge 
                        key={id} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground bg-background"
                        onClick={() => handleGroupSelect(group)}
                      >
                        {group.code}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {searchHistory.length > 0 && !searchQuery && (
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Recent
                </h3>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map(id => {
                    const group = occupancyData.find(g => g.id === id);
                    if (!group) return null;
                    return (
                      <Badge 
                        key={id} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground bg-muted/50 text-muted-foreground border-transparent"
                        onClick={() => handleGroupSelect(group)}
                      >
                        {group.code}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No results found.</p>
              </div>
            ) : (
              filteredData.map((group) => (
                <div 
                  key={group.id}
                  onClick={() => handleGroupSelect(group)}
                  className={`
                    group cursor-pointer p-4 border transition-all duration-200
                    ${selectedGroup?.id === group.id 
                      ? "bg-primary text-primary-foreground border-primary shadow-md" 
                      : "bg-card hover:bg-accent hover:text-accent-foreground border-border hover:border-accent-foreground/20"}
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-mono font-bold text-lg ${selectedGroup?.id === group.id ? "text-white" : "text-primary"}`}>
                      {group.code}
                    </span>
                    <div className="flex items-center gap-2">
                      {group.division && (
                        <span className={`text-[10px] uppercase tracking-wider ${selectedGroup?.id === group.id ? "text-white/80" : "text-muted-foreground"}`}>
                          {group.division}
                        </span>
                      )}
                      <button
                        onClick={(e) => toggleBookmark(e, group.id)}
                        className={`hover:scale-110 transition-transform ${bookmarks.includes(group.id) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30 hover:text-yellow-400"}`}
                      >
                        <Star className={`w-4 h-4 ${bookmarks.includes(group.id) ? "fill-yellow-400" : ""}`} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-medium text-sm leading-tight mb-2">{group.name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {group.examples.slice(0, 2).map((ex, i) => (
                      <span 
                        key={i} 
                        className={`text-[10px] px-1.5 py-0.5 border ${selectedGroup?.id === group.id ? "border-white/30 bg-white/10" : "border-border bg-muted"}`}
                      >
                        {ex}
                      </span>
                    ))}
                    {group.examples.length > 2 && (
                      <span className={`text-[10px] px-1.5 py-0.5 ${selectedGroup?.id === group.id ? "text-white/70" : "text-muted-foreground"}`}>
                        +{group.examples.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-border text-[10px] text-muted-foreground bg-sidebar">
          Based on National Building Code - 2023 {selectedRegion === "AB" ? "Alberta" : selectedRegion === "BC" ? "British Columbia" : selectedRegion === "ON" ? "Ontario" : "Saskatchewan"} Edition
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 h-screen overflow-y-auto bg-background p-6 md:p-10 lg:p-16 print:p-0 print:overflow-visible ${!selectedGroup ? 'hidden md:block' : 'block'}`}>
        {selectedGroup ? (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 print:max-w-none print:animate-none">
            <div className="flex justify-between items-start print:hidden">
              <button 
                onClick={() => setSelectedGroup(null)}
                className="md:hidden mb-6 flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to Search
              </button>
                   <div className="flex items-center gap-2 print:hidden">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent transition-colors">
                      <FolderOpen className="w-4 h-4" />
                      Projects
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto rounded-none">
                    <ProjectDashboard />
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent transition-colors">
                      <ArrowLeftRight className="w-4 h-4" />
                      Compare
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto rounded-none">
                    <DialogHeader>
                      <DialogTitle>Occupancy Comparison</DialogTitle>
                      <DialogDescription>
                        Compare requirements, load factors, and construction limits between two occupancy types.
                      </DialogDescription>
                    </DialogHeader>
                    <OccupancyComparison />
                  </DialogContent>
                </Dialog>
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Guide
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 border border-primary rounded-md hover:bg-primary/10 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
            </div>
            <div className="flex items-baseline gap-4 mb-2 border-b-4 border-primary pb-4 print:border-black">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-primary font-mono print:text-black">
                {selectedGroup.code}
              </h1>
              <div className="flex flex-col">
                <span className="text-sm uppercase tracking-widest text-muted-foreground font-medium print:text-black">
                  {selectedGroup.division || "General"}
                </span>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground print:text-black">
                    {selectedGroup.name}
                  </h2>
                  {selectedGroup.albertaContrast && (
                    <div className="print:hidden">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="cursor-help border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors gap-1.5 py-1 px-2">
                              <MapPin className="w-3 h-3" /> AB Code
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs p-4 bg-blue-950 text-white border-blue-800">
                            <p className="font-bold mb-1 text-blue-200">{selectedGroup.albertaContrast.title}</p>
                            <p className="text-xs leading-relaxed">{selectedGroup.albertaContrast.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                  {selectedGroup.albertaContrast && (
                    <div className="hidden print:block border border-black p-2 text-xs">
                      <strong>{selectedGroup.albertaContrast.title}:</strong> {selectedGroup.albertaContrast.description}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mb-8 print:hidden">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                <StickyNote className="w-4 h-4" />
                <span>Project Notes</span>
              </div>
              <Textarea 
                placeholder="Add private notes for this occupancy (e.g. 'Check fire rating for Project X')..."
                className="min-h-[80px] text-sm bg-muted/30 resize-none"
                value={notes[selectedGroup.id] || ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleNoteChange(selectedGroup.id, e.target.value)}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
              {/* Mobile Dropdown Menu */}
              <div className="md:hidden mb-6">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="building">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> Building Code
                      </div>
                    </SelectItem>
                    <SelectItem value="plumbing">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4" /> Plumbing
                      </div>
                    </SelectItem>
                    <SelectItem value="electrical">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Electrical
                      </div>
                    </SelectItem>
                    <SelectItem value="additions">
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4" /> Additions
                      </div>
                    </SelectItem>
                    <SelectItem value="sustainability">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4" /> Sustainability
                      </div>
                    </SelectItem>
                    <SelectItem value="fire-safety">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4" /> Fire & Life Safety
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Horizontal Tabs */}
              <TabsList className="hidden md:flex w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto mb-8">
                <TabsTrigger 
                  value="building" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-bold uppercase tracking-wider"
                >
                  <Building2 className="w-4 h-4 mr-2" /> Building Code
                </TabsTrigger>
                <TabsTrigger 
                  value="plumbing" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-bold uppercase tracking-wider"
                >
                  <Droplets className="w-4 h-4 mr-2" /> Plumbing
                </TabsTrigger>
                <TabsTrigger 
                  value="electrical" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-bold uppercase tracking-wider"
                >
                  <Zap className="w-4 h-4 mr-2" /> Electrical
                </TabsTrigger>
                <TabsTrigger 
                  value="additions" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-bold uppercase tracking-wider"
                >
                  <Ruler className="w-4 h-4 mr-2" /> Additions
                </TabsTrigger>
                <TabsTrigger 
                  value="sustainability" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-bold uppercase tracking-wider"
                >
                  <Leaf className="w-4 h-4 mr-2" /> Sustainability
                </TabsTrigger>
                <TabsTrigger 
                  value="fire-safety" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-bold uppercase tracking-wider"
                >
                  <Flame className="w-4 h-4 mr-2" /> Fire & Life Safety
                </TabsTrigger>
                <TabsTrigger 
                  value="design-tools" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-bold uppercase tracking-wider"
                >
                  <Calculator className="w-4 h-4 mr-2" /> Design Tools
                </TabsTrigger>
              </TabsList>

              <TabsContent value="building" className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-h-[calc(100vh-16rem)] overflow-y-auto">
                {/* Quick Jump Navigation */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border mb-6 -mx-4 px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jump to:</span>
                    <button
                      onClick={() => document.getElementById('construction-limits')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Construction Limits
                    </button>
                    <button
                      onClick={() => document.getElementById('span-tables')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Span Tables
                    </button>
                    <button
                      onClick={() => document.getElementById('code-amendments')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Code Amendments
                    </button>
                    <button
                      onClick={() => document.getElementById('inspector-checklist')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Inspector Checklist
                    </button>
                  </div>
                </div>

                {selectedGroup.id === "C-2" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="overflow-hidden border-border shadow-sm">
                      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <Ruler className="h-4 w-4" /> Fire Separation Detail
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 bg-white">
                        <FireSeparationDiagram />
                        <p className="text-xs text-muted-foreground mt-4 font-medium">
                          Typical 1hr fire separation assembly for secondary suites (9.10.9.14).
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="overflow-hidden border-border shadow-sm">
                      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <DoorOpen className="h-4 w-4" /> Egress Window
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 bg-white">
                        <EgressWindowDiagram />
                        <p className="text-xs text-muted-foreground mt-4 font-medium">
                          Must provide unobstructed opening of min 0.35 m², with no dimension less than 380 mm.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Description & Examples */}
                  <div className="lg:col-span-2 space-y-8">
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Definition
                      </h3>
                      <p className="text-lg leading-relaxed border-l-2 border-accent pl-4">
                        {selectedGroup.description}
                      </p>
                    </section>

                    {/* Load Calculation Factors */}
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-orange-600 mb-3 flex items-center gap-2">
                        <Calculator className="w-4 h-4" /> Load Calculation Factors
                      </h3>
                      {(() => {
                        const loadFactors = getLoadFactors(selectedGroup.code);
                        return loadFactors ? (
                          <div className="border border-orange-200 bg-orange-50/50 rounded p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-3 bg-white border border-orange-200 rounded">
                                <p className="text-xs font-bold text-orange-900 mb-1 uppercase tracking-wider">Live Load</p>
                                <p className="text-2xl font-bold text-orange-600">{loadFactors.liveLoad}</p>
                                <p className="text-xs text-muted-foreground mt-1">{loadFactors.liveLoadDescription}</p>
                              </div>
                              <div className="p-3 bg-white border border-orange-200 rounded">
                                <p className="text-xs font-bold text-orange-900 mb-1 uppercase tracking-wider">Dead Load</p>
                                <p className="text-2xl font-bold text-orange-600">{loadFactors.deadLoad}</p>
                                <p className="text-xs text-muted-foreground mt-1">Typical structural</p>
                              </div>
                              <div className="p-3 bg-white border border-orange-200 rounded">
                                <p className="text-xs font-bold text-orange-900 mb-1 uppercase tracking-wider">Snow Load</p>
                                <p className="text-2xl font-bold text-orange-600">{loadFactors.snowLoad || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground mt-1">Roof design (regional)</p>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-orange-200">
                              <p className="text-xs font-bold text-orange-900 mb-2 uppercase tracking-wider">Notes (NBC 2023 Table 4.1.5.3)</p>
                              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                                {loadFactors.notes.map((note: string, i: number) => (
                                  <li key={i}>{note}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Load factors not available for this occupancy type.</p>
                        );
                      })()}
                    </section>

                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> Common Examples
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedGroup.examples.map((ex, i) => (
                          <Badge 
                            key={i} 
                            variant="secondary" 
                            className="rounded-none px-3 py-1.5 text-sm font-normal border border-border bg-secondary/50 hover:bg-secondary"
                          >
                            {ex}
                          </Badge>
                        ))}
                      </div>
                    </section>

                    <section className="bg-muted/30 p-6 border border-border">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-destructive mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Key Compliance Notes
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-mono">
                        {selectedGroup.compliance.notes}
                      </p>
                    </section>
                  </div>

                  {/* Right Column: Compliance Data */}
                  <div className="space-y-6">
                    <Card className="rounded-none border-border shadow-sm">
                      <CardHeader className="pb-2 border-b border-border bg-muted/20">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <Flame className="w-4 h-4 text-destructive" /> Fire Safety
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <span className="text-xs text-muted-foreground uppercase block mb-1">Fire Resistance</span>
                          <p className="text-sm font-medium">{selectedGroup.compliance.fireResistance}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground uppercase block mb-1">Sprinklers</span>
                          <p className="text-sm font-medium">{selectedGroup.compliance.sprinklers}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-none border-border shadow-sm">
                      <CardHeader className="pb-2 border-b border-border bg-muted/20">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <DoorOpen className="w-4 h-4 text-primary" /> Egress
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <span className="text-xs text-muted-foreground uppercase block mb-1">Occupant Load</span>
                          <p className="text-sm font-medium">{selectedGroup.compliance.occupantLoad}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground uppercase block mb-1">Exits</span>
                      <p className="text-sm font-medium">{selectedGroup.compliance.exits}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-none border-border shadow-sm">
                      <CardHeader className="pb-2 border-b border-border bg-muted/20">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <Ruler className="w-4 h-4 text-primary" /> Construction
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm font-medium">{selectedGroup.compliance.construction}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Additional Building Requirements */}
                <div className="space-y-8 mt-8 pt-8 border-t border-border">
                  {/* Construction Limits */}
                  <section id="construction-limits" className="scroll-mt-20">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Construction Limits (Part 3.2.2)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 border-l-2 border-muted-foreground/20 pl-3">
                      Maximum building area and height permitted for <strong>{selectedGroup.code}</strong> based on NBC 2023 Article 3.2.2.
                    </p>
                    
                    {/* Interactive Construction Limits Calculator */}
                    <div className="mb-6">
                      <ConstructionLimitsCalculator />
                    </div>

                    {/* Static Reference Table */}
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 mt-8">Reference Table - {selectedGroup.code} Occupancy Limits</h4>
                    <div className="rounded-md border border-border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/20">
                          <TableRow>
                            <TableHead className="font-bold">Article</TableHead>
                            <TableHead className="font-bold">Max Height</TableHead>
                            <TableHead className="font-bold">Max Area</TableHead>
                            <TableHead className="font-bold">Sprinklers</TableHead>
                            <TableHead className="font-bold">Construction</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {constructionLimits[selectedGroup.code.split(' ')[0]]?.map((limit, index) => (
                            <TableRow key={index} className="hover:bg-muted/10">
                              <TableCell className="font-mono text-xs text-primary">{limit.article}</TableCell>
                              <TableCell>{limit.maxHeight}</TableCell>
                              <TableCell>{limit.maxArea}</TableCell>
                              <TableCell>
                                {limit.sprinklered ? (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Required</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Optional</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                  {limit.constructionType.map(type => (
                                    <Badge key={type} variant="outline" className="text-[10px] border-border">
                                      {type}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          )) || (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No specific construction limits found for this group.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </section>

                  {/* Building Height Limits */}
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Building Height Limits
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 border-l-2 border-primary/20 pl-3">
                      Maximum height and storey limits for <strong>{selectedGroup.code}</strong> by construction type.
                    </p>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Construction Type</TableHead>
                            <TableHead>Max Height</TableHead>
                            <TableHead>Max Storeys</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow><TableCell>Combustible</TableCell><TableCell>18m</TableCell><TableCell>6</TableCell><TableCell>With sprinklers</TableCell></TableRow>
                          <TableRow><TableCell>Noncombustible</TableCell><TableCell>No limit</TableCell><TableCell>No limit</TableCell><TableCell>Based on fire resistance rating</TableCell></TableRow>
                          <TableRow><TableCell>Heavy Timber</TableCell><TableCell>18m</TableCell><TableCell>6</TableCell><TableCell>Specific requirements apply</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </section>

                  {/* Ceiling Height Requirements */}
                  <section className="mb-8">
                    <CeilingHeightTable occupancy={selectedGroup.code} />
                  </section>

                  {/* Allowable Openings */}
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-destructive mb-4 flex items-center gap-2">
                      <DoorOpen className="w-4 h-4" /> Allowable Openings in Fire-Rated Assemblies
                    </h3>
                    <div className="mb-6">
                      <AllowableOpeningsDiagram />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-border bg-card rounded-none">
                        <h4 className="font-bold text-sm mb-2">Fire-Rated Doors</h4>
                        <p className="text-xs text-muted-foreground">Must have a fire-protection rating not less than that required for closures in the fire separation.</p>
                      </div>
                      <div className="p-4 border border-border bg-card rounded-none">
                        <h4 className="font-bold text-sm mb-2">Maximum Opening Size</h4>
                        <p className="text-xs text-muted-foreground">Limited by fire separation rating and building area. Consult NBC Table 3.1.8.4.</p>
                      </div>
                    </div>
                  </section>

                  {/* Ergonomic Requirements */}
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-green-600 mb-4 flex items-center gap-2">
                      <Ruler className="w-4 h-4" /> Ergonomic & Accessibility Requirements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <StairErgonomicsDiagram />
                      <AccessibilityDiagram />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border border-border bg-card rounded-none">
                        <h4 className="font-bold text-sm mb-2">Stair Dimensions</h4>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                          <li>Rise: 125mm - 200mm</li>
                          <li>Run: Min 210mm</li>
                          <li>Width: Min 860mm</li>
                        </ul>
                      </div>
                      <div className="p-4 border border-border bg-card rounded-none">
                        <h4 className="font-bold text-sm mb-2">Handrails</h4>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                          <li>Height: 865mm - 965mm</li>
                          <li>Diameter: 30mm - 43mm</li>
                          <li>Clearance: Min 50mm from wall</li>
                        </ul>
                      </div>
                      <div className="p-4 border border-border bg-card rounded-none">
                        <h4 className="font-bold text-sm mb-2">Doorways</h4>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                          <li>Clear width: Min 810mm</li>
                          <li>Barrier-free: Min 850mm</li>
                          <li>Threshold: Max 13mm</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Property Setbacks */}
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Property Setback Requirements
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 border-l-2 border-blue-600/20 pl-3">
                      Setback requirements are determined by municipal zoning bylaws, not the Building Code. Always verify with your local authority.
                    </p>
                    <div className="mb-6">
                      <SetbackDiagram />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-border bg-card rounded-none">
                        <h4 className="font-bold text-sm mb-2">Typical Requirements</h4>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                          <li>Front: 6.0m (varies by zone)</li>
                          <li>Rear: 7.5m (principal building)</li>
                          <li>Side: 1.2m minimum</li>
                        </ul>
                      </div>
                      <div className="p-4 border border-border bg-card rounded-none">
                        <h4 className="font-bold text-sm mb-2">Accessory Buildings</h4>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                          <li>Rear/Side: Often 0.6m if under height limit</li>
                          <li>Check municipal bylaws for specifics</li>
                          <li>Verify with Real Property Report (RPR)</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Floor Joist Span Calculator */}
                  <section className="mb-8">
                    <FloorJoistSpanCalculator />
                  </section>

                  {/* Beam Span Calculator */}
                  <section className="mb-8">
                    <BeamSpanCalculator />
                  </section>

                  {/* Roof Rafter Span Calculator */}
                  <section className="mb-8">
                    <RoofRafterSpanCalculator />
                  </section>

                  {/* Column Load Calculator */}
                  <section className="mb-8">
                    <ColumnSpanCalculator />
                  </section>

                  {/* Interactive Beam Diagram */}
                  <section className="mb-8">
                    <InteractiveBeamDiagram />
                  </section>

                  {/* Span Tables */}
                  <section id="span-tables" className="scroll-mt-20">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                      <Ruler className="w-4 h-4" /> Structural Span Tables
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 border-l-2 border-primary/20 pl-3">
                      Maximum spans for floor joists, ceiling joists, and roof rafters based on NBC 2023 Part 9 Span Tables.
                    </p>
                    <SpanTables />
                  </section>

                  {/* Code Amendment Tracker */}
                  <section id="code-amendments" className="scroll-mt-20">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-purple-600 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Code Amendment Tracker (NBC 2019 → 2023)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 border-l-2 border-purple-600/20 pl-3">
                      Key changes between NBC 2019 and NBC 2023 affecting <strong>{selectedGroup.code}</strong> occupancy.
                    </p>
                    <CodeAmendmentTracker occupancyCode={selectedGroup.code} />
                  </section>

                  {/* Inspector Checklist Generator */}
                  <section id="inspector-checklist" className="scroll-mt-20">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-4 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" /> Inspector Checklist Generator
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 border-l-2 border-blue-600/20 pl-3">
                      Generate printable inspection checklists by construction phase for <strong>{selectedGroup.code}</strong> occupancy.
                    </p>
                    <InspectorChecklistGeneratorEnhanced 
                      occupancyCode={selectedGroup.code} 
                      occupancyName={selectedGroup.name}
                      projectId={activeProjectId || undefined}
                      onProgressUpdate={(phase, completed, total) => {
                        if (activeProjectId) {
                          const percentage = Math.round((completed / total) * 100);
                          updateProjectProgress(activeProjectId, phase, percentage);
                        }
                      }}
                    />
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="plumbing" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Droplets className="w-4 h-4" /> Fixture Requirements
                      </h3>
                      <p className="text-lg leading-relaxed border-l-2 border-accent pl-4">
                        {selectedGroup.plumbing?.fixtures || "Standard fixture requirements apply based on occupant load."}
                      </p>
                    </section>

                    <section className="bg-muted/30 p-6 border border-border">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Drainage & Systems
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-mono">
                        {selectedGroup.plumbing?.drainage || "Standard drainage requirements apply."}
                      </p>
                    </section>

                    {(selectedGroup.code.startsWith("A")) && (
                      <div className="border-t border-border pt-8 mt-8 col-span-full">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-600" /> Barrier-Free Washroom Requirements (ABC 3.8.2.8)
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <Card className="rounded-none border-border shadow-sm overflow-hidden">
                            <CardHeader className="pb-2 border-b border-border bg-muted/20">
                              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <Ruler className="w-4 h-4 text-primary" /> Universal Washroom Layout
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="aspect-[5/4] w-full bg-white p-4">
                                <BarrierFreeWashroomDiagram />
                              </div>
                              <div className="p-4 bg-muted/10 border-t border-border space-y-2">
                                <p className="text-xs text-muted-foreground">
                                  <strong>Turning Space:</strong> Must provide a 1500mm diameter clear turning circle.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  <strong>Door:</strong> Min 850mm clear width. Power operator required if door closer force &gt; 22N.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  <strong>Transfer Space:</strong> Min 900mm wide clear space beside toilet for wheelchair transfer.
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          <div className="space-y-6">
                            <Card className="rounded-none border-border shadow-sm overflow-hidden">
                              <CardHeader className="pb-2 border-b border-border bg-muted/20">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                  <Activity className="w-4 h-4 text-primary" /> Grab Bar Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-0">
                                <div className="aspect-[2/1] w-full bg-white p-4">
                                  <GrabBarDetailDiagram />
                                </div>
                              </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="p-4 border border-border bg-card rounded-none">
                                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                  <MapPin className="w-3 h-3 text-primary" /> Toilet Location
                                </h4>
                                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                                  <li>Centerline to side wall: <strong>460mm - 480mm</strong></li>
                                  <li>Seat height: <strong>430mm - 460mm</strong></li>
                                  <li>Back support required if no seat lid.</li>
                                </ul>
                              </div>
                              <div className="p-4 border border-border bg-card rounded-none">
                                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                  <Droplets className="w-3 h-3 text-primary" /> Lavatory
                                </h4>
                                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                                  <li>Max rim height: <strong>865mm</strong></li>
                                  <li>Clear knee space: <strong>735mm high</strong></li>
                                  <li>Faucets: Lever type or automatic (sensor).</li>
                                  <li>Insulate exposed pipes to prevent burns.</li>
                                </ul>
                              </div>
                              <div className="p-4 border border-border bg-card rounded-none col-span-full">
                                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                  <Info className="w-3 h-3 text-primary" /> Accessories
                                </h4>
                                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                  <li><strong>Mirror:</strong> Bottom edge max 1000mm from floor.</li>
                                  <li><strong>Soap/Towel:</strong> Controls max 1200mm high.</li>
                                  <li><strong>Coat Hook:</strong> One at 1200mm, one higher.</li>
                                  <li><strong>Emergency Call:</strong> Often required in universal washrooms.</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(selectedGroup.code.startsWith("C") || selectedGroup.code.startsWith("A-2")) && (
                      <div className="border-t border-border pt-8 mt-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                          <Card className="rounded-none border-border shadow-sm overflow-hidden">
                            <CardHeader className="pb-2 border-b border-border bg-muted/20">
                              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <Droplets className="w-4 h-4 text-blue-500" /> Wet Venting (NPC 2.5.8)
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="aspect-[4/3] w-full bg-white p-4">
                                <WetVentingDiagram />
                              </div>
                            </CardContent>
                          </Card>
                          <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                              <Calculator className="w-4 h-4" /> Plumbing Calculators
                            </h3>
                            <FixtureUnitCalculator />
                            <GasLineCalculator />
                          </div>
                        </div>

                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" /> Rough-In Checklist
                        </h3>
                        <Tabs defaultValue="kitchen" className="w-full">
                          <TabsList className="w-full justify-start mb-6 bg-muted/50 p-1 h-auto flex-wrap">
                            {plumbingChecklists.map((room) => (
                              <TabsTrigger key={room.id} value={room.id} className="flex-1 min-w-[100px]">
                                {room.name}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {plumbingChecklists.map((room) => (
                            <TabsContent key={room.id} value={room.id} className="space-y-3 mt-0">
                              {room.items.map((item) => (
                                <div key={item.id} className="flex items-start space-x-3 p-4 rounded-none border border-border bg-card hover:bg-accent/50 transition-colors group">
                                  <Checkbox id={item.id} className="mt-1" />
                                  <div className="grid gap-1.5 leading-none w-full">
                                    <div className="flex items-center justify-between gap-2">
                                      <Label
                                        htmlFor={item.id}
                                        className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                      >
                                        {item.label}
                                      </Label>
                                      <Badge variant="outline" className="font-mono text-[10px] h-5 bg-muted text-muted-foreground whitespace-nowrap">
                                        {item.codeRef}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </TabsContent>
                          ))}
                        </Tabs>
                      </div>
                    )}


                  </div>

                  <div className="space-y-6">
                    <Card className="rounded-none border-border shadow-sm">
                      <CardHeader className="pb-2 border-b border-border bg-muted/20">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" /> Special Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm font-medium">{selectedGroup.plumbing?.notes || "No special notes."}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="electrical" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Emergency Power
                      </h3>
                      <p className="text-lg leading-relaxed border-l-2 border-accent pl-4">
                        {selectedGroup.electrical?.emergencyPower || "Standard emergency lighting requirements apply."}
                      </p>
                    </section>

                    <section className="bg-muted/30 p-6 border border-border">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Lighting & Distribution
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-mono">
                        {selectedGroup.electrical?.lighting || "Standard lighting requirements apply."}
                      </p>
                    </section>

                    {(selectedGroup.code.startsWith("C") || selectedGroup.code.startsWith("A-2")) && (
                      <div className="border-t border-border pt-8 mt-8">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" /> Rough-In Checklist
                        </h3>
                        <Tabs defaultValue="kitchen" className="w-full">
                          <TabsList className="w-full justify-start mb-6 bg-muted/50 p-1 h-auto flex-wrap">
                            {electricalChecklists.map((room) => (
                              <TabsTrigger key={room.id} value={room.id} className="flex-1 min-w-[100px]">
                                {room.name}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {electricalChecklists.map((room) => (
                            <TabsContent key={room.id} value={room.id} className="space-y-3 mt-0">
                              {room.items.map((item) => (
                                <div key={item.id} className="flex items-start space-x-3 p-4 rounded-none border border-border bg-card hover:bg-accent/50 transition-colors group">
                                  <Checkbox id={item.id} className="mt-1" />
                                  <div className="grid gap-1.5 leading-none w-full">
                                    <div className="flex items-center justify-between gap-2">
                                      <Label
                                        htmlFor={item.id}
                                        className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                      >
                                        {item.label}
                                      </Label>
                                      <Badge variant="outline" className="font-mono text-[10px] h-5 bg-muted text-muted-foreground whitespace-nowrap">
                                        {item.codeRef}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </TabsContent>
                          ))}
                        </Tabs>
                      </div>
                    )}

                    <div className="flex flex-col gap-8 mt-8 pt-8 border-t border-border">
                      <div className="w-full">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-4">
                          <Zap className="w-4 h-4" /> Load Calculation
                        </h3>
                        <ServiceLoadCalculator />
                      </div>
                      <div className="w-full">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-4">
                          <Activity className="w-4 h-4" /> Voltage Drop
                        </h3>
                        <VoltageDropCalculator />
                      </div>
                      <div className="w-full">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-4">
                          <Layers className="w-4 h-4" /> Conduit Fill
                        </h3>
                        <ConduitFillCalculator />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Card className="rounded-none border-border shadow-sm">
                      <CardHeader className="pb-2 border-b border-border bg-muted/20">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" /> Special Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm font-medium">{selectedGroup.electrical?.notes || "No special notes."}</p>
                      </CardContent>
                    </Card>

                    {(selectedGroup.code.startsWith("C") || selectedGroup.code.startsWith("A-2")) && (
                      <Card className="rounded-none border-border shadow-sm overflow-hidden">
                        <CardHeader className="pb-2 border-b border-border bg-muted/20">
                          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-destructive" /> GFCI Zone (1.5m)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="aspect-[4/3] w-full bg-white">
                            <GFCIZoneDiagram />
                          </div>
                          <div className="p-4 bg-muted/10 border-t border-border">
                            <p className="text-xs text-muted-foreground text-center">
                              Receptacles within 1.5m of sinks/washbasins require Class A GFCI protection (CEC 26-700).
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="additions" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-8">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <Calculator className="w-4 h-4" /> Permit Fee Estimator
                    </h3>
                    <div className="max-w-2xl">
                      <PermitFeeCalculator />
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <Ruler className="w-4 h-4" /> Zoning & Setbacks (Municipal)
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="rounded-none border-border shadow-sm overflow-hidden">
                        <CardHeader className="pb-2 border-b border-border bg-muted/20">
                          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" /> Typical Setback Rules
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="aspect-[4/3] w-full bg-white">
                            <SetbackDiagram />
                          </div>
                          <div className="p-4 bg-muted/10 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                              <strong>Disclaimer:</strong> Setbacks (Front, Rear, Side) are determined by your local Land Use Bylaw, NOT the Building Code. Always check your Real Property Report (RPR) and city zoning maps.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <div className="space-y-4">
                        <div className="p-4 border border-border bg-card rounded-none">
                          <h4 className="font-bold text-sm mb-2">Principal vs. Accessory</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            <strong>Principal Building:</strong> The main house. Requires larger setbacks (e.g., 6m Front, 7.5m Rear).
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Accessory Building:</strong> Detached garage, shed, gazebo. Often allows reduced setbacks (e.g., 0.6m Side/Rear) if under a certain height.
                          </p>
                        </div>
                        <div className="p-4 border border-border bg-card rounded-none">
                          <h4 className="font-bold text-sm mb-2">Permitted Projections</h4>
                          <p className="text-xs text-muted-foreground">
                            Eaves, cantilevers, and fireplaces may project into setbacks by a limited amount (e.g., 0.6m). Decks under 0.6m height often have relaxed rules.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Common Additions
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      {additionsData.map((type) => (
                        <Card key={type.id} className="rounded-none border-border shadow-sm">
                          <CardHeader className="pb-2 border-b border-border bg-muted/20">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg font-bold flex items-center gap-2">
                                {type.name}
                              </CardTitle>
                              <Badge variant="outline" className="font-mono text-xs">Part 9</Badge>
                            </div>
                            <CardDescription>{type.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              <div className="lg:col-span-2 space-y-4">
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                  <div>
                                    <strong>Zoning Note:</strong> {type.zoningNotes}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {type.requirements.map((req) => (
                                    <div key={req.id} className="p-3 border border-border rounded bg-card hover:bg-muted/50 transition-colors">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-sm">{req.title}</span>
                                        {req.codeRef && <Badge variant="secondary" className="text-[10px] h-5">{req.codeRef}</Badge>}
                                      </div>
                                      <p className="text-xs text-muted-foreground">{req.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {type.id === 'deck' && (
                                <div className="border border-border rounded overflow-hidden">
                                  <div className="bg-muted/20 p-2 border-b border-border text-xs font-bold text-center uppercase">Cross Section</div>
                                  <div className="aspect-[3/4] bg-white">
                                    <DeckCrossSectionDiagram />
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="sustainability" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-8">
                  {sustainabilityData.map((topic) => (
                    <section key={topic.id}>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                        <Leaf className="w-4 h-4" /> {topic.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">{topic.description}</p>
                      
                      {/* Visual Diagrams */}
                      {topic.id === 'solar-pv' && (
                        <div className="mb-6">
                          <SolarPVDiagram />
                        </div>
                      )}
                      {topic.id === 'ev-charging' && (
                        <div className="mb-6">
                          <EVChargingDiagram />
                        </div>
                      )}
                      {topic.id === 'tankless-heaters' && (
                        <div className="mb-6">
                          <TanklessHeaterDiagram />
                        </div>
                      )}
                      {topic.id === 'grid-integration' && (
                        <div className="mb-6">
                          <GridIntegrationDiagram />
                        </div>
                      )}

                      {/* Code References */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Code References</h4>
                        <div className="flex flex-wrap gap-2">
                          {topic.codeReferences.map((ref, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs font-mono">
                              {ref}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Requirements */}
                      <div className="space-y-4 mb-6">
                        {topic.requirements.map((req) => (
                          <Card key={req.id} className="rounded-none border-border shadow-sm">
                            <CardHeader className="pb-2 border-b border-border bg-muted/20">
                              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                                {req.category}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <ul className="space-y-2">
                                {req.items.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                    <span className="text-muted-foreground">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Considerations */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded">
                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                          <Info className="w-4 h-4" /> Key Considerations
                        </h4>
                        <ul className="space-y-2">
                          {topic.considerations.map((consideration, idx) => (
                            <li key={idx} className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
                              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                              <span>{consideration}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </section>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="fire-safety" className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-h-[calc(100vh-16rem)] overflow-y-auto">
                <div className="space-y-8">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6 flex items-center gap-2">
                      <Flame className="w-5 h-5" /> Fire Protection & Life Safety Calculators
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Critical NBC 2025 Part 3 calculators for fire protection, occupant safety, and egress design. These tools help determine fire separation requirements, occupant loads, exit configurations, and construction type limitations.
                    </p>
                    <div className="space-y-6">
                      <FireSeparationCalculator />
                      <OccupantLoadCalculator />
                      <ExitRequirementsCalculator />
                      <TravelDistanceCalculator />
                      <ConstructionTypeSelector />
                    </div>
                  </section>

                  <section className="mt-8 pt-8 border-t border-border">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6 flex items-center gap-2">
                      <Accessibility className="w-5 h-5" /> Accessibility & Safety Systems
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      NBC 2025 Part 3 calculators for barrier-free design, fire alarm systems, and emergency lighting requirements. Ensure compliance with accessibility standards and life safety systems.
                    </p>
                    <div className="space-y-6">
                      <BarrierFreeCalculator />
                      <FireAlarmCalculator />
                      <EmergencyLightingCalculator />
                    </div>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="design-tools" className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-h-[calc(100vh-16rem)] overflow-y-auto">
                <div className="space-y-8">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6 flex items-center gap-2">
                      <Calculator className="w-5 h-5" /> NBC 2025 Design Tools - Tier 1 Critical Calculators
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Essential design calculators covering stairs, guards, structural loads, accessibility, thermal performance, and ventilation. These Tier 1 tools address the most frequently used NBC 2025 requirements for residential and commercial projects.
                    </p>
                    <div className="space-y-6">
                      <StairDesignCalculator />
                      <GuardHandrailCalculator />
                      <SnowLoadCalculator />
                      <AccessibilityRampCalculator />
                    </div>
                  </section>

                  <section className="mt-8 pt-8 border-t border-border">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6 flex items-center gap-2">
                      <Building2 className="w-5 h-5" /> Building Envelope & Systems
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Thermal performance, ventilation, and structural framing calculators for building envelope design and mechanical systems sizing.
                    </p>
                    <div className="space-y-6">
                      <ThermalResistanceCalculator />
                      <VentilationRateCalculator />
                      <StudSpacingCalculator />
                      <LintelSpanCalculator />
                    </div>
                  </section>
                </div>
              </TabsContent>

            </Tabs>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-40">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Select a Building Type</h2>
            <p className="text-muted-foreground">
              Search for a building type in the sidebar or select an occupancy group to view detailed compliance requirements.
            </p>
          </div>
        )}
      </div>

      {/* Keyboard Help Dialog */}
      <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" /> Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these shortcuts to navigate faster
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr,2fr] gap-4 text-sm">
              <div className="font-mono bg-muted px-2 py-1 rounded text-center">/</div>
              <div>Focus search bar</div>
              
              <div className="font-mono bg-muted px-2 py-1 rounded text-center">?</div>
              <div>Show this help dialog</div>
              
              <div className="font-mono bg-muted px-2 py-1 rounded text-center">↑ / ↓</div>
              <div>Navigate occupancy list</div>
              
              <div className="font-mono bg-muted px-2 py-1 rounded text-center">Ctrl+1-5</div>
              <div>Switch between tabs</div>
              
              <div className="font-mono bg-muted px-2 py-1 rounded text-center text-xs">Ctrl+P</div>
              <div>Print current page</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Help Button */}
      <button
        onClick={() => setShowKeyboardHelp(true)}
        className="fixed bottom-4 right-4 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all z-50 print:hidden"
        title="Keyboard Shortcuts (?)"
      >
        <Keyboard className="w-5 h-5" />
      </button>
    </div>
  );
}
