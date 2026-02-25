// src/lib/staffUi.js
import { cn } from "@/lib/utils";

export function staffFieldClass(extra = "") {
  return cn(
    // structure
    "w-full h-11 rounded-2xl px-4 text-sm transition-all duration-200",

    // refined surface
    "bg-[hsl(222,18%,14%)]",

    // subtle border
    "border border-[hsl(40,30%,85%)/14%]",

    // warm readable text
    "text-[hsl(40,30%,94%)]",

    // elegant placeholder
    "placeholder:text-[hsl(40,15%,60%)]",

    // premium focus glow
    "focus:outline-none",
    "focus:border-[hsl(38,90%,55%)/70%]",
    "focus:ring-2 focus:ring-[hsl(38,90%,55%)/30%]",

    // hover lift effect
    "hover:border-[hsl(40,30%,85%)/22%]",

    extra
  );
}



export function staffTextareaClass(extra = "") {
  return staffFieldClass(
    cn("h-auto min-h-[110px] py-3 resize-none", extra)
  );
}



export function staffDialogContentClass(extra = "") {
  return cn(
    // deep charcoal surface
    "bg-[hsl(222,18%,9%)]",

    // elegant warm text
    "text-[hsl(40,30%,92%)]",

    // refined border
    "border border-[hsl(40,30%,85%)/12%]",

    // depth
    "rounded-3xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)]",

    // subtle glass
    "backdrop-blur-sm",

    extra
  );
}

