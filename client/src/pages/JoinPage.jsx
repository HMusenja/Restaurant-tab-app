import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { joinWithInvite } from "../api/joinApi";

import {
  Users,
  AlertCircle,
  Check,
  RectangleEllipsis,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import GuestEntryHeader from "@/components/guest/GuestEntryHeader";

function GlassShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15 dark:opacity-20"
        style={{ backgroundImage: "url('/staff-login-bg.jpg')" }}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-muted/30" />

      <div className="relative flex min-h-screen flex-col">{children}</div>
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

        const data = await joinWithInvite(invite);
        console.log("joinWithInvite success:", data);

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

  if (loading) {
    return (
      <GlassShell>
        <GuestEntryHeader onBack={handleBack} />

        <main className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-4 rounded-3xl border border-border bg-card/95 p-6 text-center shadow-lg backdrop-blur-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <Check className="h-8 w-8 text-primary" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Joining…</h2>
                <p className="text-sm text-muted-foreground">
                  Please wait while we connect you to the table.
                </p>
              </div>
            </div>

            <Button size="xl" className="w-full rounded-2xl" disabled>
              <span className="animate-pulse-soft">Joining…</span>
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              If this takes longer than a few seconds, ask staff to refresh the QR.
            </p>
          </div>
        </main>
      </GlassShell>
    );
  }

  return (
    <GlassShell>
      <GuestEntryHeader onBack={handleBack} showTitleBlock
        subtitle="Enter your table code to get started" className="text-white" />

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-4 rounded-3xl border border-border bg-card/95 p-6 text-center shadow-lg backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Unable to join</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>

            <div className="border-t border-border/60 pt-3">
              <p className="text-sm text-muted-foreground">
                This invite may have expired. Please ask staff to show the QR again.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="animate-fade-in rounded-2xl border border-destructive/15 bg-destructive/10 p-3 text-sm text-destructive">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Try again with a fresh invite or use your entry code.</span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              className="w-full rounded-2xl"
              onClick={() => navigate("/enter-code")}
              type="button"
            >
              <RectangleEllipsis className="mr-2 h-5 w-5" />
              Use Code
            </Button>

            <Button
              size="xl"
              className="w-full rounded-2xl"
              onClick={handleBack}
              type="button"
            >
              <Users className="mr-2 h-5 w-5" />
              Back to start
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="w-full rounded-2xl text-foreground hover:bg-muted"
              onClick={handleBack}
              type="button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </main>
    </GlassShell>
  );
}