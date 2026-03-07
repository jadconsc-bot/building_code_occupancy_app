import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Book, X, Search, Building2, Flame, Droplets, Zap, Layers, 
  Calculator, FileText, Bookmark, Mic, Share2, Printer, Download,
  HelpCircle, ChevronRight, Home, Settings, Info, MapPin, Leaf,
  ClipboardList, FolderOpen, ArrowLeftRight, Accessibility, Camera,
  Keyboard, ExternalLink
} from "lucide-react";

interface UserManualProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserManual({ isOpen, onClose }: UserManualProps) {
  const [activeSection, setActiveSection] = useState<string>("getting-started");

  if (!isOpen) return null;

  const sections = [
    { id: "getting-started", title: "Getting Started", icon: Home },
    { id: "search", title: "Search & Navigation", icon: Search },
    { id: "occupancy", title: "Occupancy Classifications", icon: Building2 },
    { id: "building-code", title: "Building Code Tab", icon: Layers },
    { id: "fire-safety", title: "Fire Safety Tools", icon: Flame },
    { id: "plumbing", title: "Plumbing Calculators", icon: Droplets },
    { id: "electrical", title: "Electrical Tools", icon: Zap },
    { id: "additions", title: "Additions & Renovations", icon: Building2 },
    { id: "sustainability", title: "Sustainability", icon: Leaf },
    { id: "design", title: "Design Tools", icon: Calculator },
    { id: "municipal-bylaws", title: "Municipal Bylaws", icon: MapPin },
    { id: "inspector", title: "Inspector Checklist", icon: ClipboardList },
    { id: "projects", title: "Project Management", icon: FolderOpen },
    { id: "comparison", title: "Comparison View", icon: ArrowLeftRight },
    { id: "export", title: "Export Features", icon: Download },
    { id: "keyboard", title: "Keyboard Shortcuts", icon: Keyboard },
    { id: "glossary", title: "Glossary", icon: FileText },
    { id: "faq", title: "FAQ", icon: HelpCircle },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl h-[90vh] overflow-hidden rounded-lg shadow-xl flex flex-col">
        <CardHeader className="pb-3 border-b bg-gradient-to-r from-green-600 to-green-700 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Book className="w-6 h-6" />
              Comprehensive User Manual
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-green-100 mt-1">
            Alberta Building Code Occupancy Classifier - Complete Guide v2.0
          </p>
        </CardHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r bg-muted/30 flex-shrink-0 overflow-y-auto">
            <nav className="p-2 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeSection === section.id
                      ? "bg-green-100 text-green-800 font-medium"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <section.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <ScrollArea className="flex-1 p-6">
            {activeSection === "getting-started" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Getting Started</h2>
                <p className="text-muted-foreground">
                  Welcome to the Alberta Building Code Occupancy Classifier! This comprehensive application helps building professionals, 
                  inspectors, contractors, and homeowners quickly determine occupancy classifications, code requirements, and compliance calculations.
                </p>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quick Start Guide</h3>
                  <ol className="list-decimal list-inside space-y-3 text-sm">
                    <li><strong>Search for your building type</strong> - Use the search bar to find your occupancy classification (e.g., "restaurant", "hospital", "apartment")</li>
                    <li><strong>Select an occupancy</strong> - Click on a classification from the sidebar to view detailed requirements</li>
                    <li><strong>Navigate tabs</strong> - Use the tabs to access Building Code, Fire Safety, Plumbing, Electrical, Additions, Sustainability, and Design Tools</li>
                    <li><strong>Use calculators</strong> - Input your project details to get code-compliant calculations</li>
                    <li><strong>Check municipal bylaws</strong> - Use the Municipal Bylaws tab for setback, height, and coverage requirements</li>
                    <li><strong>Export results</strong> - Print or export your findings for permit applications</li>
                  </ol>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Pro Tips
                  </h4>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• Press <kbd className="px-1 bg-green-100 rounded">/</kbd> to quickly focus the search bar</li>
                    <li>• Press <kbd className="px-1 bg-green-100 rounded">?</kbd> to view all keyboard shortcuts</li>
                    <li>• Use voice search by clicking the microphone icon</li>
                    <li>• Bookmark frequently used occupancies with the star icon</li>
                    <li>• Search results now navigate directly to calculators and tools</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Application Overview</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium text-sm">14 Occupancy Groups</h4>
                      <p className="text-xs text-muted-foreground">A-1 through F-3 classifications</p>
                    </div>
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium text-sm">50+ Calculators</h4>
                      <p className="text-xs text-muted-foreground">Fire, plumbing, electrical, structural</p>
                    </div>
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium text-sm">5 Municipalities</h4>
                      <p className="text-xs text-muted-foreground">Edmonton, Calgary, Airdrie, Lethbridge, Vancouver</p>
                    </div>
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium text-sm">Multiple Export Options</h4>
                      <p className="text-xs text-muted-foreground">PDF, Excel, Print, Share</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "search" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Search & Navigation</h2>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Search Features</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <Search className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      <div>
                        <strong>Text Search:</strong> Type any building type, code term, or calculator name. The search understands natural language (e.g., "church" finds A-2 Assembly, "stair" finds Stair Design Calculator).
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Mic className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      <div>
                        <strong>Voice Search:</strong> Click the microphone and speak your query. Supports commands like "plumbing fixtures", "fire separation", or "residential electrical".
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      <div>
                        <strong>Clickable Results:</strong> Search results for calculators and tools are now clickable - they navigate directly to the relevant tab and section.
                      </div>
                    </li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6">Voice Command Examples</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Badge variant="outline">"Residential Plumbing" → Plumbing Tab</Badge>
                    <Badge variant="outline">"Office Electrical" → Electrical Tab</Badge>
                    <Badge variant="outline">"Deck Additions" → Additions Tab</Badge>
                    <Badge variant="outline">"Fire Safety" → Fire Safety Tab</Badge>
                    <Badge variant="outline">"Design Calculator" → Design Tools Tab</Badge>
                    <Badge variant="outline">"Municipal Bylaws" → Municipal Bylaws Tab</Badge>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold">Searchable Content</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Badge variant="outline">Occupancy types (A-1, B-2, C, etc.)</Badge>
                    <Badge variant="outline">Building types (hospital, school, restaurant)</Badge>
                    <Badge variant="outline">Calculators (stair, fixture, voltage drop)</Badge>
                    <Badge variant="outline">Code sections (Part 3, Part 9, Section 9.8)</Badge>
                    <Badge variant="outline">Materials (gypsum, sprinkler, insulation)</Badge>
                    <Badge variant="outline">Municipal zones (RF1, R-C1, RS-1)</Badge>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mt-6">
                  <h4 className="font-semibold text-blue-800">Smart Navigation</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    When you search for a calculator or tool (like "stair design"), clicking the result will:
                    <br/>1. Select a default occupancy if none is selected
                    <br/>2. Navigate to the correct tab
                    <br/>3. Scroll to the specific section
                    <br/>4. Briefly highlight the matched content
                  </p>
                </div>
              </div>
            )}

