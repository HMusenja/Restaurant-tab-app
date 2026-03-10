// src/components/reservations/ReservationDetailsCard.jsx
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { glassCardClass } from "./reservation-ui";

export default function ReservationDetailsCard({
  title = "Details",
  className,
  onClose,
  children,
}) {
  return (
    <Card className={cn(glassCardClass(), className)}>
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base text-foreground dark:text-[hsl(40,20%,95%)]">
            {title}
          </CardTitle>

          {onClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-2xl"
            >
              <X className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}