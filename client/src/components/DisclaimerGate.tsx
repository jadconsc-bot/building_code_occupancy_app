/**
 * DisclaimerGate Component
 *
 * PD2.0 §6.3 — Disclaimer must be acknowledged before any drawing analysis.
 * This component blocks access to the analysis tool until the user explicitly
 * acknowledges the disclaimer. The acknowledgment is stored server-side via
 * trpc.drawingAnalysis.acknowledgeDisclaimer.
 *
 * The disclaimer version is tracked so users are re-prompted if the disclaimer
 * text changes (CURRENT_DISCLAIMER_VERSION bump on server).
 */

import { useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

interface DisclaimerGateProps {
  onAcknowledged: (disclaimerVersion: string) => void;
}

export function DisclaimerGate({ onAcknowledged }: DisclaimerGateProps) {
  const [checked, setChecked] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const { data: disclaimerData, isLoading } = trpc.drawingAnalysis.getDisclaimer.useQuery();

  const acknowledgeMutation = trpc.drawingAnalysis.acknowledgeDisclaimer.useMutation({
    onSuccess: (data) => {
      onAcknowledged(data.disclaimerVersion);
    },
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
    if (atBottom) setScrolledToBottom(true);
  };

  const handleAcknowledge = () => {
    if (!disclaimerData || !checked) return;
    acknowledgeMutation.mutate({ disclaimerVersion: disclaimerData.version });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Shield className="w-5 h-5 mr-2 animate-pulse" />
        Loading disclaimer...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div>
          <h2 className="font-semibold text-amber-900 dark:text-amber-100 text-base">
            Important Disclaimer — Read Before Proceeding
          </h2>
          <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
            This tool uses AI to extract data from drawings. All results require professional review.
            You must read and acknowledge the full disclaimer before using this feature.
          </p>
        </div>
      </div>

      {/* Disclaimer Text */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Disclaimer v{disclaimerData?.version}
          </span>
          {!scrolledToBottom && (
            <span className="ml-auto text-xs text-muted-foreground animate-pulse">
              ↓ Scroll to read all
            </span>
          )}
          {scrolledToBottom && (
            <span className="ml-auto text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Read
            </span>
          )}
        </div>
        <ScrollArea
          className="h-64 p-4"
          onScrollCapture={handleScroll}
        >
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {disclaimerData?.text}
          </pre>
        </ScrollArea>
      </div>

      {/* Acknowledgment Checkbox */}
      <div className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
        checked
          ? "border-green-500 bg-green-50 dark:bg-green-950/30"
          : "border-border bg-background"
      }`}>
        <Checkbox
          id="disclaimer-ack"
          checked={checked}
          onCheckedChange={(v) => setChecked(!!v)}
          disabled={!scrolledToBottom}
          className="mt-0.5"
        />
        <Label
          htmlFor="disclaimer-ack"
          className={`text-sm leading-relaxed cursor-pointer ${
            !scrolledToBottom ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          I have read and understood the full disclaimer. I acknowledge that this tool is for
          informational purposes only and that all results must be reviewed by a licensed
          professional engineer or registered architect before any regulatory use.
        </Label>
      </div>

      {!scrolledToBottom && (
        <p className="text-xs text-muted-foreground text-center">
          Please scroll through the entire disclaimer before acknowledging.
        </p>
      )}

      {/* Acknowledge Button */}
      <Button
        onClick={handleAcknowledge}
        disabled={!checked || !scrolledToBottom || acknowledgeMutation.isPending}
        className="w-full"
        size="lg"
      >
        {acknowledgeMutation.isPending ? (
          "Recording acknowledgment..."
        ) : (
          <>
            <Shield className="w-4 h-4 mr-2" />
            I Acknowledge — Proceed to Drawing Analysis
          </>
        )}
      </Button>

      {acknowledgeMutation.isError && (
        <p className="text-sm text-destructive text-center">
          Failed to record acknowledgment. Please try again.
        </p>
      )}
    </div>
  );
}
