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
import { Lock, User, UtensilsCrossed } from "lucide-react";
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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center animate-slow-zoom"
        style={{
          backgroundImage: "url('/staff-login-bg.jpg')",
        }}
      />

      {/* Overlay for readability (premium + clean mix) */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/45 to-black/70" />

      {/* Subtle blur to push background away */}
      {/* <div className="absolute inset-0 backdrop-blur-[2px]" /> */}

      {/* Soft vignette for depth */}
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_100%)] bg-black/40" />

      {/* Content */}
      <div className="relative w-full max-w-md">
        <Card className="w-full border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-primary/10 ring-1 ring-primary/20 shadow-sm">
              <UtensilsCrossed className="w-8 h-8 text-primary" />
            </div>

            <div>
              <CardTitle className="text-2xl">Staff Portal</CardTitle>
              <CardDescription>Sign in to access the dashboard</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
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
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
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
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
        {/* subtle footer */}
        <p className="mt-4 text-center text-xs text-white/70">
          Restaurant Tab System • Staff Access
        </p>
      </div>
    </div>
  );
}
