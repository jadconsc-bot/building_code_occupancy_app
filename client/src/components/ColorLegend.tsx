import { useState } from "react";
import { ChevronDown, ChevronUp, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ColorLegend() {
  const [isExpanded, setIsExpanded] = useState(false);

  const colorCategories = [
    { name: "Building Code", color: "var(--tab-building)", textColor: "text-white" },
    { name: "Plumbing", color: "var(--tab-plumbing)", textColor: "text-white" },
    { name: "Electrical", color: "var(--tab-electrical)", textColor: "text-gray-900" },
    { name: "Additions", color: "var(--tab-additions)", textColor: "text-white" },
    { name: "Sustainability", color: "var(--tab-sustainability)", textColor: "text-white" },
    { name: "Fire & Life Safety", color: "var(--tab-fire)", textColor: "text-white" },
    { name: "Design Tools", color: "var(--tab-design)", textColor: "text-white" },
  ];

  return (
    <div className="fixed top-20 right-4 z-40 bg-card border-2 border-border rounded-lg shadow-xl overflow-hidden transition-all duration-300">
      {/* Toggle Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="ghost"
        size="sm"
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted"
      >
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">Color Guide</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {/* Legend Content */}
      {isExpanded && (
        <div className="p-3 pt-0 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-xs text-muted-foreground mb-2 border-t border-border pt-2">
            Calculator Categories
          </div>
          {colorCategories.map((category) => (
            <div
              key={category.name}
              className="flex items-center gap-2 text-xs"
            >
              <div
                className={`w-8 h-6 rounded flex items-center justify-center font-bold ${category.textColor}`}
                style={{ backgroundColor: category.color }}
              >
                {category.name.charAt(0)}
              </div>
              <span className="font-medium">{category.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