            {activeSection === "occupancy" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Occupancy Classifications</h2>
                <p className="text-muted-foreground">
                  The National Building Code of Canada classifies buildings into major groups based on their use and fire risk.
                  Each classification has specific requirements for fire safety, egress, accessibility, and construction.
                </p>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="group-a">
                    <AccordionTrigger>Group A - Assembly (A-1 to A-4)</AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-sm space-y-2">
                        <li><strong>A-1 Performing Arts:</strong> Theatres, cinemas, opera houses, concert halls. Fixed seating facing a stage or screen.</li>
                        <li><strong>A-2 General Assembly:</strong> Churches, gyms, restaurants, schools, libraries, museums, community halls, daycares.</li>
                        <li><strong>A-3 Arena Type:</strong> Arenas, stadiums, swimming pools, sports complexes with open floor areas.</li>
                        <li><strong>A-4 Open Air:</strong> Grandstands, bleachers, amusement parks, outdoor venues.</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">Key requirements: High occupant loads, multiple exits, fire alarm systems, sprinklers often required.</p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="group-b">
                    <AccordionTrigger>Group B - Institutional (B-1 to B-3)</AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-sm space-y-2">
                        <li><strong>B-1 Detention:</strong> Jails, prisons, secure psychiatric facilities. Occupants under restraint.</li>
                        <li><strong>B-2 Treatment:</strong> Hospitals, nursing homes, rehabilitation centers. Occupants require medical care.</li>
                        <li><strong>B-3 Care:</strong> Assisted living, group homes, hospices. Occupants need assistance but not treatment.</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">Key requirements: Defend-in-place strategy, enhanced fire resistance, staff assistance for evacuation.</p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="group-c">
                    <AccordionTrigger>Group C - Residential</AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-sm space-y-2">
                        <li><strong>C (General):</strong> Apartments, condos, houses, hotels, motels, dormitories, boarding houses.</li>
                        <li><strong>C (Secondary Suite):</strong> Basement suites, garden suites, laneway houses, accessory dwelling units.</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">Key requirements: Smoke alarms, egress windows, fire separation between units, Part 9 for houses.</p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="group-d">
                    <AccordionTrigger>Group D - Business & Personal Services</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm">Offices, banks, professional services, medical offices, dental offices, salons, government buildings, police stations.</p>
                      <p className="text-xs text-muted-foreground mt-2">Key requirements: Generally lower risk, standard egress requirements, accessibility provisions.</p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="group-e">
                    <AccordionTrigger>Group E - Mercantile</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm">Retail stores, supermarkets, shopping centers, department stores, markets, pharmacies.</p>
                      <p className="text-xs text-muted-foreground mt-2">Key requirements: Variable occupant loads, display and storage areas, accessible routes.</p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="group-f">
                    <AccordionTrigger>Group F - Industrial (F-1 to F-3)</AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-sm space-y-2">
                        <li><strong>F-1 High Hazard:</strong> Chemical plants, refineries, paint factories, distilleries. Flammable/explosive materials.</li>
                        <li><strong>F-2 Medium Hazard:</strong> Factories, warehouses, aircraft hangars, auto shops, laboratories.</li>
                        <li><strong>F-3 Low Hazard:</strong> Parking garages, power plants, cold storage, low-hazard storage.</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">Key requirements: Fire separation based on hazard level, sprinklers, ventilation, explosion venting for F-1.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            {activeSection === "building-code" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Building Code Tab</h2>
                <p className="text-muted-foreground">
                  The Building Code tab provides essential structural and construction information for the selected occupancy.
                </p>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Available Information</h3>
                  
                  <div className="grid gap-3">
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Load Calculation Factors</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Dead loads, live loads, and snow loads for structural design. Values based on NBC Table 4.1.5.3.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Construction Limits</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Maximum building height, area, and required construction type based on occupancy and sprinkler status.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Span Tables</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Floor joist, beam, rafter, and column span tables for Part 9 buildings. Interactive calculators for custom spans.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Fire Separation Requirements</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Required fire resistance ratings between occupancies, suites, and service spaces.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold">Structural Calculators</h3>
                  <ul className="text-sm space-y-2">
                    <li><strong>Floor Joist Calculator:</strong> Determine joist size and spacing based on span and load.</li>
                    <li><strong>Beam Span Calculator:</strong> Calculate required beam size for given tributary area.</li>
                    <li><strong>Roof Rafter Calculator:</strong> Size rafters based on span, spacing, and snow load.</li>
                    <li><strong>Column Load Calculator:</strong> Determine column capacity and sizing.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === "fire-safety" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Fire Safety Tools</h2>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Available Calculators</h3>
                  
                  <div className="grid gap-3">
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        Flame Spread Rating (FSR)
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Look up FSR and SDR values for building materials. Filter by occupancy type and location requirements.
                        Class A (0-25), Class B (26-75), Class C (76-200).
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        Construction Type Selector
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Determine required construction type based on building height, area, and occupancy.
                        Combustible vs non-combustible, heavy timber options.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-green-500" />
                        Occupant Load Calculator
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate maximum occupant load based on floor area and use type per NBC Table 3.1.17.1.
                        Determines exit requirements.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Exit Requirements Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate required number of exits, exit width, and travel distance based on occupant load.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Fire Alarm Requirements</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Determine fire alarm system requirements based on building size and occupancy.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Emergency Lighting Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate emergency lighting and exit sign requirements for egress paths.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-md mt-6">
                  <h4 className="font-semibold text-orange-800">Fire Separation Matrix</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    The app includes an interactive fire separation matrix showing required fire resistance ratings
                    between different occupancy types. Access it from the Fire Safety tab.
                  </p>
                </div>
              </div>
            )}

            {activeSection === "plumbing" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Plumbing Calculators</h2>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Fixture Calculators</h3>
                  
                  <div className="grid gap-3">
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Water Closet Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate required water closets based on NBC Table 3.7.2.2.-A. Supports male/female separation and special occupancies.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Urinal Substitution</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate how urinals can substitute for up to 2/3 of male water closets per NBC 3.7.2.3.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Lavatory Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Determine required lavatories (sinks) per NBC 3.7.2.4. Based on occupant load.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Drinking Fountain Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate minimum drinking fountains per NBC 3.7.2.5. Accessibility requirements included.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold">Advanced Plumbing Tools</h3>
                  
                  <div className="grid gap-3">
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Wet Venting Diagram</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Interactive diagram showing wet venting configurations for residential plumbing.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Fixture Unit Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate drainage fixture units (DFU) for pipe sizing.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Gas Line Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Size gas lines based on BTU load and pipe length.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "electrical" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Electrical Tools</h2>
                
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Service Load Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate electrical service size based on dwelling area and major appliances per CEC Section 8.
                        Supports 100A, 200A, and larger services.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Voltage Drop Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Verify wire sizing meets voltage drop requirements (3% for branch circuits, 5% total).
                        Supports copper and aluminum conductors.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Conduit Fill Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate conduit fill percentage to ensure compliance with 40% fill rule.
                        Multiple conductor types supported.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">GFCI Zone Diagram</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Visual guide showing where GFCI protection is required in residential and commercial buildings.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Receptacle Spacing Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate required receptacle spacing per CEC 26-712. 1.8m rule for dwelling units.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "additions" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Additions & Renovations</h2>
                <p className="text-muted-foreground">
                  The Additions tab covers common residential addition types with specific code requirements.
                </p>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Covered Addition Types</h3>
                  
                  <div className="grid gap-3">
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Decks & Balconies</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Setback requirements, guard heights, structural requirements, permit thresholds.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Garages & Carports</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Fire separation from dwelling, setback requirements, door requirements.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Secondary Suites</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Egress requirements, fire separation, ceiling height, parking requirements.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Garden Suites</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Setback requirements, maximum size, utility connections, accessibility.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Basement Development</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ceiling height, egress windows, bedroom requirements, moisture control.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "sustainability" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Sustainability</h2>
                <p className="text-muted-foreground">
                  The Sustainability tab covers energy efficiency, renewable energy, and green building requirements.
                </p>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Available Tools</h3>
                  
                  <div className="grid gap-3">
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Solar Panel Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Estimate solar panel requirements and potential energy generation.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">EV Charger Requirements</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Electrical requirements for Level 1, Level 2, and DC fast charging.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Tankless Water Heater Sizing</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate required flow rate and BTU for tankless water heaters.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Heat Pump Sizing</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Determine heat pump capacity based on climate zone and building size.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "design" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Design Tools</h2>
                
                <div className="grid gap-3">
                  <div className="p-3 border rounded-md">
                    <h4 className="font-medium">Stair Design Calculator</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Calculate rise, run, and verify compliance with NBC stair requirements.
                      Supports residential and commercial stairs.
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-md">
                    <h4 className="font-medium">Guard & Handrail Calculator</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verify guard heights (1070mm typical), handrail requirements, and opening sizes (100mm sphere rule).
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-md">
                    <h4 className="font-medium">Accessibility Ramp Calculator</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Design barrier-free ramps with proper slope (1:12 max) and landing requirements.
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-md">
                    <h4 className="font-medium">Snow Load Calculator</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Calculate design snow loads based on location, roof slope, and exposure.
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-md">
                    <h4 className="font-medium">Thermal Resistance Calculator</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Calculate effective R-value for wall and roof assemblies. Includes thermal bridging.
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-md">
                    <h4 className="font-medium">Ventilation Rate Calculator</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Calculate required ventilation rates per ASHRAE 62.2 and NBC.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "municipal-bylaws" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Municipal Bylaws</h2>
                <p className="text-muted-foreground">
                  The Municipal Bylaws tab provides land use and zoning regulations for 5 major municipalities.
                </p>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Supported Municipalities</h3>
                  
                  <div className="grid gap-3">
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        Edmonton - Zoning Bylaw 20001
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Zones: RSL (Small Lot), RF1 (Single Detached), RF3 (Small Scale Infill), RA7 (Low Rise Apartment)
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        Calgary - Land Use Bylaw 1P2007
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Zones: R-C1 (Residential Contextual), R-C2 (Residential Contextual), R-CG (Residential Grade), M-CG (Multi-Residential)
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-500" />
                        Airdrie - Land Use Bylaw B-01/2016
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Zones: R-1 (Residential Single), R-2 (Residential Two), R-3 (Residential Multi)
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-500" />
                        Lethbridge - Land Use Bylaw 6300
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Zones: R-L (Residential Low), R-M (Residential Medium), R-H (Residential High)
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        Vancouver - Zoning By-law 3575
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Zones: RS-1 (One-Family), RT-1 (Two-Family), RM-1 (Multiple Dwelling)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold">Available Calculators</h3>
                  <ul className="text-sm space-y-2">
                    <li><strong>Setback Calculator:</strong> Check front, rear, and side setback compliance</li>
                    <li><strong>Site Coverage Calculator:</strong> Calculate building footprint as percentage of lot</li>
                    <li><strong>Height Calculator:</strong> Verify building height compliance</li>
                    <li><strong>Lot Size Calculator:</strong> Check minimum lot size requirements</li>
                    <li><strong>Zone Comparison:</strong> Compare regulations across municipalities</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === "inspector" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Inspector Checklist</h2>
                <p className="text-muted-foreground">
                  The Inspector Checklist feature allows you to create comprehensive inspection checklists with photo documentation.
                </p>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Features</h3>
                  
                  <div className="grid gap-3">
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-blue-500" />
                        Pre-built Checklists
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Checklists for framing, electrical rough-in, plumbing rough-in, insulation, and final inspections.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <Camera className="w-4 h-4 text-green-500" />
                        Photo Documentation
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload photos for each checklist item. Photos are embedded in the exported PDF.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-500" />
                        Code References
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Each checklist item includes the relevant NBC section reference.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <Download className="w-4 h-4 text-purple-500" />
                        PDF Export
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Export completed checklists as professional PDF reports with QR codes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mt-6">
                  <h4 className="font-semibold text-blue-800">How to Use</h4>
                  <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                    <li>Select an occupancy type</li>
                    <li>Go to the Building Code tab</li>
                    <li>Click "Inspector Checklist" button</li>
                    <li>Fill in project details and check items</li>
                    <li>Upload photos for documentation</li>
                    <li>Export as PDF for records</li>
                  </ol>
                </div>
              </div>
            )}

            {activeSection === "projects" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Project Management</h2>
                <p className="text-muted-foreground">
                  The Projects feature allows you to save and organize multiple building projects.
                </p>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Features</h3>
                  
                  <div className="grid gap-3">
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Save Projects</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Save current occupancy, calculator inputs, and notes as a named project.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Load Projects</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Quickly load saved projects to continue where you left off.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Project Notes</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add private notes to each occupancy for project-specific reminders.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Calculator Presets</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Save and load calculator presets for frequently used configurations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "comparison" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Comparison View</h2>
                <p className="text-muted-foreground">
                  Compare requirements between different occupancy types or municipalities side-by-side.
                </p>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Available Comparisons</h3>
                  
                  <div className="grid gap-3">
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Occupancy Comparison</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Compare fire safety, egress, and construction requirements between occupancy types.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Municipal Comparison</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Compare setbacks, height limits, and coverage between municipalities for the same zone type.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Zone Comparison</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Compare different zone types within the same municipality.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "export" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Export Features</h2>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Export Options</h3>
                  
                  <div className="grid gap-3">
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <Printer className="w-4 h-4" />
                        Print Guide
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Generate a print-friendly version of the current occupancy requirements.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export PDF
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Download a PDF summary with all requirements, tables, and compliance notes.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Export Checklist
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Generate a professional inspection checklist PDF with project name, QR code, and code references.
                        Supports batch export for multiple occupancies.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Copy a direct link to the current occupancy classification. Share via email or messaging.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-md mt-6">
                  <h4 className="font-semibold text-green-800">Batch Export</h4>
                  <p className="text-sm text-green-700 mt-1">
                    The Export Checklist dialog now supports batch export. Select multiple occupancy types
                    to generate a combined PDF with all relevant checklists for comprehensive project documentation.
                  </p>
                </div>
              </div>
            )}

            {activeSection === "keyboard" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
                
                <div className="space-y-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold">Shortcut</th>
                        <th className="text-left py-2 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2"><kbd className="px-2 py-1 bg-muted rounded">/</kbd></td>
                        <td className="py-2">Focus search bar</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><kbd className="px-2 py-1 bg-muted rounded">?</kbd></td>
                        <td className="py-2">Show keyboard shortcuts help</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><kbd className="px-2 py-1 bg-muted rounded">↑</kbd> <kbd className="px-2 py-1 bg-muted rounded">↓</kbd></td>
                        <td className="py-2">Navigate occupancy list</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><kbd className="px-2 py-1 bg-muted rounded">1</kbd> - <kbd className="px-2 py-1 bg-muted rounded">7</kbd></td>
                        <td className="py-2">Switch tabs (Building, Plumbing, Electrical, etc.)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><kbd className="px-2 py-1 bg-muted rounded">Esc</kbd></td>
                        <td className="py-2">Close dialogs and modals</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><kbd className="px-2 py-1 bg-muted rounded">Enter</kbd></td>
                        <td className="py-2">Select focused item</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mt-6">
                  <h4 className="font-semibold text-blue-800">Tab Numbers</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-blue-700">
                    <div><kbd className="px-1 bg-blue-100 rounded">1</kbd> Building Code</div>
                    <div><kbd className="px-1 bg-blue-100 rounded">2</kbd> Plumbing</div>
                    <div><kbd className="px-1 bg-blue-100 rounded">3</kbd> Electrical</div>
                    <div><kbd className="px-1 bg-blue-100 rounded">4</kbd> Additions</div>
                    <div><kbd className="px-1 bg-blue-100 rounded">5</kbd> Sustainability</div>
                    <div><kbd className="px-1 bg-blue-100 rounded">6</kbd> Fire Safety</div>
                    <div><kbd className="px-1 bg-blue-100 rounded">7</kbd> Design Tools</div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "glossary" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Glossary of Terms</h2>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="a">
                    <AccordionTrigger>A</AccordionTrigger>
                    <AccordionContent>
                      <dl className="space-y-2 text-sm">
                        <div><dt className="font-medium">AHJ (Authority Having Jurisdiction)</dt><dd className="text-muted-foreground">The organization, office, or individual responsible for enforcing code requirements.</dd></div>
                        <div><dt className="font-medium">Assembly Occupancy</dt><dd className="text-muted-foreground">Buildings where people gather for civic, political, travel, religious, social, educational, recreational, or similar purposes.</dd></div>
                        <div><dt className="font-medium">Accessible</dt><dd className="text-muted-foreground">A building or portion thereof that complies with barrier-free design requirements.</dd></div>
                      </dl>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="b">
                    <AccordionTrigger>B</AccordionTrigger>
                    <AccordionContent>
                      <dl className="space-y-2 text-sm">
                        <div><dt className="font-medium">Building Area</dt><dd className="text-muted-foreground">The greatest horizontal area of a building above grade within the outside surface of exterior walls.</dd></div>
                        <div><dt className="font-medium">Building Height</dt><dd className="text-muted-foreground">The number of storeys contained between the roof and the floor of the first storey.</dd></div>
                        <div><dt className="font-medium">Barrier-Free Path of Travel</dt><dd className="text-muted-foreground">A continuous unobstructed path of travel that can be used by persons using wheelchairs.</dd></div>
                      </dl>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="c">
                    <AccordionTrigger>C</AccordionTrigger>
                    <AccordionContent>
                      <dl className="space-y-2 text-sm">
                        <div><dt className="font-medium">Combustible Construction</dt><dd className="text-muted-foreground">Construction that does not meet the requirements for noncombustible construction.</dd></div>
                        <div><dt className="font-medium">Closure</dt><dd className="text-muted-foreground">A device or assembly for closing an opening through a fire separation.</dd></div>
                        <div><dt className="font-medium">CEC</dt><dd className="text-muted-foreground">Canadian Electrical Code - the standard for electrical installations in Canada.</dd></div>
                      </dl>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="d-f">
                    <AccordionTrigger>D - F</AccordionTrigger>
                    <AccordionContent>
                      <dl className="space-y-2 text-sm">
                        <div><dt className="font-medium">Dead Load</dt><dd className="text-muted-foreground">The weight of all permanent structural and nonstructural components of a building.</dd></div>
                        <div><dt className="font-medium">DFU (Drainage Fixture Unit)</dt><dd className="text-muted-foreground">A measure of the probable discharge into the drainage system by various plumbing fixtures.</dd></div>
                        <div><dt className="font-medium">Egress</dt><dd className="text-muted-foreground">A continuous path of travel from any point in a building to a public way.</dd></div>
                        <div><dt className="font-medium">Fire Resistance Rating</dt><dd className="text-muted-foreground">The time in hours that a material or assembly can withstand fire exposure.</dd></div>
                        <div><dt className="font-medium">FSR (Flame Spread Rating)</dt><dd className="text-muted-foreground">An index indicating the relative rate at which flame will spread over the surface of a material.</dd></div>
                      </dl>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="g-l">
                    <AccordionTrigger>G - L</AccordionTrigger>
                    <AccordionContent>
                      <dl className="space-y-2 text-sm">
                        <div><dt className="font-medium">GFCI</dt><dd className="text-muted-foreground">Ground Fault Circuit Interrupter - a device that disconnects a circuit when it detects current leakage.</dd></div>
                        <div><dt className="font-medium">Guard</dt><dd className="text-muted-foreground">A protective barrier around openings in floors or at the open sides of stairs, landings, balconies, etc.</dd></div>
                        <div><dt className="font-medium">Live Load</dt><dd className="text-muted-foreground">The load produced by the use and occupancy of the building, not including dead load, wind load, or seismic load.</dd></div>
                      </dl>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="m-r">
                    <AccordionTrigger>M - R</AccordionTrigger>
                    <AccordionContent>
                      <dl className="space-y-2 text-sm">
                        <div><dt className="font-medium">NBC</dt><dd className="text-muted-foreground">National Building Code of Canada - the model code for building construction in Canada.</dd></div>
                        <div><dt className="font-medium">Noncombustible Construction</dt><dd className="text-muted-foreground">Construction in which a degree of fire safety is attained by the use of noncombustible materials.</dd></div>
                        <div><dt className="font-medium">Occupant Load</dt><dd className="text-muted-foreground">The number of persons for which a building or part thereof is designed.</dd></div>
                        <div><dt className="font-medium">RSI (R-value SI)</dt><dd className="text-muted-foreground">Thermal resistance in SI units (m²·K/W).</dd></div>
                      </dl>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="s-z">
                    <AccordionTrigger>S - Z</AccordionTrigger>
                    <AccordionContent>
                      <dl className="space-y-2 text-sm">
                        <div><dt className="font-medium">SDR (Smoke Developed Rating)</dt><dd className="text-muted-foreground">An index of the concentration of smoke a material emits as it burns.</dd></div>
                        <div><dt className="font-medium">Setback</dt><dd className="text-muted-foreground">The minimum distance required between a building and a property line.</dd></div>
                        <div><dt className="font-medium">Site Coverage</dt><dd className="text-muted-foreground">The percentage of a lot covered by buildings and structures.</dd></div>
                        <div><dt className="font-medium">Sprinklered</dt><dd className="text-muted-foreground">Equipped with a system of automatic sprinklers.</dd></div>
                        <div><dt className="font-medium">Travel Distance</dt><dd className="text-muted-foreground">The distance from any point in a floor area to an exit.</dd></div>
                      </dl>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            {activeSection === "faq" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="faq-1">
                    <AccordionTrigger>What code version does this app use?</AccordionTrigger>
                    <AccordionContent>
                      This application references the National Building Code of Canada 2020 (NBC 2020) and the Alberta Building Code 2019. 
                      Always verify requirements with your local Authority Having Jurisdiction (AHJ).
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="faq-2">
                    <AccordionTrigger>Are the permit fee estimates accurate?</AccordionTrigger>
                    <AccordionContent>
                      Permit fee estimates are based on typical municipal fee structures and are for planning purposes only. 
                      Actual fees vary by municipality and project specifics. Always confirm with your local building department.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="faq-3">
                    <AccordionTrigger>Can I use this for permit applications?</AccordionTrigger>
                    <AccordionContent>
                      This app is a reference tool to help understand code requirements. While the information can support your 
                      permit application, official code compliance must be verified by a licensed professional and the AHJ.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="faq-4">
                    <AccordionTrigger>How do I report an error or suggest a feature?</AccordionTrigger>
                    <AccordionContent>
                      Use the "Beta Feedback" option in the Export menu to submit feedback. We appreciate all suggestions 
                      for improving the accuracy and usefulness of this tool.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="faq-5">
                    <AccordionTrigger>What is the Safety Codes Act?</AccordionTrigger>
                    <AccordionContent>
                      The Safety Codes Act (RSA 2000, Chapter S-1) is Alberta's legislation governing building permits, 
                      inspections, and safety codes. It establishes the framework for accredited agencies and safety codes officers.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="faq-6">
                    <AccordionTrigger>How do the municipal bylaws work?</AccordionTrigger>
                    <AccordionContent>
                      The Municipal Bylaws tab provides zoning regulations for Edmonton, Calgary, Airdrie, Lethbridge, and Vancouver.
                      Select a municipality and zone type to see setback, height, coverage, and lot requirements. The calculators
                      help verify compliance with these regulations.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="faq-7">
                    <AccordionTrigger>Can I export checklists for multiple occupancies?</AccordionTrigger>
                    <AccordionContent>
                      Yes! The Export Checklist dialog now supports batch export. You can select multiple occupancy types
                      and generate a combined PDF with all relevant checklists. This is useful for mixed-use buildings
                      or comprehensive project documentation.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="faq-8">
                    <AccordionTrigger>How do I use voice search?</AccordionTrigger>
                    <AccordionContent>
                      Click the microphone icon next to the search bar and speak your query. The app understands natural
                      language commands like "residential plumbing", "fire safety", or "deck additions". Voice search
                      will navigate to the relevant tab and section.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="faq-9">
                    <AccordionTrigger>What's the difference between Part 3 and Part 9 buildings?</AccordionTrigger>
                    <AccordionContent>
                      Part 9 applies to houses and small buildings (up to 3 storeys, 600m² building area). Part 3 applies
                      to larger buildings. Part 9 uses prescriptive span tables and simplified requirements, while Part 3
                      requires engineered solutions and more detailed analysis.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="faq-10">
                    <AccordionTrigger>How accurate are the calculators?</AccordionTrigger>
                    <AccordionContent>
                      The calculators are based on NBC 2020 and CEC requirements. They provide accurate results for typical
                      scenarios, but complex situations may require professional engineering review. Always verify critical
                      calculations with a licensed professional.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}

export default UserManual;
