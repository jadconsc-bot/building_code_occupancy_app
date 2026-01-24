import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  Info, 
  ExternalLink,
  ChevronRight,
  ArrowRight,
  BookOpen,
  Shield,
  Link2,
  ClipboardCheck
} from "lucide-react";

/**
 * 5 C's PRINCIPLE COMPONENTS
 * 
 * These components implement the 5 C's of building code communication:
 * 1. COMPLIANCE - Clear status indicators and code references
 * 2. CLARIFICATION - Plain-language explanations and help
 * 3. CULTURE - Regional/local adaptations and acknowledgments
 * 4. CONNECTION - Links between related requirements
 * 5. CHECKBACK - Confirmation and verification prompts
 */

// ============================================
// 1. COMPLIANCE COMPONENTS
// ============================================

export type ComplianceStatus = "compliant" | "non-compliant" | "warning" | "pending" | "not-applicable";

interface ComplianceBadgeProps {
  status: ComplianceStatus;
  label?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

/**
 * ComplianceBadge - Displays clear compliance status
 * Implements the COMPLIANCE principle with consistent visual indicators
 */
export function ComplianceBadge({ status, label, size = "md", showIcon = true }: ComplianceBadgeProps) {
  const config = {
    compliant: {
      icon: CheckCircle2,
      text: label || "Compliant",
      className: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700"
    },
    "non-compliant": {
      icon: XCircle,
      text: label || "Non-Compliant",
      className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-100 dark:border-red-700"
    },
    warning: {
      icon: AlertTriangle,
      text: label || "Review Required",
      className: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-700"
    },
    pending: {
      icon: HelpCircle,
      text: label || "Pending Review",
      className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
    },
    "not-applicable": {
      icon: Info,
      text: label || "N/A",
      className: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600"
    }
  };

  const { icon: Icon, text, className } = config[status];
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  return (
    <Badge variant="outline" className={`${className} ${sizeClasses[size]} font-medium flex items-center gap-1.5`}>
      {showIcon && <Icon className={size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"} />}
      {text}
    </Badge>
  );
}

interface CodeReferenceProps {
  code: string;
  title?: string;
  description?: string;
  url?: string;
}

/**
 * CodeReference - Links to specific NBC articles
 * Implements COMPLIANCE by providing traceable code references
 */
export function CodeReference({ code, title, description, url }: CodeReferenceProps) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
      <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-blue-700 dark:text-blue-300">{code}</span>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        {title && <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{title}</p>}
        {description && <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

interface ComplianceSummaryProps {
  items: Array<{
    category: string;
    status: ComplianceStatus;
    details?: string;
    codeRef?: string;
  }>;
  title?: string;
}

/**
 * ComplianceSummary - Aggregates multiple compliance checks
 * Implements COMPLIANCE with a comprehensive overview
 */
export function ComplianceSummary({ items, title = "Compliance Summary" }: ComplianceSummaryProps) {
  const compliantCount = items.filter(i => i.status === "compliant").length;
  const nonCompliantCount = items.filter(i => i.status === "non-compliant").length;
  const warningCount = items.filter(i => i.status === "warning").length;
  
  const overallStatus: ComplianceStatus = 
    nonCompliantCount > 0 ? "non-compliant" : 
    warningCount > 0 ? "warning" : 
    compliantCount === items.length ? "compliant" : "pending";

  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {title}
          </CardTitle>
          <ComplianceBadge status={overallStatus} size="lg" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4 text-sm">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-4 h-4" /> {compliantCount} Compliant
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="w-4 h-4" /> {nonCompliantCount} Non-Compliant
          </span>
          <span className="flex items-center gap-1 text-yellow-600">
            <AlertTriangle className="w-4 h-4" /> {warningCount} Warnings
          </span>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <div className="flex-1">
                <span className="font-medium text-sm">{item.category}</span>
                {item.codeRef && (
                  <span className="ml-2 text-xs text-muted-foreground font-mono">({item.codeRef})</span>
                )}
                {item.details && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.details}</p>
                )}
              </div>
              <ComplianceBadge status={item.status} size="sm" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 2. CLARIFICATION COMPONENTS
// ============================================

interface ClarificationPanelProps {
  title: string;
  children: React.ReactNode;
  learnMoreUrl?: string;
  importance?: "low" | "medium" | "high" | "critical";
}

/**
 * ClarificationPanel - Expandable explanation sections
 * Implements CLARIFICATION with plain-language explanations
 */
export function ClarificationPanel({ title, children, learnMoreUrl, importance = "medium" }: ClarificationPanelProps) {
  const importanceColors = {
    low: "border-gray-200 dark:border-gray-700",
    medium: "border-blue-200 dark:border-blue-800",
    high: "border-yellow-200 dark:border-yellow-800",
    critical: "border-red-200 dark:border-red-800"
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="clarification" className={`border rounded-lg ${importanceColors[importance]}`}>
        <AccordionTrigger className="px-4 py-2 hover:no-underline">
          <div className="flex items-center gap-2 text-sm">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{title}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="text-sm text-muted-foreground space-y-2">
            {children}
          </div>
          {learnMoreUrl && (
            <a 
              href={learnMoreUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
            >
              Learn more <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

interface WhyImportantProps {
  reason: string;
  consequences?: string;
  example?: string;
}

/**
 * WhyImportant - Explains the importance of a requirement
 * Implements CLARIFICATION by providing context
 */
export function WhyImportant({ reason, consequences, example }: WhyImportantProps) {
  return (
    <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">Why is this important?</AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm space-y-2">
        <p>{reason}</p>
        {consequences && (
          <p className="text-xs"><strong>If not followed:</strong> {consequences}</p>
        )}
        {example && (
          <p className="text-xs italic"><strong>Example:</strong> {example}</p>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface ContextualHelpProps {
  term: string;
  definition: string;
  relatedTerms?: string[];
}

/**
 * ContextualHelp - Inline help for technical terms
 * Implements CLARIFICATION with tooltips and definitions
 */
export function ContextualHelp({ term, definition, relatedTerms }: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800 underline decoration-dotted underline-offset-2 cursor-help"
      >
        {term}
        <HelpCircle className="w-3 h-3" />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-white dark:bg-gray-900 rounded-lg shadow-lg border z-50">
          <p className="font-semibold text-sm mb-1">{term}</p>
          <p className="text-xs text-muted-foreground">{definition}</p>
          {relatedTerms && relatedTerms.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Related:</strong> {relatedTerms.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}
    </span>
  );
}

// ============================================
// 3. CULTURE COMPONENTS
// ============================================

interface RegionalNoteProps {
  region: string;
  note: string;
  effectiveDate?: string;
}

/**
 * RegionalNote - Highlights regional/local variations
 * Implements CULTURE by showing local adaptations
 */
export function RegionalNote({ region, note, effectiveDate }: RegionalNoteProps) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-md bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
      <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-purple-800 dark:text-purple-200">{region} Specific</p>
        <p className="text-sm text-purple-700 dark:text-purple-300">{note}</p>
        {effectiveDate && (
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Effective: {effectiveDate}</p>
        )}
      </div>
    </div>
  );
}

/**
 * LandAcknowledgment - Indigenous land acknowledgment
 * Implements CULTURE with respect for Indigenous peoples
 */
export function LandAcknowledgment() {
  return (
    <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800">
      <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
        We acknowledge that the land on which we work and build is the traditional territory of many Indigenous peoples. 
        In Alberta, this includes Treaty 6, Treaty 7, and Treaty 8 territories, as well as the Métis Nation of Alberta. 
        We respect the histories, languages, and cultures of First Nations, Métis, and Inuit peoples, and we are committed 
        to building relationships based on mutual respect and understanding.
      </p>
    </div>
  );
}

// ============================================
// 4. CONNECTION COMPONENTS
// ============================================

interface RelatedRequirement {
  title: string;
  codeRef: string;
  description: string;
  link?: string;
}

interface RelatedRequirementsProps {
  requirements: RelatedRequirement[];
  title?: string;
}

/**
 * RelatedRequirements - Links to connected code sections
 * Implements CONNECTION by showing related requirements
 */
export function RelatedRequirements({ requirements, title = "Related Requirements" }: RelatedRequirementsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {requirements.map((req, index) => (
          <div 
            key={index} 
            className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{req.title}</span>
                <span className="text-xs font-mono text-muted-foreground">({req.codeRef})</span>
              </div>
              <p className="text-xs text-muted-foreground">{req.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface SeeAlsoProps {
  items: Array<{
    label: string;
    onClick?: () => void;
  }>;
}

/**
 * SeeAlso - Quick links to related calculators/sections
 * Implements CONNECTION with navigation shortcuts
 */
export function SeeAlso({ items }: SeeAlsoProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground font-medium">See also:</span>
      {items.map((item, index) => (
        <Button
          key={index}
          variant="link"
          size="sm"
          className="h-auto p-0 text-blue-600 hover:text-blue-800"
          onClick={item.onClick}
        >
          {item.label}
          {index < items.length - 1 && <span className="ml-2 text-muted-foreground">•</span>}
        </Button>
      ))}
    </div>
  );
}

// ============================================
// 5. CHECKBACK COMPONENTS
// ============================================

interface CheckbackPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  checkItems: string[];
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * CheckbackPrompt - Confirmation dialog for critical actions
 * Implements CHECKBACK with verification before proceeding
 */
export function CheckbackPrompt({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  checkItems,
  confirmLabel = "I Confirm",
  cancelLabel = "Go Back"
}: CheckbackPromptProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const allChecked = checkedItems.size === checkItems.length;

  const handleToggle = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  const handleConfirm = () => {
    if (allChecked) {
      setCheckedItems(new Set());
      onConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <p className="text-sm font-medium">Please confirm the following:</p>
          {checkItems.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <Checkbox
                id={`check-${index}`}
                checked={checkedItems.has(index)}
                onCheckedChange={() => handleToggle(index)}
              />
              <Label htmlFor={`check-${index}`} className="text-sm leading-relaxed cursor-pointer">
                {item}
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button onClick={handleConfirm} disabled={!allChecked}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CalculatorReviewProps {
  inputs: Array<{
    label: string;
    value: string | number;
    unit?: string;
  }>;
  onEdit: () => void;
  onProceed: () => void;
}

/**
 * CalculatorReview - Summary of inputs before calculation
 * Implements CHECKBACK by allowing users to verify inputs
 */
export function CalculatorReview({ inputs, onEdit, onProceed }: CalculatorReviewProps) {
  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-2 bg-blue-50 dark:bg-blue-950">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4" />
          Review Your Inputs
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2 mb-4">
          {inputs.map((input, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{input.label}:</span>
              <span className="font-medium">
                {input.value} {input.unit && <span className="text-muted-foreground">{input.unit}</span>}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            Edit Inputs
          </Button>
          <Button size="sm" onClick={onProceed} className="flex-1">
            Calculate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface DidYouConsiderProps {
  items: string[];
  onDismiss?: () => void;
}

/**
 * DidYouConsider - Prompts for common oversights
 * Implements CHECKBACK by reminding users of important considerations
 */
export function DidYouConsider({ items, onDismiss }: DidYouConsiderProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
      <HelpCircle className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800 dark:text-blue-200 flex items-center justify-between">
        Did you consider...?
        {onDismiss && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs"
            onClick={() => { setDismissed(true); onDismiss(); }}
          >
            Dismiss
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="text-blue-700 dark:text-blue-300">
        <ul className="list-disc list-inside text-sm space-y-1 mt-2">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
