import { useState } from "react";
import { useNavigate,Link } from "react-router-dom";
import { joinWithCode } from "../api/joinApi";

import { UtensilsCrossed, ArrowRight, AlertCircle, HelpCircle,Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="safe-top p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-soft">
            <UtensilsCrossed className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Title */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold gradient-text">AtUrService</h1>
            <p className="text-muted-foreground text-lg">
              Enter your table code to get started
            </p>
          </div>

          {/* Form */}
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
                className="text-center text-xl tracking-widest font-semibold h-16"
                autoFocus
              />

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm animate-fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Help Text */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <HelpCircle className="w-4 h-4" />
            <span>If you can’t scan the QR, ask staff for the code</span>
          </div>
          {/* Staff Portal Link */}
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-primary hover:underline text-sm font-medium"
          >
            <Users className="w-4 h-4" />
            <span>Staff Portal</span>
          </Link>
        </div>
      </main>

      {/* Bottom Accent */}
      <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
    </div>
  );
}
