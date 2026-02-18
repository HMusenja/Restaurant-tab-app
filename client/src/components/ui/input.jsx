import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          [
            "flex w-full rounded-md border border-input bg-transparent",
            // ✅ Mobile-first touch height (44px), smaller on larger screens
            "h-11 sm:h-9",
            // Padding
            "px-3 py-2",
            // Responsive font sizing
            "text-[1rem] sm:text-sm",
            // Shadow & transitions
            "shadow-sm transition-colors",
            // File input reset
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            // Placeholder
            "placeholder:text-muted-foreground",
            // Focus
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            // Disabled
            "disabled:cursor-not-allowed disabled:opacity-50",
          ].join(" "),
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };

