import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function FoundingMemberBanner() {
  const { data } = trpc.subscriptions.getFoundingCounter.useQuery();
  const pct = data ? (data.claimed / data.cap) * 100 : 24.7;

  if (data?.isSoldOut) return null;

  return (
    <div className="bg-gradient-to-r from-[#1B3A6B] to-blue-800
                    text-white rounded-xl p-6 mb-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 8px)",
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-amber-400 text-black text-xs font-bold px-2 py-0.5 rounded">
            FOUNDING MEMBER
          </span>
          <span className="text-blue-200 text-xs">Limited offer</span>
        </div>

        <h3 className="text-xl font-bold mb-1">Lock in $29/month — forever</h3>
        <p className="text-blue-100 text-sm mb-4">
          Full Pro access + 10 Home reports included. Price locks permanently. Regular price $49/month.
        </p>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-blue-200 mb-1">
            <span>{data?.claimed ?? 247} of {data?.cap ?? 1000} claimed</span>
            <span>{data?.remaining ?? 753} remaining</span>
          </div>
          <div className="h-2 bg-blue-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <FoundingMemberButton />
      </div>
    </div>
  );
}

function FoundingMemberButton() {
  const [loading, setLoading] = useState(false);
  const checkout = trpc.subscriptions.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: (err) => {
      toast.error(err.message);
      setLoading(false);
    },
  });

  return (
    <Button
      onClick={() => {
        setLoading(true);
        checkout.mutate({
          priceId: (import.meta as any).env?.VITE_FOUNDING_PRICE_ID ?? "",
        });
      }}
      disabled={loading || checkout.isPending}
      className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-6"
    >
      {loading || checkout.isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading…
        </>
      ) : (
        "Claim Founding Rate — $29/mo"
      )}
    </Button>
  );
}
