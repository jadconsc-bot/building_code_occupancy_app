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
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { CURRENT_DISCLAIMER_VERSION } from '@shared/constants/DISCLAIMER_CONSTANTS';

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

Building codes and regulations vary significantly by jurisdiction. This tool may not reflect all local requirements or recent code updates.

I understand that this tool is NOT a substitute for professional engineering review and that professional judgment and responsibility are required.

I accept all terms, conditions, disclaimers, and limitations of liability outlined above and acknowledge the risks of using this tool.
`;

export function DisclaimerGate({ onAccepted, disclaimerVersion = CURRENT_DISCLAIMER_VERSION }: DisclaimerGateProps) {
  const { user } = useAuth();
  const [understands, setUnderstands] = useState(false);
  const [accepts, setAccepts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadyAccepted, setIsAlreadyAccepted] = useState(false);

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
      // Log disclaimer acknowledgment event
      await logDisclaimerMutation.mutateAsync({
        userId: user.id,
        analysisId: 0, // Placeholder for pre-analysis
        action: 'DISCLAIMER_ACKNOWLEDGED',
        details: {
          disclaimerVersion,
          timestamp: new Date().toISOString(),
        },
        userEmail: user.email || '',
        userFullName: user.name || '',
        ipAddress: '0.0.0.0', // Will be captured server-side
        userAgent: navigator.userAgent,
        sessionId: sessionStorage.getItem('sessionId') || '',
      });

      // Store in session to prevent re-prompting
      sessionStorage.setItem('disclaimerAccepted', 'true');
      sessionStorage.setItem('disclaimerVersion', disclaimerVersion);

      onAccepted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log disclaimer acknowledgment');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if already accepted in this session
  useEffect(() => {
    const sessionAccepted = sessionStorage.getItem('disclaimerAccepted');
    if (sessionAccepted === 'true') {
      setIsAlreadyAccepted(true);
      onAccepted();
    }
  }, [user?.id, onAccepted]);

  if (isAlreadyAccepted) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <CardTitle className="text-red-600">REQUIRED LEGAL ACKNOWLEDGMENT</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Disclaimer Text */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-bold text-red-600 mb-3">NOT A PROFESSIONAL ENGINEER SERVICE</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{DISCLAIMER_TEXT}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="understands"
                checked={understands}
                onCheckedChange={(checked) => setUnderstands(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="understands" className="text-sm cursor-pointer">
                I understand that this tool is NOT a substitute for professional engineering review and that professional judgment and responsibility are required.
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="accepts"
                checked={accepts}
                onCheckedChange={(checked) => setAccepts(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="accepts" className="text-sm cursor-pointer">
                I accept all terms, conditions, disclaimers, and limitations of liability outlined above and acknowledge the risks of using this tool.
              </Label>
            </div>
          </div>

          {/* Proceed Button */}
          <Button
            onClick={handleProceed}
            disabled={!understands || !accepts || isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? 'Processing...' : 'Proceed to Upload'}
          </Button>

          {/* Version Info */}
          <p className="text-xs text-gray-500 text-center">
            Disclaimer Version: {disclaimerVersion}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
