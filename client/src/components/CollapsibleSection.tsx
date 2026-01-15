import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function CollapsibleSection({ 
  title, 
  children, 
  defaultExpanded = false,
  className = ''
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`collapsible-section ${className}`}>
      <button
        className="collapsible-header w-full"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title}`}
      >
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          {title}
        </h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      <div className={`collapsible-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
