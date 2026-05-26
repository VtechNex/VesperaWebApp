import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import SiteHeader from "../components/layout/SiteHeader";

export default function AdminLogin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");

  const redirectPath = location.state?.from || "/dashboard/admin";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const response = await login(email, password);

      if (!response) {
        toast({
          title: "Login failed",
          description: "No response from server",
        });
        return;
      }

      if (response.status !== 200) {
        toast({
          title: "Login failed",
          description: response?.data?.error || response?.data?.message || "Invalid credentials",
        });
        return;
      }

      toast({
        title: "Login successful",
        description: "Welcome to Vespera Admin Panel",
      });

      if (location.pathname !== redirectPath) {
        navigate(redirectPath, { replace: true });
      }
    } catch (loginError) {
      toast({
        title: "Login failed",
        description:
          loginError?.response?.data?.error ||
          loginError?.response?.data?.message ||
          loginError?.message ||
          "Server error, please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader theme="dark" />
      <main className="flex min-h-[calc(100vh-88px)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="mb-8">
            <div className="text-[11px] uppercase tracking-[0.32em] text-gold">Admin Access</div>
            <h1 className="mt-3 font-serif text-3xl text-white">Sign In</h1>
            <p className="mt-3 text-sm leading-6 text-white/65">
              This entry is reserved for the Vespera Estates admin team. Use your assigned credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                required
                placeholder="admin@vespera.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="border-white/15 bg-black/40 text-white"
              />
            </div>

            <div className="grid gap-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="border-white/15 bg-black/40 pr-10 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-2 flex items-center text-white/60"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error ? <div className="text-sm text-red-400">{error}</div> : null}

            <Button type="submit" className="gold-btn gold-shine w-full" disabled={loading}>
              {loading ? "Signing in..." : "Access Admin Panel"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
