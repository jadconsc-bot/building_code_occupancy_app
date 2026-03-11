import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { ShareDialog } from './ShareDialog';

interface ShareButtonProps {
  projectId: number;
  projectName: string;
  onShareSuccess?: () => void;
}

export function ShareButton({
  projectId,
  projectName,
  onShareSuccess,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSuccess = () => {
    setIsOpen(false);
    onShareSuccess?.();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      <ShareDialog
        projectId={projectId}
        projectName={projectName}
        isOpen={isOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </>
  );
}
