import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signIn, signUp } from "@/hooks/useAuth";

export default function Login() {
  const navigate   = useNavigate();
  const { toast }  = useToast();

  const [mode,     setMode]     = useState<"login" | "signup">("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        navigate("/", { replace: true });
      } else {
        await signUp(email, password);
        toast({
          title: "Account created",
          description: "Check your email to confirm your account, then log in.",
        });
        setMode("login");
      }
    } catch (err) {
      toast({
        title: mode === "login" ? "Login failed" : "Sign up failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
            RA
          </div>
          <div>
            <p className="text-base font-semibold">Review Autopilot</p>
            <p className="text-xs text-muted-foreground">AI Review Manager</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {mode === "login" ? "Sign in" : "Create account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Enter your credentials to access your dashboard"
                : "Create an account to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {mode === "login" ? "Signing in…" : "Creating account…"}</>
                  : mode === "login" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="text-primary underline underline-offset-2"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
