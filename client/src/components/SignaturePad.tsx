import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface SignaturePadProps {
  auditId: string;
  engineerName: string;
  onSignatureComplete?: () => void;
}

export function SignaturePad({
  auditId,
  engineerName,
  onSignatureComplete,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signMutation = trpc.audit.signAuditLog.useMutation();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw placeholder text
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sign here', canvas.width / 2, canvas.height / 2);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isSigned) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isSigned) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1f2937';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Redraw placeholder text
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sign here', canvas.width / 2, canvas.height / 2);
  };

  const submitSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSubmitting(true);

    try {
      const signatureImage = canvas.toDataURL('image/png');

      await signMutation.mutateAsync({
        auditId,
        signatureImage,
      });

      setIsSigned(true);
      onSignatureComplete?.();
    } catch (error) {
      console.error('Failed to sign audit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Digital Signature</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Professional Signature</p>
              <p className="text-sm text-blue-700 mt-1">
                By signing, you certify that you have reviewed this compliance analysis and
                agree with the findings. This signature creates a legally defensible audit trail.
              </p>
            </div>
          </div>
        </div>

        {/* Signature Canvas */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Signature</label>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className={`w-full h-40 border-2 border-gray-300 rounded-lg cursor-crosshair ${
              isSigned ? 'bg-gray-50 cursor-default' : 'bg-white'
            }`}
          />
        </div>

        {/* Engineer Info */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium text-muted-foreground">Signing as</p>
          <p className="font-medium mt-1">{engineerName}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Timestamp: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Status Message */}
        {isSigned && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Signature Accepted</p>
                <p className="text-xs text-green-700 mt-1">
                  Your digital signature has been recorded and verified.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isSigned && (
            <>
              <Button
                variant="outline"
                onClick={clearSignature}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button
                onClick={submitSignature}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Signing...' : 'Sign & Submit'}
              </Button>
            </>
          )}
          {isSigned && (
            <Button disabled className="w-full">
              <Check className="w-4 h-4 mr-2" />
              Signature Complete
            </Button>
          )}
        </div>

        {/* Legal Notice */}
        <p className="text-xs text-muted-foreground text-center">
          This digital signature is legally binding and creates an immutable audit trail
          for regulatory compliance.
        </p>
      </CardContent>
    </Card>
  );
}
