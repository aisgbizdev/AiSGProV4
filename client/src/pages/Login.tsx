/**
 * Login Page for AiSG
 * Modern Gen-Z design with gradient and glassmorphism
 */

import { useState } from "react";
import { useLocation, Link, Redirect } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User, Sparkles, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: authLoading, login } = useAuth();
  const [, setLocation] = useLocation();

  // If already logged in, redirect to dashboard
  if (!authLoading && user) {
    return <Redirect to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(username, password);
      
      // Check if there's a saved return URL
      const returnUrl = sessionStorage.getItem("returnUrl");
      if (returnUrl && returnUrl !== "/login") {
        sessionStorage.removeItem("returnUrl");
        setLocation(returnUrl);
      } else {
        setLocation("/"); // Default to home
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 bg-gray-900/80 backdrop-blur-xl border-gray-800/50 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-full blur-2xl opacity-40" />
              <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-2xl ring-2 ring-amber-500/30">
                <img 
                  src="/logo-aisg.jpg" 
                  alt="AiSG Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <CardDescription className="text-gray-400 text-base">
              Audit Intelligence System Growth
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="pl-10 bg-gray-800/50 border-gray-700 focus:border-purple-500 text-white placeholder:text-gray-500"
                  autoComplete="username"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-gray-300">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300">
                  Lupa Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="pl-10 pr-10 bg-gray-800/50 border-gray-700 focus:border-purple-500 text-white placeholder:text-gray-500"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <Alert variant="destructive" className="bg-red-950/50 border-red-900/50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Logging in...</span>
                </div>
              ) : (
                "Login"
              )}
            </Button>
            {/* Register & Forgot Password links */}
            <div className="space-y-3 pt-2">
              <div className="text-center text-sm">
                <span className="text-gray-400">Belum punya akun? </span>
                <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">
                  Daftar di sini
                </Link>
              </div>

              <div className="text-center text-xs text-gray-500">
                🔐 Enterprise-grade security dengan role-based access control
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
