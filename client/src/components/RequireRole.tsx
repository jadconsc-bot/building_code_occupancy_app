import { useAuth } from "@/_core/hooks/useAuth";
import { useClerk } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppRole = "free" | "home_user" | "basic" | "professional" | "rule_editor" | "admin";

const ROLE_HIERARCHY: Record<AppRole, number> = {
  free:         0,
  home_user:    1,
  basic:        2,
  professional: 3,
  rule_editor:  4,
  admin:        5,
};

export function RequireRole({
  minRole,
  children,
  featureName,
}: {
  minRole: AppRole;
  children: React.ReactNode;
  featureName?: string;
}) {
  const { user, loading } = useAuth();
  const { openSignIn } = useClerk();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <Lock className="w-8 h-8 text-blue-700" />
        </div>
        <h2 className="text-xl font-semibold">Sign in required</h2>
        <p className="text-muted-foreground max-w-md text-sm">
          {featureName ?? "This feature"} requires a CodeComply account.
        </p>
        <Button onClick={() => openSignIn()}>Sign In</Button>
      </div>
    );
  }

  const userLevel = ROLE_HIERARCHY[user.role as AppRole] ?? 0;
  const reqLevel  = ROLE_HIERARCHY[minRole];

  if (userLevel < reqLevel) {
    const isHomeUser = user.role === "home_user";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <Lock className="w-8 h-8 text-blue-700" />
        </div>
        <h2 className="text-xl font-semibold">
          {isHomeUser ? "Pro Feature" : "Subscription Required"}
        </h2>
        <p className="text-muted-foreground max-w-md text-sm">
          {isHomeUser
            ? `${featureName ?? "This feature"} is available on the Pro plan. Upgrade to access drawing analysis, permit packages, and full compliance tools.`
            : `${featureName ?? "This feature"} requires a CodeComply Pro subscription.`}
        </p>
        <Button
          onClick={() => setLocation("/billing")}
          className="bg-[#1B3A6B] hover:bg-[#152e55] text-white"
        >
          {isHomeUser ? "Upgrade to Pro — $29/mo" : "View Plans"}
        </Button>
        {!isHomeUser && (
          <p className="text-xs text-muted-foreground">
            Or try a{" "}
            <button onClick={() => setLocation("/home")} className="underline">
              Home report
            </button>{" "}
            for $29 one-time.
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
