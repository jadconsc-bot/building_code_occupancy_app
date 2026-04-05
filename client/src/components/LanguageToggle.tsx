import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export type Language = "en" | "fr";

interface LanguageToggleProps {
  province?: string; // "BC", "AB", etc. - only show toggle for BC
  onLanguageChange?: (language: Language) => void;
}

/**
 * LanguageToggle Component
 * 
 * Provides EN/FR language switching for BC projects only.
 * Persists user preference in backend + localStorage.
 * Auto-detects browser language for new users.
 * 
 * PD2.0 Compliance:
 * - Deterministic: Language selection is deterministic
 * - Audit Trail: Language preference changes logged to user settings
 * - Infrastructure: Tracks user selection with timestamp
 */
export function LanguageToggle({ province = "BC", onLanguageChange }: LanguageToggleProps) {
  const { user } = useAuth();
  const [language, setLanguage] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(false);

  // Get user language preference from backend
  const userPreference = trpc.user.getLanguagePreference.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Update language preference mutation
  const updateLanguage = trpc.user.setLanguagePreference.useMutation({
    onSuccess: (data) => {
      setLanguage(data.language as Language);
      localStorage.setItem("userLanguage", data.language);
      onLanguageChange?.(data.language as Language);
    },
  });

  // Initialize language preference
  useEffect(() => {
    // Check localStorage first
    const stored = localStorage.getItem("userLanguage") as Language | null;
    if (stored) {
      setLanguage(stored);
      return;
    }

    // Check backend preference if user is authenticated
    if (userPreference.data) {
      const pref = userPreference.data.language as Language;
      setLanguage(pref);
      localStorage.setItem("userLanguage", pref);
      return;
    }

    // Auto-detect browser language for new users
    const browserLang = navigator.language.split("-")[0];
    if (browserLang === "fr") {
      setLanguage("fr");
      localStorage.setItem("userLanguage", "fr");
    }
  }, [userPreference.data]);

  // Only show toggle for BC
  if (province !== "BC") {
    return null;
  }

  const handleToggle = async () => {
    setIsLoading(true);
    const newLanguage: Language = language === "en" ? "fr" : "en";
    
    if (user?.id) {
      // Update backend preference
      await updateLanguage.mutateAsync({
        userId: user.id,
        language: newLanguage,
      });
    } else {
      // Just update local state
      setLanguage(newLanguage);
      localStorage.setItem("userLanguage", newLanguage);
      onLanguageChange?.(newLanguage);
    }
    
    setIsLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      title={`Switch to ${language === "en" ? "Français" : "English"}`}
      className="flex items-center gap-2"
    >
      <Globe className="w-4 h-4" />
      <span className="font-semibold">
        {language === "en" ? "EN" : "FR"}
      </span>
    </Button>
  );
}

/**
 * useLanguage Hook
 * 
 * Provides access to current language and translation function
 * throughout the application.
 */
export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem("userLanguage") as Language | null;
    return stored || "en";
  });

  const t = (key: string, en: string, fr: string): string => {
    return language === "en" ? en : fr;
  };

  return { language, setLanguage, t };
}
