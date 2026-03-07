import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface SignaturePadProps {
  projectId: number;
  auditLogId: string;
  signatureType: "approval" | "review" | "verification" | "acknowledgment";
  onSignatureCreated?: (signatureId: string) => void;
}

export function SignaturePad({
  projectId,
  auditLogId,
  signatureType,
  onSignatureCreated,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create signature mutation
  const { mutate: createSignature } = trpc.audit.createSignature.useMutation({
    onSuccess: (data) => {
      setIsSubmitting(false);
      if (data.success && onSignatureCreated) {
        onSignatureCreated(data.signatureId);
      }
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
      setHasSignature(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
      }
    }
    setHasSignature(false);
    setSignatureData("");
  };

  const submitSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    setIsSubmitting(true);
    const signature = canvas.toDataURL("image/png");
    setSignatureData(signature);

    createSignature({
      auditLogId,
      projectId,
      signatureType,
      signature,
      signatureAlgorithm: "Canvas-SHA256",
    });
  };

  const getSignatureTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      approval: "Approval Signature",
      review: "Review Signature",
      verification: "Verification Signature",
      acknowledgment: "Acknowledgment Signature",
    };
    return labels[type] || type;
  };

  const getSignatureTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      approval: "bg-green-50 border-green-200",
      review: "bg-blue-50 border-blue-200",
      verification: "bg-purple-50 border-purple-200",
      acknowledgment: "bg-yellow-50 border-yellow-200",
    };
    return colors[type] || "bg-gray-50 border-gray-200";
  };

  return (
    <Card className={getSignatureTypeColor(signatureType)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{getSignatureTypeLabel(signatureType)}</CardTitle>
          <Badge variant="outline">{signatureType}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signature Canvas */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full cursor-crosshair"
          />
        </div>

        {/* Instructions */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Draw your signature in the box above. This will be cryptographically signed and stored
            as a legal record.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={!hasSignature || isSubmitting}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button
            size="sm"
            onClick={submitSignature}
            disabled={!hasSignature || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Sign & Submit
              </>
            )}
          </Button>
        </div>

        {/* Signature Info */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
          <p className="font-medium text-gray-900 mb-2">Signature Details:</p>
          <ul className="space-y-1 text-gray-600 text-xs">
            <li>• Type: {signatureType}</li>
            <li>• Project ID: {projectId}</li>
            <li>• Timestamp: {new Date().toLocaleString()}</li>
            <li>• Algorithm: Canvas-SHA256</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
