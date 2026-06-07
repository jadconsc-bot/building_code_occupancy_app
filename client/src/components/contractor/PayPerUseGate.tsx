import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

const CREDITS_KEY = 'cc_contractor_credits';
const SUB_KEY = 'cc_contractor_sub';
const DEFAULT_FREE_CREDITS = 2;

function readCredits(): number {
  const v = localStorage.getItem(CREDITS_KEY);
  return v !== null ? parseInt(v, 10) : DEFAULT_FREE_CREDITS;
}

function writeCredits(n: number) {
  localStorage.setItem(CREDITS_KEY, String(n));
}

interface PayPerUseGateProps {
  toolName: string;
  children: React.ReactNode;
}

export function PayPerUseGate({ toolName, children }: PayPerUseGateProps) {
  const [credits, setCredits] = useState(readCredits);
  const [subscribed, setSubscribed] = useState(
    () => localStorage.getItem(SUB_KEY) === 'true'
  );
  const [locked, setLocked] = useState(false);

  // Server-side check: contractor pack purchased grants unlimited access
  const { data: contractorStatus } = trpc.subscriptions.getContractorStatus.useQuery(undefined, {
    retry: false,
  });
  const packPurchased = contractorStatus?.packPurchased ?? false;

  const checkoutMutation = trpc.subscriptions.createContractorSession.useMutation({
    onSuccess: (data: { checkoutUrl: string }) => { window.location.href = data.checkoutUrl; },
  });

  useEffect(() => {
    // Consume a credit when the tool mounts (only if not subscribed, no pack, and credits > 0)
    if (subscribed || packPurchased) return;
    const current = readCredits();
    if (current <= 0) {
      setLocked(true);
      return;
    }
    const next = current - 1;
    writeCredits(next);
    setCredits(next);
  // Run once per tool mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolName]);

  if (!packPurchased && (locked || (!subscribed && credits < 0))) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center space-y-4">
        <div className="text-4xl">🔒</div>
        <h2 className="text-xl font-bold">You've used your free calculations</h2>
        <p className="text-muted-foreground text-sm">
          Get unlimited access for $19.99/month or buy a 10-calculation pack for $9.99.
        </p>
        <div className="w-full max-w-xs space-y-3 pt-2">
          <Button
            className="w-full bg-[#1B3A6B] text-white h-12"
            onClick={() => checkoutMutation.mutate({ type: 'subscription' })}
            disabled={checkoutMutation.isPending}
          >
            Subscribe — $19.99/mo
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => checkoutMutation.mutate({ type: 'pack' })}
            disabled={checkoutMutation.isPending}
          >
            Buy 10 calculations — $9.99
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          First 2 calculations free. No signup required.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
