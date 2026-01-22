import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Book, X, Search, Building2, Flame, Droplets, Zap, Layers, 
  Calculator, FileText, Bookmark, Mic, Share2, Printer, Download,
  HelpCircle, ChevronRight, Home, Settings, Info
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
    { id: "fire-safety", title: "Fire Safety Tools", icon: Flame },
    { id: "plumbing", title: "Plumbing Calculators", icon: Droplets },
    { id: "electrical", title: "Electrical Tools", icon: Zap },
    { id: "design", title: "Design Tools", icon: Layers },
    { id: "features", title: "App Features", icon: Settings },
    { id: "faq", title: "FAQ", icon: HelpCircle },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[85vh] overflow-hidden rounded-lg shadow-xl flex flex-col">
        <CardHeader className="pb-3 border-b bg-gradient-to-r from-green-600 to-green-700 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Book className="w-6 h-6" />
              User Manual
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-green-100 mt-1">
            Alberta Building Code Occupancy Classifier - Complete Guide
          </p>
        </CardHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-56 border-r bg-muted/30 flex-shrink-0 overflow-y-auto">
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
                  <section.icon className="w-4 h-4" />
                  {section.title}
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
                  Welcome to the Alberta Building Code Occupancy Classifier! This application helps building professionals, 
                  inspectors, and homeowners quickly determine occupancy classifications and code requirements.
                </p>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quick Start Guide</h3>
                  <ol className="list-decimal list-inside space-y-3 text-sm">
                    <li><strong>Search for your building type</strong> - Use the search bar to find your occupancy classification (e.g., "restaurant", "hospital", "apartment")</li>
                    <li><strong>Select an occupancy</strong> - Click on a classification from the sidebar to view detailed requirements</li>
                    <li><strong>Navigate tabs</strong> - Use the tabs to access Building Code, Fire Safety, Plumbing, Electrical, and other tools</li>
                    <li><strong>Use calculators</strong> - Input your project details to get code-compliant calculations</li>
                    <li><strong>Export results</strong> - Print or export your findings for permit applications</li>
                  </ol>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Pro Tip
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    Use voice search by clicking the microphone icon. Say commands like "residential plumbing" or "fire safety" to navigate quickly.
                  </p>
                </div>
              </div>
            )}

            {activeSection === "search" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Search & Navigation</h2>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Search Features</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Search className="w-4 h-4 mt-0.5 text-primary" />
                      <span><strong>Text Search:</strong> Type any building type, code term, or calculator name. The search understands natural language (e.g., "church" finds A-2 Assembly).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Mic className="w-4 h-4 mt-0.5 text-primary" />
                      <span><strong>Voice Search:</strong> Click the microphone and speak your query. Supports commands like "plumbing fixtures" or "fire separation".</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 mt-0.5 text-primary" />
                      <span><strong>Autocomplete:</strong> As you type, suggestions appear. Click a suggestion to navigate directly to that section.</span>
                    </li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6">Searchable Terms</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Badge variant="outline">Occupancy types (A-1, B-2, etc.)</Badge>
                    <Badge variant="outline">Building types (hospital, school)</Badge>
                    <Badge variant="outline">Calculators (flame spread, fixtures)</Badge>
                    <Badge variant="outline">Code sections (Part 3, Part 9)</Badge>
                    <Badge variant="outline">Materials (gypsum, sprinkler)</Badge>
                    <Badge variant="outline">Permits (building, electrical)</Badge>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold">Quick Jump Navigation</h3>
                  <p className="text-sm text-muted-foreground">
                    Each tab has colored quick-jump buttons at the top to navigate directly to specific sections:
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• <span className="text-blue-600 font-medium">Blue</span> - Fire separation and construction</li>
                    <li>• <span className="text-green-600 font-medium">Green</span> - Safety codes and permits</li>
                    <li>• <span className="text-indigo-600 font-medium">Indigo</span> - Occupant load factors</li>
                    <li>• <span className="text-orange-600 font-medium">Orange</span> - Flame spread ratings</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === "occupancy" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Occupancy Classifications</h2>
                <p className="text-muted-foreground">
                  The National Building Code of Canada classifies buildings into major groups based on their use and fire risk.
                </p>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="group-a">
                    <AccordionTrigger>Group A - Assembly</AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-sm space-y-1">
                        <li><strong>A-1:</strong> Performing arts (theatres, cinemas, opera houses)</li>
                        <li><strong>A-2:</strong> General assembly (churches, gyms, restaurants, schools)</li>
                        <li><strong>A-3:</strong> Arena type (arenas, swimming pools, rinks)</li>
                        <li><strong>A-4:</strong> Open air (grandstands, bleachers, amusement parks)</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="group-b">
                    <AccordionTrigger>Group B - Institutional</AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-sm space-y-1">
                        <li><strong>B-1:</strong> Detention (jails, prisons, secure facilities)</li>
                        <li><strong>B-2:</strong> Treatment (hospitals, nursing homes)</li>
                        <li><strong>B-3:</strong> Care (assisted living, group homes)</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="group-c">
                    <AccordionTrigger>Group C - Residential</AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-sm space-y-1">
                        <li><strong>C-1:</strong> General residential (apartments, hotels, houses)</li>
                        <li><strong>C-2:</strong> Secondary suites (basement suites, garden suites)</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="group-d">
                    <AccordionTrigger>Group D - Business</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm">Offices, banks, professional services, government buildings</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="group-e">
                    <AccordionTrigger>Group E - Mercantile</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm">Retail stores, supermarkets, shopping centers, markets</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="group-f">
                    <AccordionTrigger>Group F - Industrial</AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-sm space-y-1">
                        <li><strong>F-1:</strong> High hazard (refineries, chemical plants)</li>
                        <li><strong>F-2:</strong> Medium hazard (manufacturing, workshops)</li>
                        <li><strong>F-3:</strong> Low hazard (warehouses, storage)</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
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
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        Construction Type Selector
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Determine required construction type based on building height, area, and occupancy.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-green-500" />
                        Occupant Load Calculator
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate maximum occupant load based on floor area and use type per NBC Table 3.1.17.1.
                      </p>
                    </div>
                  </div>
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
                        Determine required lavatories (sinks) per NBC 3.7.2.4.
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Drinking Fountain Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate minimum drinking fountains per NBC 3.7.2.5.
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
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Voltage Drop Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Verify wire sizing meets voltage drop requirements (3% for branch circuits, 5% total).
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium">Conduit Fill Calculator</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Calculate conduit fill percentage to ensure compliance with 40% fill rule.
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
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-md">
                    <h4 className="font-medium">Guard & Handrail Calculator</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verify guard heights, handrail requirements, and opening sizes.
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-md">
                    <h4 className="font-medium">Accessibility Ramp Calculator</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Design barrier-free ramps with proper slope (1:12) and landing requirements.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "features" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">App Features</h2>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Bookmarks & History</h3>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <Bookmark className="w-4 h-4 mt-0.5 text-yellow-500" />
                      <span><strong>Bookmarks:</strong> Star any occupancy to save it for quick access. Bookmarks persist across sessions.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FileText className="w-4 h-4 mt-0.5 text-blue-500" />
                      <span><strong>Notes:</strong> Add personal notes to any occupancy classification for future reference.</span>
                    </li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6">Export Options</h3>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <Printer className="w-4 h-4 mt-0.5" />
                      <span><strong>Print Guide:</strong> Generate a print-friendly version of the current occupancy requirements.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Download className="w-4 h-4 mt-0.5" />
                      <span><strong>Export PDF:</strong> Download a PDF summary for permit applications.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Share2 className="w-4 h-4 mt-0.5" />
                      <span><strong>Share Link:</strong> Copy a direct link to the current occupancy classification.</span>
                    </li>
                  </ul>
                </div>
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
