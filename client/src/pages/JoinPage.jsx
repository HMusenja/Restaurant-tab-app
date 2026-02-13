import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { joinWithInvite } from "../api/joinApi";

import { ArrowLeft, Users, AlertCircle, Check,RectangleEllipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/AppHeader";

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

  /* ---------------- Loading state (Code A feel) ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader
          rightContent={
            <Button variant="ghost" size="icon-sm" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          }
        />

        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-sm space-y-6">
            <div className="bg-card rounded-2xl p-6 shadow-medium border border-border/50 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
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
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- Error state (Code A feel) ---------------- */
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader
        rightContent={
          <Button variant="ghost" size="icon-sm" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        }
      />

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Info Card */}
          <div className="bg-card rounded-2xl p-6 shadow-medium border border-border/50 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Unable to join</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                This invite may have expired. Please ask staff to show the QR again.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Try again with a fresh invite or try with your entry code.</span>
            </div>
              <Button variant="ghost" size="lg" className="w-full" onClick={() => navigate("/enter-code")}>
              <RectangleEllipsis className="w-5 h-5" />
              Use Code
            </Button>

            <Button size="xl" className="w-full" onClick={handleBack}>
              <Users className="w-5 h-5" />
              Back to start
            </Button>

            <Button variant="ghost" size="lg" className="w-full" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
