import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { joinWithCode } from "../api/joinApi";

import { ArrowRight, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GuestEntryHeader from "@/components/guest/GuestEntryHeader";

function GlassShell({ children }) {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <div
        className="absolute inset-0 bg-cover bg-center animate-slow-zoom"
        style={{ backgroundImage: "url('/staff-login-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/60 to-background/85 dark:from-background/90 dark:via-background/70 dark:to-background/90" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      <div className="relative flex h-full flex-col">
        {children}
        <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
      </div>
    </div>
  );
}

export default function EnterCodePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await joinWithCode(code.trim());
      navigate(`/t/${data.table.token}`, { replace: true });
    } catch (e2) {
      setError(e2.message || "Invalid/expired code");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || code.trim().length < 4;

  return (
    <GlassShell>
      <GuestEntryHeader
        onBack={() => navigate("/", { replace: true })}
        showTitleBlock
        subtitle="Enter your table code to get started"
      />

      <main className="flex flex-1 items-center justify-center px-6 pb-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl backdrop-blur-xl dark:bg-card/85">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError("");
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="e.g. 483912"
                  className="h-16 rounded-2xl border-border bg-background/80 px-4 text-center text-2xl font-semibold tracking-widest text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
                  autoFocus
                />

                {error && (
                  <div className="animate-fade-in flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <Button type="submit" size="xl" className="w-full" disabled={disabled}>
                {loading ? (
                  <span className="animate-pulse-soft">Joining...</span>
                ) : (
                  <>
                    Join Table
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
                <HelpCircle className="h-4 w-4" />
                <span>If you can’t scan the QR, ask staff for the code</span>
              </div>
            </form>
          </div>
        </div>
      </main>
    </GlassShell>
  );
}