import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  Users,
  ChefHat,
  Star,
  ArrowRight,
} from "lucide-react";

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

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(220,20%,8%)] text-[hsl(40,20%,95%)]">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-20 min-h-[90vh] overflow-hidden">
        {/* Background Image + Overlay */}
        <div className="absolute inset-0">
          <img
            src="/hero-bg.jpeg"
            alt="AfroAsiatique dining experience"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,20%,5%)/85%] via-[hsl(220,20%,5%)/70%] to-[hsl(220,20%,5%)/95%]" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg w-full flex flex-col items-center text-center gap-8">
          {/* Logo / Brand */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 flex items-center justify-center">
              <UtensilsCrossed className="w-8 h-8 text-primary" />
            </div>
            <span className="text-sm font-medium tracking-[0.3em] uppercase text-primary/80">
              AtUrService
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              <span className="text-primary">Afro</span>Asiatique
            </h1>
            <p className="text-lg text-[hsl(40,10%,65%)] max-w-sm mx-auto leading-relaxed">
              Where bold African flavors meet refined Asian artistry. A dining
              experience beyond borders.
            </p>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              { icon: ChefHat, label: "Fusion Cuisine" },
              { icon: Star, label: "Premium Dining" },
              { icon: Users, label: "Digital Service" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={slideIn}
                initial="hidden"
                animate="visible"
                custom={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(40,20%,95%)/8%] backdrop-blur-md border 
border-border dark:border-[hsl(40,20%,95%)/10%] text-sm text-[hsl(40,10%,70%)]"
              >
                <item.icon className="w-4 h-4 text-primary" />
                {item.label}
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Cards */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="w-full space-y-4 mt-4"
          >
            {/* Primary CTA — Guest */}
            <button
              onClick={() => navigate("/join")}
              className="group w-full p-5 rounded-2xl bg-primary/15 backdrop-blur-xl border border-primary/25 hover:bg-primary/25 hover:border-primary/40 transition-all duration-300 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <UtensilsCrossed className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-lg text-[hsl(40,20%,95%)]">
                    Join Table
                  </p>
                  <p className="text-sm 
text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                    Scan, order & enjoy
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Secondary CTA — Staff */}
            <button
              onClick={() => navigate("/login")}
              className="group w-full p-4 rounded-2xl bg-[hsl(40,20%,95%)/5%] backdrop-blur-xl border 
border-border dark:border-[hsl(40,20%,95%)/10%] hover:bg-[hsl(40,20%,95%)/10%] hover:border-[hsl(40,20%,95%)/15%] transition-all duration-300 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[hsl(40,20%,95%)/8%] flex items-center justify-center">
                  <Users className="w-5 h-5 text-[hsl(40,10%,65%)]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[hsl(40,20%,90%)]">
                    Join Platform
                  </p>
                  <p className="text-xs text-[hsl(40,10%,50%)]">
                    Staff & admin access
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[hsl(40,10%,50%)] group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[hsl(40,20%,95%)/8%] px-6 py-8 text-center space-y-3 bg-[hsl(220,20%,6%)]">
        <div className="flex items-center justify-center gap-2 text-primary/70">
          <UtensilsCrossed className="w-4 h-4" />
          <span className="text-sm font-medium tracking-widest uppercase">
            AtUrService
          </span>
        </div>
        <p className="text-xs text-[hsl(40,10%,40%)]">
          AfroAsiatique — Where cultures converge on every plate
        </p>
        <p className="text-xs text-[hsl(40,10%,30%)]">
          © {new Date().getFullYear()} AtUrService. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
