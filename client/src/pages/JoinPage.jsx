import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { joinWithInvite } from "../api/joinApi";

import { ArrowLeft, Users, AlertCircle, Check, RectangleEllipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/AppHeader";

function GlassShell({ children, onBack }) {
  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center animate-slow-zoom"
        style={{ backgroundImage: "url('/staff-login-bg.jpg')" }}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/45 to-black/70" />
      {/* <div className="absolute inset-0 backdrop-blur-[2px]" /> */}

      {/* Foreground */}
      <div className="relative flex flex-col h-full">
        <AppHeader
          rightContent={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          }
        />

        {children}
      </div>
    </div>
  );
}


export default function JoinPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const invite = params.get("invite");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const handleBack = () => navigate("/", { replace: true });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!invite) throw new Error("Missing invite in URL");
        const data = await joinWithInvite(invite); // { table: { token } }
        if (!alive) return;
        navigate(`/t/${data.table.token}`, { replace: true });
      } catch (e) {
        if (!alive) return;
        setError(e.message || "Failed to join table");
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [invite, navigate]);

  // Loading state
  if (loading) {
    return (
      <GlassShell onBack={handleBack}>
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-sm space-y-6">
            <div className="rounded-2xl p-6 shadow-elevated border border-white/15 bg-white/90 backdrop-blur-xl text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-primary" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Joining…</h2>
                <p className="text-sm text-muted-foreground">
                  Please wait while we connect you to the table.
                </p>
              </div>
            </div>

            <Button size="xl" className="w-full" disabled>
              <span className="animate-pulse-soft">Joining…</span>
            </Button>

            <p className="text-center text-xs text-white/70">
              If this takes longer than a few seconds, ask staff to refresh the QR.
            </p>
          </div>
        </main>
      </GlassShell>
    );
  }

  // Error state
  return (
    <GlassShell onBack={handleBack}>
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="rounded-2xl p-6 shadow-elevated border border-white/15 bg-white/90 backdrop-blur-xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Unable to join</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>

            <div className="pt-3 border-t border-border/60">
              <p className="text-sm text-muted-foreground">
                This invite may have expired. Please ask staff to show the QR again.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg animate-fade-in border border-destructive/15">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Try again with a fresh invite or use your entry code.</span>
            </div>

            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate("/enter-code")}
            >
              <RectangleEllipsis className="w-5 h-5 mr-2" />
              Use Code
            </Button>

            <Button size="xl" className="w-full" onClick={handleBack}>
              <Users className="w-5 h-5 mr-2" />
              Back to start
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="w-full text-white hover:bg-white/10"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </main>
    </GlassShell>
  );
}
