import { useState } from "react";
import { useCalculationHistory, CalculationHistoryItem } from "@/contexts/CalculationHistoryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Trash2, RotateCcw, X, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface HistoryPanelProps {
  calculatorType: string;
  onLoadHistory: (item: CalculationHistoryItem) => void;
}

export function HistoryPanel({ calculatorType, onLoadHistory }: HistoryPanelProps) {
  const { getHistoryByType, deleteFromHistory, clearHistory } = useCalculationHistory();
  const [isOpen, setIsOpen] = useState(false);
  
  const historyItems = getHistoryByType(calculatorType);

  if (historyItems.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <History className="w-4 h-4" />
        History ({historyItems.length})
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 max-h-[500px] overflow-hidden z-50 shadow-lg border-2">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="w-4 h-4" />
              Calculation History
            </CardTitle>
            <div className="flex items-center gap-2">
              {historyItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Clear all history for this calculator?`)) {
                      clearHistory(calculatorType);
                    }
                  }}
                  className="h-7 px-2 text-xs"
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[400px] overflow-y-auto">
            {historyItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No calculation history yet
              </div>
            ) : (
              <div className="divide-y">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.preview}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onLoadHistory(item);
                            setIsOpen(false);
                          }}
                          className="h-7 px-2 text-xs gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFromHistory(item.id)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
