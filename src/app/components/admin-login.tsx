import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Lock, User } from "lucide-react";
import { toast } from "sonner";
import { supabaseAdminApiBaseUrls } from "../../../utils/supabase/client";

interface AdminLoginProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: (token: string) => void;
}

export function AdminLogin({
  open,
  onOpenChange,
  onLoginSuccess,
}: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const tryLoginRequest = async () => {
    // Use deployed hyper-responder Edge Function
    let lastResponse: Response | null = null;

    for (const baseUrl of supabaseAdminApiBaseUrls) {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      lastResponse = response;

      // Route not found on this base URL, try the next candidate.
      if (response.status === 404) {
        continue;
      }

      return response;
    }

    return lastResponse;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await tryLoginRequest();
      if (!response) {
        toast.error("Admin API did not respond.");
        return;
      }

      const rawBody = await response.text();
      let data: any = {};
      try {
        data = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        data = { error: rawBody };
      }

      if (response.ok && data.success && data.token) {
        toast.success("Login successful!");
        onLoginSuccess(data.token);
        onOpenChange(false);
        setUsername("");
        setPassword("");
      } else {
        if (
          response.status === 401 &&
          typeof data?.message === "string" &&
          data.message.includes("Missing authorization header")
        ) {
          toast.error(
            "The deployed Edge Function has JWT verification enabled. Disable JWT verification for hyper-responder in Supabase Edge Functions.",
          );
          return;
        }

        if (response.status === 404) {
          toast.error(
            "Admin API route was not found. Check the function name and route prefix configuration.",
          );
          return;
        }

        toast.error(data.error || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        "Network error reaching Admin API. Check Supabase Function deployment, JWT verification, and CORS origin.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#9A7B1D]" />
            Admin Login
          </DialogTitle>
          <DialogDescription>
            Enter your credentials to access the admin dashboard
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="username"
                type="text"
                placeholder="Admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#9A7B1D] hover:bg-[#7d6418]"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
