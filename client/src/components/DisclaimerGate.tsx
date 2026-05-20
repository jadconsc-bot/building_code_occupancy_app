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

import { useState, useRef, useEffect } from "react";
import { AlertTriangle, CheckCircle2, FileText, Shield, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

interface DisclaimerGateProps {
  onAcknowledged: (disclaimerVersion: string) => void;
}

export function DisclaimerGate({ onAcknowledged }: DisclaimerGateProps) {
  const [checked, setChecked] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [formMounted, setFormMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: disclaimerData, isLoading, isError, refetch } = trpc.drawingAnalysis.getDisclaimer.useQuery();

  const acknowledgeMutation = trpc.drawingAnalysis.acknowledgeDisclaimer.useMutation({
    onSuccess: (data) => {
      onAcknowledged(data.disclaimerVersion);
    },
  });

  // Set formMounted once data is loaded so the scroll container ref is available
  useEffect(() => {
    if (disclaimerData && !isLoading) {
      setFormMounted(true);
    }
  }, [disclaimerData, isLoading]);

  // Auto-detect when content doesn't need scrolling
  // Depends on formMounted so it re-fires after the scroll container renders
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight) {
      setScrolledToBottom(true);
    }
  }, [disclaimerData, formMounted]);

  // Improved scroll detection with better threshold
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) {
      setScrolledToBottom(true);
      return;
    }
    const progress = (scrollTop / maxScroll) * 100;
    setScrollProgress(progress);
    const atBottom = progress >= 95 || scrollHeight - (scrollTop + clientHeight) < 10;
    setScrolledToBottom(atBottom);
  };

  const handleAcknowledge = async () => {
    console.log('[Disclaimer] Acknowledge clicked:', { disclaimerData: !!disclaimerData, checked, scrolledToBottom });
    if (!disclaimerData || !checked || !scrolledToBottom) return;
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

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <p className="text-sm text-destructive">Failed to load disclaimer. Please try again.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
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

      {/* Disclaimer Text Container */}
      <div className="border border-border rounded-lg overflow-hidden bg-background">
        {/* Header with scroll indicator */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Disclaimer v{disclaimerData?.version}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {!scrolledToBottom && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {Math.round(scrollProgress)}%
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground animate-bounce" />
              </div>
            )}
            {scrolledToBottom && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Read
              </span>
            )}
          </div>
        </div>

        {/* Scrollable disclaimer text */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-64 overflow-y-auto p-4 bg-background"
        >
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {disclaimerData?.text}
          </pre>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-blue-500 transition-all duration-200"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </div>

      {/* Acknowledgment Checkbox */}
      <div className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
        checked && scrolledToBottom
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
            !scrolledToBottom ? "text-muted-foreground cursor-not-allowed" : "text-foreground"
          }`}
        >
          I have read and understood the full disclaimer. I acknowledge that this tool is for
          informational purposes only and that all results must be reviewed by a licensed
          professional engineer or registered architect before any regulatory use.
        </Label>
      </div>

      {!scrolledToBottom && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-bounce" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Please scroll through the entire disclaimer ({Math.round(scrollProgress)}% complete) before acknowledging.
          </p>
        </div>
      )}

      {/* Acknowledge Button */}
      <Button
        onClick={handleAcknowledge}
        disabled={!checked || !scrolledToBottom || acknowledgeMutation.isPending}
        className="w-full"
        size="lg"
        title={`Button disabled: checked=${checked}, scrolledToBottom=${scrolledToBottom}, isPending=${acknowledgeMutation.isPending}`}
      >
        {acknowledgeMutation.isPending ? (
          <>
            <Shield className="w-4 h-4 mr-2 animate-spin" />
            Recording acknowledgment...
          </>
        ) : (
          <>
            <Shield className="w-4 h-4 mr-2" />
            I Acknowledge — Proceed to Drawing Analysis
          </>
        )}
      </Button>

      {acknowledgeMutation.isError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">
            Failed to record acknowledgment. Please try again.
          </p>
        </div>
      )}

      {acknowledgeMutation.isSuccess && (
        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Acknowledgment recorded successfully!
          </p>
        </div>
      )}
    </div>
  );
}
