import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2, AlertCircle } from 'lucide-react';
// Toast notifications handled via browser alerts for now

interface ShareDialogProps {
  projectId: number;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ShareDialog({
  projectId,
  projectName,
  isOpen,
  onClose,
  onSuccess,
}: ShareDialogProps) {
  const showToast = (title: string, description: string, variant?: string) => {
    // Simple notification
    console.log(`[${title}] ${description}`);
    if (variant === 'destructive') {
      alert(`${title}: ${description}`);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // tRPC queries and mutations
  const { data: shares, refetch: refetchShares } =
    trpc.collaboration.listProjectShares.useQuery({ projectId }, { enabled: isOpen });

  const shareProjectMutation = trpc.collaboration.shareProject.useMutation({
    onSuccess: () => {
      showToast('Success', 'Project shared successfully');
      setSearchQuery('');
      setSelectedUserId(null);
      refetchShares();
      onSuccess?.();
    },
    onError: (error) => {
      showToast('Error', error.message || 'Failed to share project', 'destructive');
    },
  });

  const unshareProjectMutation = trpc.collaboration.unshareProject.useMutation({
    onSuccess: () => {
      showToast('Success', 'Access revoked successfully');
      refetchShares();
    },
    onError: (error) => {
      showToast('Error', error.message || 'Failed to revoke access', 'destructive');
    },
  });

  const handleShare = async () => {
    if (!selectedUserId) {
      showToast('Error', 'Please select a user to share with', 'destructive');
      return;
    }

    await shareProjectMutation.mutateAsync({
      projectId,
      sharedWithUserId: selectedUserId,
    });
  };

  const handleRevoke = async (userId: number) => {
    await unshareProjectMutation.mutateAsync({
      projectId,
      sharedWithUserId: userId,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            Share "{projectName}" with team members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Add Collaborator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="user-id" className="text-sm">
                  User ID
                </Label>
                <Input
                  id="user-id"
                  type="number"
                  placeholder="Enter user ID"
                  value={selectedUserId || ''}
                  onChange={(e) =>
                    setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the numeric user ID of the person to share with
                </p>
              </div>

              <Button
                onClick={handleShare}
                disabled={!selectedUserId || shareProjectMutation.isPending}
                className="w-full"
              >
                {shareProjectMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  'Share Project'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Current Shares */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Active Shares</CardTitle>
              <CardDescription className="text-xs">
                {shares?.filter((s) => !s.revokedAt).length || 0} active shares
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shares && shares.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-2 border rounded bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{share.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {share.email}
                        </p>
                        {share.revokedAt ? (
                          <p className="text-xs text-red-600">
                            Revoked:{' '}
                            {new Date(share.revokedAt).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-xs text-green-600">
                            Shared:{' '}
                            {new Date(share.sharedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {!share.revokedAt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(share.userId)}
                          disabled={unshareProjectMutation.isPending}
                          className="ml-2"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  No active shares yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
