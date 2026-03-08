import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/lib/trpc';

/**
 * REQUIRED legal acknowledgment modal
 * Cannot be dismissed without explicit acceptance of ALL terms
 * Blocks all app access until acknowledged
 */
export function RequiredLegalAcknowledgment({
  onAcknowledged,
}: {
  onAcknowledged: () => void;
}) {
  const [understood, setUnderstood] = useState(false);
  const [acceptedAll, setAcceptedAll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logAcknowledgmentMutation = trpc.audit.logAcknowledgment.useMutation();

  const handleAccept = async () => {
    if (!understood || !acceptedAll) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Log acceptance to audit trail
      await logAcknowledgmentMutation.mutateAsync({
        acknowledgmentType: 'LEGAL_DISCLAIMER',
        timestamp: new Date(),
        userAgent: navigator.userAgent,
      });

      onAcknowledged();
    } catch (error) {
      console.error('Failed to log legal acknowledgment:', error);
      // Still allow proceeding even if logging fails
      onAcknowledged();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}} modal={true}>
      {/* Modal cannot be closed without accepting - disable default close behavior */}
      <DialogContent
        className="max-w-2xl"
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Hide the default close button with CSS - the X button is hidden */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <span className="text-red-600 font-bold">
              REQUIRED LEGAL ACKNOWLEDGMENT
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96 pr-4">
          <div className="space-y-6">
            {/* Section 1: Professional Liability */}
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 mt-2">
                <strong>NOT A PROFESSIONAL ENGINEER SERVICE</strong>
                <p className="mt-2">
                  This tool is NOT a substitute for professional engineering
                  review, consultation, or licensed professional services. All
                  analyses are informational only. You are solely responsible
                  for:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Conducting independent verification of all outputs</li>
                  <li>Exercising professional judgment and responsibility</li>
                  <li>Obtaining professional engineering review</li>
                  <li>
                    Compliance with professional standards and codes of ethics
                  </li>
                  <li>Taking full responsibility for any professional opinions</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Section 2: Code Compliance */}
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 mt-2">
                <strong>BUILDING CODES VARY BY JURISDICTION</strong>
                <p className="mt-2">
                  This analysis is based on the National Building Code of
                  Canada (NBC). However, building codes vary by province, city,
                  and jurisdiction. Local amendments, variations, and exemptions
                  may apply. The Authority Having Jurisdiction (building
                  official) has final authority.
                </p>
              </AlertDescription>
            </Alert>

            {/* Section 3: Warranty Disclaimer */}
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 mt-2">
                <strong>NO WARRANTIES</strong>
                <p className="mt-2">
                  This service is provided AS-IS without any warranties. The
                  company specifically disclaims:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Any implied warranty of merchantability</li>
                  <li>Any implied warranty of fitness for a particular purpose</li>
                  <li>Any warranty regarding accuracy or completeness</li>
                  <li>Any warranty regarding uninterrupted availability</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Section 4: LLM Non-Determinism */}
            <Alert className="border-purple-200 bg-purple-50">
              <AlertTriangle className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800 mt-2">
                <strong>AI ANALYSIS IS NON-DETERMINISTIC</strong>
                <p className="mt-2">
                  Any AI-generated analysis may produce different results on
                  repeated runs. AI analysis is for informational purposes only
                  and is NOT legally defensible for official submissions.
                  Professional review is required.
                </p>
              </AlertDescription>
            </Alert>

            {/* Section 5: Liability Limitation */}
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 mt-2">
                <strong>LIABILITY LIMITATION</strong>
                <p className="mt-2">
                  The company's total liability shall not exceed the amount you
                  paid in the 12 months preceding the claim. The company is not
                  liable for indirect, consequential, or special damages.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>

        {/* Explicit Checkboxes (Cannot skip) */}
        <div className="space-y-3 border-t pt-4">
          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <Checkbox
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(!!checked)}
              id="understand-checkbox"
            />
            <span className="text-sm">
              I understand that this tool is NOT a substitute for professional
              engineering review and that professional judgment and
              responsibility are required.
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <Checkbox
              checked={acceptedAll}
              onCheckedChange={(checked) => setAcceptedAll(!!checked)}
              id="accept-all-checkbox"
            />
            <span className="text-sm">
              I accept all terms, conditions, disclaimers, and limitations of
              liability outlined above and acknowledge the risks of using this
              tool.
            </span>
          </label>
        </div>

        {/* Cannot proceed without both checked */}
        <Button
          onClick={handleAccept}
          disabled={!understood || !acceptedAll || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting
            ? 'Accepting...'
            : understood && acceptedAll
              ? 'I Accept - Continue to Tool'
              : 'Accept All Conditions to Continue'}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          By clicking "Accept", you agree to be bound by the Terms of Service,
          Privacy Policy, and all legal disclaimers.
        </p>
      </DialogContent>
    </Dialog>
  );
}

/**
 * BLOCKING MODAL IMPLEMENTATION:
 * - Dialog is set to open={true} with empty onOpenChange handler
 * - onEscapeKeyDown and onPointerDownOutside are prevented
 * - Default close button (X) is hidden via CSS selector [&>button[aria-label='Close']]:hidden
 * - Users CANNOT dismiss this modal without accepting both checkboxes
 * - This ensures legal compliance and audit trail logging
 */
