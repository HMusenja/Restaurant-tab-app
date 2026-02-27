import { useEffect, useRef, useState } from "react";
import { Bell, Moon, Sun, Volume2, Smartphone, Zap } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useNotifications } from "@/contexts/NotificationsContext";
import { toast } from "sonner";

function glassCardClass(extra = "") {
  return cn(
    "rounded-3xl border border-[hsl(40,20%,95%)/10%]",
    "bg-[hsl(220,20%,8%)/70%] backdrop-blur-xl",
    "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_rgba(0,0,0,0.45)]",
    extra,
  );
}

function rowClass(extra = "") {
  return cn(
    "flex items-center justify-between gap-4",
    "rounded-2xl border border-[hsl(40,20%,95%)/8%]",
    "bg-[hsl(220,20%,10%)]/40",
    "px-4 py-3",
    "min-h-[52px]",
    extra,
  );
}

function leftLabelClass() {
  return cn(
    "flex items-center gap-2",
    "text-[hsl(40,20%,92%)]",
    "text-sm sm:text-[0.95rem]",
    "leading-tight",
  );
}

function helperTextClass() {
  return "text-xs text-[hsl(40,10%,60%)]";
}

export default function StaffSettingsPage() {
  const { preferences, loadingPreferences, busy, error, updatePreferences } = useNotifications();

  // Local UI-only switches (appearance section remains non-persistent for now)
  const [darkMode, setDarkMode] = useState(false);
  const [compact, setCompact] = useState(false);

  // Toast on error changes (don’t spam)
  const lastErrorRef = useRef("");
  useEffect(() => {
    if (!error) return;
    if (error === lastErrorRef.current) return;
    lastErrorRef.current = error;

    toast({
      title: "Could not update notifications",
      description: error,
      variant: "destructive",
    });
  }, [error]);

  const setPref = async (patch, label) => {
    // updatePreferences already does optimistic + rollback on error
    await updatePreferences(patch);

    // If it failed, error toast will show via effect above.
    // If it succeeded, show success toast.
    toast({
      title: "Saved",
      description: label,
    });
  };

  const soundEnabled = !!preferences?.soundEnabled;
  const vibrationEnabled = !!preferences?.vibrationEnabled;
  const urgentEnabled = !!preferences?.urgentEnabled;

  const disabled = loadingPreferences || busy;

  return (
    <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
      {/* Notifications */}
      <Card className={glassCardClass()}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-[hsl(40,20%,95%)]">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription className="text-[hsl(40,10%,60%)]">
            Configure how you receive alerts for new requests
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className={rowClass()}>
            <div className="min-w-0">
              <Label htmlFor="sound" className={leftLabelClass()}>
                <Volume2 className="w-4 h-4 text-[hsl(40,10%,70%)]" />
                <span className="truncate">Sound alerts</span>
              </Label>
              <div className={helperTextClass()}>
                Play a sound when a new request comes in
              </div>
            </div>

            <Switch
              id="sound"
              checked={soundEnabled}
              disabled={disabled}
              onCheckedChange={(checked) =>
                setPref({ soundEnabled: !!checked }, checked ? "Sound alerts enabled" : "Sound alerts disabled")
              }
            />
          </div>

          <div className={rowClass()}>
            <div className="min-w-0">
              <Label htmlFor="vibrate" className={leftLabelClass()}>
                <Smartphone className="w-4 h-4 text-[hsl(40,10%,70%)]" />
                <span className="truncate">Vibration</span>
              </Label>
              <div className={helperTextClass()}>
                Vibrate on supported devices
              </div>
            </div>

            <Switch
              id="vibrate"
              checked={vibrationEnabled}
              disabled={disabled}
              onCheckedChange={(checked) =>
                setPref(
                  { vibrationEnabled: !!checked },
                  checked ? "Vibration enabled" : "Vibration disabled"
                )
              }
            />
          </div>

          <div className={rowClass()}>
            <div className="min-w-0">
              <Label htmlFor="urgent" className={leftLabelClass()}>
                <Zap className="w-4 h-4 text-[hsl(40,10%,70%)]" />
                <span className="truncate">Urgent request alerts</span>
              </Label>
              <div className={helperTextClass()}>
                Louder / stronger notifications for urgent requests
              </div>
            </div>

            <Switch
              id="urgent"
              checked={urgentEnabled}
              disabled={disabled}
              onCheckedChange={(checked) =>
                setPref(
                  { urgentEnabled: !!checked },
                  checked ? "Urgent alerts enabled" : "Urgent alerts disabled"
                )
              }
            />
          </div>

          <Separator className="bg-[hsl(40,20%,95%)/10%] my-2" />

          <div className="text-xs text-[hsl(40,10%,55%)]">
            Tip: If you’re on iOS and sounds feel quiet, make sure the device is not in silent mode.
          </div>
        </CardContent>
      </Card>

      {/* Appearance (UI-only for now) */}
      <Card className={glassCardClass()}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-[hsl(40,20%,95%)]">
            <Sun className="w-5 h-5 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription className="text-[hsl(40,10%,60%)]">
            Customize the dashboard appearance
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className={rowClass()}>
            <div className="min-w-0">
              <Label htmlFor="dark" className={leftLabelClass()}>
                <Moon className="w-4 h-4 text-[hsl(40,10%,70%)]" />
                <span className="truncate">Dark mode</span>
              </Label>
              <div className={helperTextClass()}>
                Use the dark theme for low-light environments
              </div>
            </div>
            <Switch
              id="dark"
              checked={darkMode}
              onCheckedChange={(v) => setDarkMode(!!v)}
            />
          </div>

          <div className={rowClass()}>
            <div className="min-w-0">
              <Label htmlFor="compact" className={leftLabelClass()}>
                <span className="truncate">Compact view</span>
              </Label>
              <div className={helperTextClass()}>
                Reduce spacing to see more content
              </div>
            </div>
            <Switch
              id="compact"
              checked={compact}
              onCheckedChange={(v) => setCompact(!!v)}
            />
          </div>

          <Separator className="bg-[hsl(40,20%,95%)/10%] my-2" />

          <div className="text-xs text-[hsl(40,10%,55%)]">
            These are UI preferences only (no effect on restaurant data).
          </div>
        </CardContent>
      </Card>

      {/* Optional sticky action bar (pure UI) */}
      <div className="sticky bottom-3 z-10">
        <div className={cn(glassCardClass(), "p-3 flex items-center justify-between gap-3")}>
          <div className="text-xs text-[hsl(40,10%,60%)]">
            Notification changes apply instantly.
          </div>
          <Button className="rounded-2xl px-5" disabled>
            Saved
          </Button>
        </div>
      </div>
    </div>
  );
}