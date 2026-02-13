import { Bell, Moon, Sun, Volume2 } from "lucide-react";


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function StaffSettingsPage() {
  return (
   
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive alerts for new requests</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound" className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Sound alerts
              </Label>
              <Switch id="sound" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="vibrate">Vibration</Label>
              <Switch id="vibrate" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="urgent">Urgent request alerts</Label>
              <Switch id="urgent" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sun className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the dashboard appearance</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark" className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Dark mode
              </Label>
              <Switch id="dark" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="compact">Compact view</Label>
              <Switch id="compact" />
            </div>
          </CardContent>
        </Card>
      </div>
   
  );
}
