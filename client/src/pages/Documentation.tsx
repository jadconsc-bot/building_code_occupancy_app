/**
 * Documentation Page
 * User guide, tutorials, and help articles for the Building Code Occupancy Classifier
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Book, FileText, HelpCircle, Video, ArrowLeft, 
  Building2, Calculator, Shield, ClipboardList, Users, 
  BarChart3, Share2, Zap, ChevronRight, ExternalLink,
  BookOpen, Lightbulb, AlertTriangle
} from "lucide-react";
import { useLocation } from "wouter";

interface DocArticle {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

const articles: DocArticle[] = [
  {
    id: "getting-started",
    title: "Getting Started with CodeComply",
    category: "Getting Started",
    description: "Learn the basics of the Building Code Occupancy Classifier and how to navigate the application.",
    content: `## Getting Started with CodeComply

Welcome to the Building Code Occupancy Classifier! This guide will help you get started with the application.

### Overview
CodeComply is a professional tool for building code compliance analysis based on the National Building Code of Canada (NBC 2025). It provides:

- **Occupancy Classification**: Search and classify building occupancy types
- **Professional Calculators**: 34+ specialized calculators for structural, plumbing, electrical, and accessibility calculations
- **Project Management**: Create and manage building projects with compliance tracking
- **Rule Management**: Professional rule editor with audit trails and digital signatures
- **Compliance Analysis**: Verify building plans against NBC 2025 requirements

### First Steps
1. Navigate to the **Occupancy Classifier** to search for building types
2. Create a **Project** to track your compliance requirements
3. Use the **Calculators** for specific code calculations
4. Review the **Terms of Service** for important legal disclaimers`,
    tags: ["basics", "overview", "navigation"],
    difficulty: "beginner"
  },
  {
    id: "occupancy-classification",
    title: "Understanding Occupancy Classification",
    category: "Core Features",
    description: "Learn how to use the occupancy classification system based on NBC 2025 standards.",
    content: `## Understanding Occupancy Classification

The Occupancy Classifier is the core feature of CodeComply. It helps you identify the correct occupancy group for any building type.

### How to Use
1. Navigate to the **Occupancy Classifier** page
2. Use the search bar to find building types (e.g., "restaurant", "hospital", "warehouse")
3. Click on a result to view detailed classification information
4. Review the occupancy group code, description, and applicable requirements

### Occupancy Groups
The NBC classifies buildings into major groups:
- **Group A**: Assembly occupancies (theatres, restaurants, arenas)
- **Group B**: Care, treatment, or detention occupancies (hospitals, prisons)
- **Group C**: Residential occupancies (houses, apartments)
- **Group D**: Business and personal services (offices, banks)
- **Group E**: Mercantile occupancies (shops, department stores)
- **Group F**: Industrial occupancies (factories, warehouses)

### Tips
- Use voice search for hands-free operation
- Bookmark frequently used classifications
- Check the Building, Plumbing, Electrical, and Additions tabs for related requirements`,
    tags: ["occupancy", "classification", "NBC", "building types"],
    difficulty: "beginner"
  },
  {
    id: "project-management",
    title: "Project Management Guide",
    category: "Core Features",
    description: "Create and manage building projects, track compliance requirements, and collaborate with team members.",
    content: `## Project Management Guide

The Project Management feature allows you to create, track, and manage building projects with full compliance tracking.

### Creating a Project
1. Navigate to **Projects** from the main navigation
2. Click **New Project**
3. Fill in project details: name, address, occupancy code, and notes
4. Click **Create** to save your project

### Project Checklists
Each project includes inspection checklists that help track compliance:
- View checklist items by phase
- Mark items as complete, pending, or failed
- Add notes to individual checklist items
- Filter and search through checklist items

### Project Sharing
Share projects with reviewers and clients:
- Create share links with different access levels (view-only, comment)
- Set expiration dates for share links
- Track link usage and views`,
    tags: ["projects", "checklists", "sharing", "collaboration"],
    difficulty: "intermediate"
  },
  {
    id: "calculators",
    title: "Professional Calculators Guide",
    category: "Tools",
    description: "Learn how to use the 34+ specialized calculators for structural, plumbing, electrical, and accessibility calculations.",
    content: `## Professional Calculators Guide

CodeComply includes 34+ specialized calculators organized by discipline.

### Calculator Categories

**Building Calculators**
- Occupant Load Calculator
- Fire Separation Distance
- Egress Width Calculator
- Construction Type Limits
- Height & Area Limits

**Plumbing Calculators**
- Fixture Unit Calculator
- Wet Venting Diagram
- Gas Line Calculator
- Drain Size Calculator

**Electrical Calculators**
- Service Load Calculator
- Voltage Drop Calculator
- Conduit Fill Calculator
- Circuit Sizing

**Accessibility Calculators**
- Barrier-Free Washroom Layout
- Grab Bar Placement
- Ramp Slope Calculator

### Calculation History
All calculations are cryptographically signed and stored with immutable audit trails. View your calculation history from the **Calculation History** page.

### Exporting Results
- Print individual calculations
- Export to PDF for professional reports
- Share verification links with authorities`,
    tags: ["calculators", "tools", "plumbing", "electrical", "structural"],
    difficulty: "intermediate"
  },
  {
    id: "rule-management",
    title: "Rule Management & Governance",
    category: "Administration",
    description: "Submit, review, and manage building code rule changes with full audit trails and digital signatures.",
    content: `## Rule Management & Governance

The Rule Management system provides professional-grade governance for building code rules.

### Features
- **Submit Changes**: Propose rule modifications with justification
- **Approval Workflow**: Multi-level admin review and authorization
- **Digital Signatures**: Cryptographic signatures for all changes
- **Audit Trail**: Complete, immutable history of all modifications

### Submitting a Rule Change
1. Navigate to **Rule Management**
2. Click the **Submit Changes** tab
3. Select the rule category and specific rule
4. Provide your proposed change and justification
5. Submit for admin review

### Admin Approval
Administrators can review pending changes, approve or reject them, and add comments. All actions are recorded in the audit trail.

### Important Notes
- Only authorized users can submit rule changes
- All changes require admin approval before taking effect
- The audit trail is immutable and cannot be modified`,
    tags: ["rules", "governance", "admin", "audit trail"],
    difficulty: "advanced"
  },
  {
    id: "compliance-checker",
    title: "Compliance Checker Guide",
    category: "Core Features",
    description: "Verify building plans against NBC 2025 requirements and identify code infractions.",
    content: `## Compliance Checker Guide

The Compliance Checker analyzes building parameters against NBC 2025 requirements.

### How to Use
1. Select a project from your project list
2. Navigate to the **Compliance** section
3. The analyzer will evaluate your project against applicable code requirements
4. Review identified infractions and recommendations

### Analysis Features
- **Scenario Comparison**: Compare different design scenarios side-by-side
- **Compliance Pathway Report**: Get a detailed pathway to full compliance
- **Snapshot Viewer**: View historical compliance snapshots

### Understanding Results
- **Compliant**: Meets all applicable code requirements
- **Non-Compliant**: One or more requirements not met (review recommendations)
- **Needs Review**: Requires professional judgment for final determination

### Important Disclaimer
All compliance results must be reviewed by a qualified professional (P.Eng, OAA, RAIC) before implementation.`,
    tags: ["compliance", "analysis", "NBC", "infractions"],
    difficulty: "intermediate"
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts & Voice Commands",
    category: "Tips & Tricks",
    description: "Speed up your workflow with keyboard shortcuts and voice commands.",
    content: `## Keyboard Shortcuts & Voice Commands

### Voice Commands
The Occupancy Classifier supports voice search:
- Say **"Residential Plumbing"** to jump to plumbing requirements for residential
- Say **"Office Electrical"** to view electrical requirements for offices
- Say **"Deck Additions"** to view deck/addition requirements
- Synonyms work too: "wiring" → Electrical, "drainage" → Plumbing

### Navigation Tips
- Use the **Tools** dropdown in the navigation bar for quick access to calculators
- Bookmark frequently used occupancy classifications
- Use the search bar on any page to filter content
- Share direct links to specific occupancy codes via URL hash`,
    tags: ["shortcuts", "voice", "tips", "navigation"],
    difficulty: "beginner"
  },
  {
    id: "verification-portal",
    title: "Verification Portal Guide",
    category: "Tools",
    description: "Learn how to verify the authenticity and integrity of calculations using verification codes.",
    content: `## Verification Portal Guide

The Verification Portal allows anyone to verify the authenticity of CodeComply calculations.

### How Verification Works
1. Each calculation generates a unique verification code
2. Share this code with authorities, clients, or reviewers
3. They can enter the code at the **Verification Portal** to confirm:
   - The calculation was performed on a specific date
   - The inputs and results have not been tampered with
   - The calculation was signed by a specific professional

### Creating Verification Links
1. Go to **Sharing** → **Public Verification Portal**
2. Click **Create Verification Link**
3. Share the generated link or code

### Security Features
- **Digital Signature**: Cryptographic proof of authorship
- **Timestamp Authority**: Trusted timestamp proving when the calculation was made
- **Integrity Verification**: Hash-based detection of any modifications`,
    tags: ["verification", "security", "integrity", "sharing"],
    difficulty: "intermediate"
  }
];

const categoryIcons: Record<string, React.ReactNode> = {
  "Getting Started": <BookOpen className="w-5 h-5" />,
  "Core Features": <Building2 className="w-5 h-5" />,
  "Tools": <Calculator className="w-5 h-5" />,
  "Administration": <Shield className="w-5 h-5" />,
  "Tips & Tricks": <Lightbulb className="w-5 h-5" />,
};

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 border-green-200",
  intermediate: "bg-amber-100 text-amber-800 border-amber-200",
  advanced: "bg-red-100 text-red-800 border-red-200",
};

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<DocArticle | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [, navigate] = useLocation();

  const categories = ["all", ...Array.from(new Set(articles.map(a => a.category)))];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === "all" || article.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedArticle(null)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documentation
          </Button>

          <div className="mb-4 flex items-center gap-3">
            <Badge className={difficultyColors[selectedArticle.difficulty]}>
              {selectedArticle.difficulty}
            </Badge>
            <span className="text-sm text-muted-foreground">{selectedArticle.category}</span>
          </div>

          <Card>
            <CardContent className="p-8 prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {selectedArticle.content.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-2xl font-bold mt-6 mb-4 text-foreground">{line.replace('## ', '')}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-lg font-semibold mt-5 mb-3 text-foreground">{line.replace('### ', '')}</h3>;
                  }
                  if (line.startsWith('- **')) {
                    const match = line.match(/- \*\*(.+?)\*\*:?\s*(.*)/);
                    if (match) {
                      return (
                        <div key={i} className="flex gap-2 ml-4 mb-2">
                          <span className="text-primary mt-1">•</span>
                          <span><strong className="text-foreground">{match[1]}</strong>{match[2] ? `: ${match[2]}` : ''}</span>
                        </div>
                      );
                    }
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <div key={i} className="flex gap-2 ml-4 mb-1">
                        <span className="text-primary mt-1">•</span>
                        <span>{line.replace('- ', '')}</span>
                      </div>
                    );
                  }
                  if (line.match(/^\d+\./)) {
                    return (
                      <div key={i} className="flex gap-2 ml-4 mb-1">
                        <span className="text-primary font-medium">{line.match(/^(\d+\.)/)?.[1]}</span>
                        <span>{line.replace(/^\d+\.\s*/, '')}</span>
                      </div>
                    );
                  }
                  if (line.trim() === '') return <div key={i} className="h-2" />;
                  return <p key={i} className="mb-2 text-muted-foreground">{line}</p>;
                })}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-wrap gap-2">
            {selectedArticle.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Book className="w-8 h-8 text-primary" />
              Documentation
            </h1>
            <p className="text-muted-foreground mt-1">
              User guide, tutorials, and help articles for CodeComply
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-6 mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search documentation..."
            className="pl-9 max-w-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/20" onClick={() => navigate("/occupancy-classifier")}>
            <CardContent className="p-4 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium text-sm">Occupancy Classifier</p>
                <p className="text-xs text-muted-foreground">Search building types</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/20" onClick={() => navigate("/project-checklists")}>
            <CardContent className="p-4 flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium text-sm">Projects</p>
                <p className="text-xs text-muted-foreground">Manage projects</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/20" onClick={() => navigate("/calculation-history")}>
            <CardContent className="p-4 flex items-center gap-3">
              <Calculator className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium text-sm">Calculators</p>
                <p className="text-xs text-muted-foreground">34+ tools</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/20" onClick={() => navigate("/verify")}>
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium text-sm">Verification</p>
                <p className="text-xs text-muted-foreground">Verify calculations</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Articles</TabsTrigger>
            {categories.filter(c => c !== "all").map(cat => (
              <TabsTrigger key={cat} value={cat} className="gap-1.5">
                {categoryIcons[cat]}
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map(article => (
            <Card 
              key={article.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedArticle(article)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={`text-xs ${difficultyColors[article.difficulty]}`}>
                    {article.difficulty}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{article.category}</span>
                </div>
                <CardTitle className="text-base leading-tight">{article.title}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {article.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {article.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No articles found</p>
            <p className="text-sm">Try adjusting your search or category filter</p>
          </div>
        )}

        {/* Disclaimer */}
        <Card className="mt-8 border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm text-amber-800">Professional Disclaimer</p>
              <p className="text-xs text-amber-700 mt-1">
                This documentation is for informational purposes only. All building code compliance 
                analysis must be reviewed by a qualified professional (P.Eng, OAA, RAIC) before 
                implementation. See our <a href="/terms" className="underline">Terms of Service</a> for full details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
