import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, KeyRound, UtensilsCrossed } from "lucide-react";
import { changePassword } from "@/api/authApi";

import { useAuth } from "@/contexts/AuthContext";

export default function ChangePasswordPage() {
  const { fetchUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (formData.newPassword !== formData.confirmPassword) {
    toast.error("New password and confirm password do not match");
    return;
  }

  try {
    setIsLoading(true);

    const payload = {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    };

    await changePassword(payload);
    await fetchUser();

    toast.success("Password updated successfully");
    navigate("/staff", { replace: true });
  } catch (err) {
    console.log("🔴 CHANGE PASSWORD ERROR:", err);
    toast.error(err?.response?.data?.message || "Failed to update password");

  } finally {
    setIsLoading(false);
  }
};



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Change Your Password</CardTitle>
            <CardDescription>
              You must update your temporary password to continue
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Temporary Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter temporary password"
                  className="pl-10"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  className="pl-10"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  className="pl-10"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
