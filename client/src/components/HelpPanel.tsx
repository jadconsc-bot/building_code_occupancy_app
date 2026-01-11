import { useState, useEffect } from 'react';
import { useHelpSystem } from '@/contexts/HelpSystemContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Book, Calculator, FileText, HelpCircle, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function HelpPanel() {
  const { isHelpOpen, closeHelp, searchQuery, setSearchQuery, searchHelp, getHelpContent, activeHelpId } = useHelpSystem();
  const [results, setResults] = useState(searchHelp(''));
  const [selectedHelp, setSelectedHelp] = useState<string | null>(null);

  useEffect(() => {
    setResults(searchHelp(searchQuery));
  }, [searchQuery]);

  useEffect(() => {
    if (activeHelpId) {
      setSelectedHelp(activeHelpId);
    }
  }, [activeHelpId]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Calculators':
        return <Calculator className="w-4 h-4" />;
      case 'Features':
        return <FileText className="w-4 h-4" />;
      case 'Occupancy':
        return <Book className="w-4 h-4" />;
      case 'Code Requirements':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return <Book className="w-4 h-4" />;
    }
  };

  const handleSelectHelp = (id: string) => {
    setSelectedHelp(id);
  };

  const handleBack = () => {
    setSelectedHelp(null);
  };

  const selectedContent = selectedHelp ? getHelpContent(selectedHelp) : null;

  return (
    <Sheet open={isHelpOpen} onOpenChange={(open) => !open && closeHelp()}>
      <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Help & Documentation
          </SheetTitle>
          <SheetDescription>
            Search for help topics, calculator guides, and code requirements
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Content Area */}
          <ScrollArea className="h-[calc(100vh-200px)]">
            {selectedContent ? (
              // Detail View
              <div className="space-y-4 pr-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-2"
                >
                  ← Back to results
                </Button>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(selectedContent.category)}
                    <Badge variant="outline">{selectedContent.category}</Badge>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{selectedContent.title}</h3>
                  
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{selectedContent.content}</ReactMarkdown>
                  </div>

                  {selectedContent.relatedTopics && selectedContent.relatedTopics.length > 0 && (
                    <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        Related Topics
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedContent.relatedTopics.map(topicId => {
                          const topic = getHelpContent(topicId);
                          return topic ? (
                            <Button
                              key={topicId}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectHelp(topicId)}
                              className="text-xs"
                            >
                              {topic.title}
                            </Button>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // List View
              <div className="space-y-3 pr-4">
                {results.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No help topics found matching "{searchQuery}"</p>
                    <p className="text-sm mt-2">Try different keywords or browse all topics</p>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground mb-2">
                      {results.length} {results.length === 1 ? 'topic' : 'topics'} found
                    </div>
                    {results.map(help => (
                      <button
                        key={help.id}
                        onClick={() => handleSelectHelp(help.id)}
                        className="w-full text-left p-4 border rounded-lg hover:bg-accent hover:border-primary transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getCategoryIcon(help.category)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{help.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {help.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {help.content.split('\n')[0].replace(/[*#]/g, '')}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {help.keywords.slice(0, 4).map(keyword => (
                                <span
                                  key={keyword}
                                  className="text-xs px-2 py-0.5 bg-muted rounded"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground mt-1" />
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
