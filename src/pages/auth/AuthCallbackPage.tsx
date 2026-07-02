import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ROUTES } from "@/lib/constants";
import { useLanguage } from "@/hooks/useLanguage";
import { AuthFormAlert } from "@/components/shared/AuthFormAlert";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase automatically parses the URL hash for session data on init.
    // By staying on this component, we ensure React Router doesn't strip
    // the hash before Supabase can read it.
    
    // Check if session is already present
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setError(error.message);
      } else if (data.session) {
        navigate(ROUTES.DASHBOARD, { replace: true });
      }
    });

    // Also listen for the SIGNED_IN event from the hash parser
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate(ROUTES.DASHBOARD, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 space-y-4">
        <AuthFormAlert>{error}</AuthFormAlert>
        <button 
          onClick={() => navigate(ROUTES.AUTH)} 
          className="text-sm text-primary hover:underline"
        >
          {t("common.back", "Back")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-label="Authenticating..."
        role="status"
      />
    </div>
  );
}
