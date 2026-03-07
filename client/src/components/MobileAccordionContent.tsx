import { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface MobileAccordionContentProps {
  actionButtons: ReactNode;
  projectNotes: ReactNode;
  children: ReactNode;
}

export function MobileAccordionContent({
  actionButtons,
  projectNotes,
  children,
}: MobileAccordionContentProps) {
  return (
    <div className="md:hidden">
      <Accordion type="multiple" defaultValue={["content"]} className="w-full">
        {/* Actions Section - Collapsible */}
        <AccordionItem value="actions" className="border-b border-border">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-4 py-3">
            Actions & Tools
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="flex flex-col gap-2">
              {actionButtons}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Project Notes Section - Collapsible */}
        <AccordionItem value="notes" className="border-b border-border">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-4 py-3">
            Project Notes
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {projectNotes}
          </AccordionContent>
        </AccordionItem>

        {/* Main Content - Always Expanded by Default */}
        <AccordionItem value="content" className="border-b-0">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-4 py-3">
            Code Requirements
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {children}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
