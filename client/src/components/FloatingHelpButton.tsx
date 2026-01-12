import { HelpCircle } from "lucide-react";
import { useHelpSystem } from "@/contexts/HelpSystemContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function FloatingHelpButton() {
  const { openHelp } = useHelpSystem();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => openHelp()}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group animate-in fade-in slide-in-from-bottom-4"
            style={{ 
              backgroundColor: 'var(--construction-header)',
              color: 'white'
            }}
            aria-label="Open Help"
          >
            <HelpCircle className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-sm">
          <p className="font-semibold">Help & Documentation</p>
          <p className="text-xs text-muted-foreground mt-1">Press Ctrl+/ or click here</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
