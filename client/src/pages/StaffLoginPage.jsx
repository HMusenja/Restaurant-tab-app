import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock, User, UtensilsCrossed } from "lucide-react";

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

import { loginUser } from "@/api/authApi";
import { useAuth } from "@/contexts/AuthContext";

export default function StaffLoginPage() {
  const { fetchUser } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🟢 HANDLE SUBMIT START");

    if (!formData.email || !formData.password) {
      console.log("🔴 Missing fields");
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      console.log("🟡 Calling loginUser...");

      const res = await loginUser(formData);

      console.log("🟢 LOGIN RESPONSE:", res);
      console.log("🟢 LOGIN DATA:", res?.data);

      if (res.mustChangePassword === true) {
        console.log("🟣 MUST CHANGE PASSWORD → navigating");
        toast.info("Please change your temporary password");
        navigate("/change-password", { replace: true });
        return;
      }

      console.log("🟢 Fetching user...");
      await fetchUser();
      console.log("🟢 fetchUser DONE");

      console.log("🟢 Navigating to /staff");
      navigate("/staff", { replace: true });
    } catch (err) {
      console.log("🔴 LOGIN ERROR:", err);
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      console.log("🟢 HANDLE SUBMIT END");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 text-foreground">
      <div
        className="absolute inset-0 bg-cover bg-center animate-slow-zoom"
        style={{
          backgroundImage: "url('/staff-login-bg.jpg')",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/60 to-background/85 dark:from-background/90 dark:via-background/70 dark:to-background/90" />

      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_100%)] bg-background/30 dark:bg-background/40" />

      <div className="relative w-full max-w-md">
        <Card className="w-full rounded-3xl border-border/70 bg-card/90 shadow-2xl backdrop-blur-xl dark:bg-card/85">
          <CardHeader className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-sm">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                Staff Portal
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-muted-foreground">
                Sign in to access the dashboard
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="h-11 rounded-2xl border-border bg-background pl-10 text-base"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="h-11 rounded-2xl border-border bg-background pl-10 text-base"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full rounded-2xl"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-foreground/70">
          Restaurant Tab System • Staff Access
        </p>
      </div>
    </div>
  );
}