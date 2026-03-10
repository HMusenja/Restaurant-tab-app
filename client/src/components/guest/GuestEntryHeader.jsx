import { motion } from "framer-motion";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.55,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

export default function GuestEntryHeader({
  onBack,
  title,
  subtitle,
  brandPrefix = "Afro",
  brandSuffix = "Asiatique",
  showTitleBlock = false,
  className = "",
}) {
  return (
    <div className={className}>
      <header className="safe-top px-6 pt-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            aria-label="Back"
            type="button"
            className="h-12 w-12 rounded-2xl border border-border/60 bg-card/20 text-foreground shadow-sm backdrop-blur-md hover:bg-card/30 dark:border-border/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-card/25 shadow-sm backdrop-blur-md"
          >
            <UtensilsCrossed className="h-7 w-7 text-primary" />
          </motion.div>

          <div className="w-12" />
        </div>
      </header>

      {showTitleBlock && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="space-y-2 px-6 text-center"
        >
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            <span className="text-primary">{brandPrefix}</span>
            <span className="text-foreground">{brandSuffix}</span>
          </h1>

          {subtitle ? (
            <p className="text-base text-foreground/80">{subtitle}</p>
          ) : null}
        </motion.div>
      )}
    </div>
  );
}