import { useEffect, useRef } from "react";
import { Bell, Moon, Sun, Volume2, Smartphone, Zap } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useNotifications } from "@/contexts/NotificationsContext";
import { useUiPreferences } from "@/contexts/UiPreferencesContext";
import { toast } from "sonner";

function glassCardClass(extra = "") {
  return cn(
    "rounded-3xl border",
    // ✅ light mode glass
    "border-border/60 bg-card/70 backdrop-blur-xl",
    "shadow-[0_10px_40px_rgba(0,0,0,0.10)]",
    // ✅ dark mode glass (keeps your old vibe)
    "dark:border-border dark:border-[hsl(40,20%,95%)/10%] dark:bg-[hsl(220,20%,8%)/70%]",
    "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_rgba(0,0,0,0.45)]",
    extra
  );
}

function rowClass(extra = "") {
  return cn(
    "flex items-center justify-between gap-4",
    "rounded-2xl border px-4 py-3 min-h-[52px]",
    // ✅ light mode row
    "border-border/60 bg-muted/40",
    // ✅ dark mode row (your old values)
    "dark:border-[hsl(40,20%,95%)/8%] dark:bg-[hsl(220,20%,10%)]/40",
    extra
  );
}

function leftLabelClass() {
  return cn(
    "flex items-center gap-2",
    "text-sm sm:text-[0.95rem] leading-tight",
    // ✅ readable in both themes
    "text-foreground dark:text-[hsl(40,20%,92%)]"
  );
}

function helperTextClass() {
  // ✅ better light contrast; keep your dark tone
  return "text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]";
}

export default function StaffSettingsPage() {
  const {
    preferences,
    loadingPreferences,
    busy,
    error,
    loadPreferences,
    updatePreferences,
  } = useNotifications();

  const { darkMode, compact, setDarkMode, setCompact } = useUiPreferences();

  useEffect(() => {
    loadPreferences?.();
  }, [loadPreferences]);

  const lastErrorRef = useRef("");
  useEffect(() => {
    if (!error) return;
    if (error === lastErrorRef.current) return;
    lastErrorRef.current = error;

    toast.error("Could not update notifications", { description: error });
  }, [error]);

  const setPref = async (patch, label) => {
    const res = await updatePreferences(patch);
    if (res?.ok) toast.success("Saved", { description: label });
  };

  const soundEnabled = !!preferences?.soundEnabled;
  const vibrationEnabled = !!preferences?.vibrationEnabled;
  const urgentEnabled = !!preferences?.urgentEnabled;

  const isInitialLoading = loadingPreferences && !preferences;
  const disabled = busy || isInitialLoading;

  return (
    <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
      {/* Notifications */}
      <Card className={glassCardClass()}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2  text-foreground dark:text-[hsl(40,20%,95%)]">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription className={cn(helperTextClass(), "text-sm")}>
            Configure how you receive alerts for new requests
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className={rowClass()}>
            <div className="min-w-0">
              <Label htmlFor="sound" className={leftLabelClass()}>
                <Volume2 className="w-4 h-4 text-muted-foreground dark:text-[hsl(40,10%,70%)]" />
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
                setPref(
                  { soundEnabled: !!checked },
                  checked ? "Sound alerts enabled" : "Sound alerts disabled"
                )
              }
            />
          </div>

          <div className={rowClass()}>
            <div className="min-w-0">
              <Label htmlFor="vibrate" className={leftLabelClass()}>
                <Smartphone className="w-4 h-4 text-muted-foreground dark:text-[hsl(40,10%,70%)]" />
                <span className="truncate">Vibration</span>
              </Label>
              <div className={helperTextClass()}>Vibrate on supported devices</div>
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
                <Zap className="w-4 h-4 text-muted-foreground dark:text-[hsl(40,10%,70%)]" />
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

          <Separator className="my-2 bg-border/60 dark:bg-[hsl(40,20%,95%)/10%]" />

          <div className={cn(helperTextClass(), "text-xs")}>
            Tip: If you’re on iOS and sounds feel quiet, make sure the device is not
            in silent mode.
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className={glassCardClass()}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2  text-foreground dark:text-[hsl(40,20%,95%)]">
            <Sun className="w-5 h-5 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription className={cn(helperTextClass(), "text-sm")}>
            Customize the dashboard appearance
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className={rowClass()}>
            <div className="min-w-0">
              <Label htmlFor="dark" className={leftLabelClass()}>
                <Moon className="w-4 h-4 text-muted-foreground dark:text-[hsl(40,10%,70%)]" />
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

          <Separator className="my-2 bg-border/60 dark:bg-[hsl(40,20%,95%)/10%]" />

          <div className={cn(helperTextClass(), "text-xs")}>
            These are UI preferences only (no effect on restaurant data).
          </div>
        </CardContent>
      </Card>

      {/* Optional sticky action bar (pure UI) */}
      <div className="sticky bottom-3 z-10">
        <div className={cn(glassCardClass(), "p-3 flex items-center justify-between gap-3")}>
          <div className={cn(helperTextClass(), "text-xs")}>
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