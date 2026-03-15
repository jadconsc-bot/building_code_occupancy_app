/**
 * DisclaimerGate Component
 *
 * Non-dismissible modal that blocks access until user accepts legal disclaimer.
 * Logs DISCLAIMER_ACKNOWLEDGED audit event on confirmation.
 *
 * CRITICAL: This component must be rendered BEFORE any drawing upload functionality.
 * User cannot proceed without accepting both checkboxes.
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

interface DisclaimerGateProps {
  onAccepted: () => void;
  disclaimerVersion?: string;
}

const DISCLAIMER_TEXT = `
REQUIRED LEGAL ACKNOWLEDGMENT

NOT A PROFESSIONAL ENGINEER SERVICE

This tool is NOT a substitute for professional engineering review, consultation, or licensed professional services. All analyses are informational only. You are solely responsible for:

• Conducting independent verification of all outputs
• Exercising professional judgment and responsibility
• Obtaining professional engineering review
• Compliance with professional standards and codes of ethics
• Taking full responsibility for any professional opinions

BUILDING CODES VARY BY JURISDICTION

Building codes vary by jurisdiction. Local amendments, provincial regulations, and municipal bylaws may supersede or modify national code requirements. This tool provides analysis based on the base code edition only. Local variations must be independently verified.

NO WARRANTIES

This compliance analysis engine is provided "AS IS" without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.

AI ANALYSIS IS NON-DETERMINISTIC

Results may vary between analyses due to the non-deterministic nature of AI models. Professional verification is required before relying on results for any legal, regulatory, or commercial purpose.

LIABILITY LIMITATION

In no event shall the developers, providers, or operators of this tool be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use of or inability to use the analysis results.

I understand that this tool is NOT a substitute for professional engineering review and that professional judgment and responsibility are required.

I accept all terms, conditions, disclaimers, and limitations of liability outlined above and acknowledge the risks of using this tool.
`;

export function DisclaimerGate({ onAccepted, disclaimerVersion = '1.0' }: DisclaimerGateProps) {
  const { user } = useAuth();
  const [understands, setUnderstands] = useState(false);
  const [accepts, setAccepts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadyAccepted, setIsAlreadyAccepted] = useState(false);

  // Check if user has already accepted disclaimer in this session
  useEffect(() => {
    const sessionKey = `disclaimer_accepted_${user?.id}`;
    const sessionAccepted = sessionStorage.getItem(sessionKey);
    if (sessionAccepted === 'true') {
      setIsAlreadyAccepted(true);
      onAccepted();
    }
  }, [user?.id, onAccepted]);

  const logDisclaimerMutation = trpc.audit.logEvent.useMutation();

  const handleProceed = async () => {
    if (!understands || !accepts) {
      setError('You must check both boxes to proceed');
      return;
    }

    if (!user) {
      setError('User authentication required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get request context
      const ipAddress = '0.0.0.0'; // Will be overridden by server
      const userAgent = navigator.userAgent;
      const sessionId = sessionStorage.getItem('sessionId') || `session_${Date.now()}`;

      // Log DISCLAIMER_ACKNOWLEDGED audit event
      await logDisclaimerMutation.mutateAsync({
        analysisId: 0, // Placeholder - will be set when analysis is created
        userId: user.id,
        action: 'DISCLAIMER_ACKNOWLEDGED',
        userEmail: user.email || '',
        userFullName: user.name || '',
        details: {
          disclaimerVersion,
          timestamp: new Date().toISOString(),
          accepted: true,
        },
        ipAddress,
        userAgent,
        sessionId,
      });

      // Store acceptance in session
      const sessionKey = `disclaimer_accepted_${user.id}`;
      sessionStorage.setItem(sessionKey, 'true');
      sessionStorage.setItem('sessionId', sessionId);

      console.log('[DisclaimerGate] Disclaimer accepted:', {
        userId: user.id,
        version: disclaimerVersion,
        timestamp: new Date().toISOString(),
      });

      onAccepted();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log disclaimer acceptance';
      console.error('[DisclaimerGate] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // If already accepted in this session, don't render
  if (isAlreadyAccepted) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-red-300 bg-red-50">
        <CardHeader className="border-b border-red-200 bg-red-100">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <CardTitle className="text-red-900">REQUIRED LEGAL ACKNOWLEDGMENT</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Disclaimer Text */}
          <div className="bg-white p-4 rounded-lg border border-red-200 space-y-4 text-sm whitespace-pre-wrap">
            {DISCLAIMER_TEXT}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Checkboxes */}
          <div className="space-y-4 bg-white p-4 rounded-lg border border-red-200">
            <div className="flex items-start gap-3">
              <Checkbox
                id="understands"
                checked={understands}
                onCheckedChange={(checked) => setUnderstands(checked as boolean)}
                className="mt-1"
              />
              <Label
                htmlFor="understands"
                className="text-sm font-medium leading-relaxed cursor-pointer"
              >
                I understand that this analysis requires review and acceptance by a licensed
                Professional Engineer or Architect before it has any legal validity.
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="accepts"
                checked={accepts}
                onCheckedChange={(checked) => setAccepts(checked as boolean)}
                className="mt-1"
              />
              <Label
                htmlFor="accepts"
                className="text-sm font-medium leading-relaxed cursor-pointer"
              >
                I accept all terms, conditions, disclaimers, and limitations of liability outlined
                above and acknowledge the risks of using this tool.
              </Label>
            </div>
          </div>

          {/* Proceed Button */}
          <Button
            onClick={handleProceed}
            disabled={!understands || !accepts || isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                I Accept - Proceed to Upload
              </>
            )}
          </Button>

          {/* Info Text */}
          <p className="text-xs text-gray-600 text-center">
            This modal cannot be dismissed. You must accept the terms to proceed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
