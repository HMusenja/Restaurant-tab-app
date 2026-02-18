import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { joinWithCode } from "../api/joinApi";

import { UtensilsCrossed, ArrowRight, AlertCircle, HelpCircle, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const slideIn = {
  hidden: { opacity: 0, x: -30 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.6 + i * 0.2,
      duration: 0.6,
      ease: "easeOut",
    },
  }),
};


function GlassShell({ children, onBack }) {
  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center animate-slow-zoom"
        style={{ backgroundImage: "url('/staff-login-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/45 to-black/70" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      <div className="relative h-full flex flex-col">
        {/* Top row */}
        <header className="safe-top px-6 pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
              className="text-white hover:bg-white/10"
              aria-label="Back"
            >
              <ArrowLeft className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-lg border border-white/15 flex items-center justify-center shadow-soft"/>
            </Button>

            <div className="flex items-center justify-center gap-3">
              <motion.div  variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0} className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-lg border border-white/15 flex items-center justify-center shadow-soft">
               <UtensilsCrossed className="w-8 h-8 text-primary" />
              </motion.div>
            </div>

            <div className="w-10" />
          </div>
        </header>

        {children}

        {/* Bottom accent */}
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
    <GlassShell onBack={() => navigate("/", { replace: true })}>
      <main className="flex-1 flex items-center justify-center px-6 pb-10 text-[hsl(40,20%,95%)]">
        <div className="w-full max-w-sm space-y-6">
          {/* Title */}
          <motion.div  variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1} className="text-center space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              <span className="text-primary">Afro</span>Asiatique
            </h1>
            <p className="text-white/80 text-base">
              Enter your table code to get started
            </p>
          </motion.div>

          {/* Glass Card */}
          <div className="rounded-2xl p-6 shadow-elevated border border-white/15 bg-white/90 backdrop-blur-xl">
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
                  className="text-center text-2xl tracking-widest font-semibold h-16 text-muted-foreground bg-white/80 focus-visible:ring-2 focus-visible:ring-primary/40"
                  autoFocus
                />

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
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {/* Help */}
              <div className="pt-2 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>If you can’t scan the QR, ask staff for the code</span>
              </div>

              {/* Staff Portal Link */}
              {/* <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-primary hover:underline text-sm font-medium"
              >
                <Users className="w-4 h-4" />
                <span>Staff Portal</span>
              </Link> */}
            </form>
          </div>
        </div>
      </main>
    </GlassShell>
  );
}
