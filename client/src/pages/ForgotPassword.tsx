/**
 * Forgot Password Page for AiSG
 * Reset password using security question
 */

import { useState } from "react";
import { useLocation, Link, Redirect } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Lock, HelpCircle, Key, Sparkles, CheckCircle, Eye, EyeOff } from "lucide-react";

type Step = "username" | "security" | "newPassword" | "success";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // If already logged in, redirect to dashboard
  if (!authLoading && user) {
    return <Redirect to="/" />;
  }

  // Step 1: Check username and get security question
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/auth/security-question/${username}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.userMessage || "Username tidak ditemukan");
      }

      setSecurityQuestion(data.securityQuestion);
      setStep("security");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify security answer and show password form
  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStep("newPassword");
  };

  // Step 3: Reset password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          securityAnswer,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.userMessage || "Reset password gagal");
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setLocation("/login");
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
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-50" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                {step === "success" ? (
                  <CheckCircle className="w-8 h-8 text-white" />
                ) : (
                  <Sparkles className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {step === "success" ? "Berhasil!" : "Lupa Password"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {step === "username" && "Masukkan username untuk reset password"}
              {step === "security" && "Jawab pertanyaan keamanan Anda"}
              {step === "newPassword" && "Buat password baru"}
              {step === "success" && "Password berhasil direset"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* Step 1: Username */}
          {step === "username" && (
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
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

              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-900/50">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mencari...</span>
                  </div>
                ) : (
                  "Lanjutkan"
                )}
              </Button>

              <div className="text-center text-sm">
                <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                  ← Kembali ke Login
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: Security Question */}
          {step === "security" && (
            <form onSubmit={handleSecuritySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Pertanyaan Keamanan
                </Label>
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-md">
                  <p className="text-purple-300 text-sm">{securityQuestion}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="securityAnswer" className="text-gray-300">
                  Jawaban Anda
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="securityAnswer"
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="Masukkan jawaban"
                    className="pl-10 bg-gray-800/50 border-gray-700 focus:border-purple-500 text-white placeholder:text-gray-500"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-900/50">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-300"
              >
                Lanjutkan
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setStep("username")}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  ← Kembali
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === "newPassword" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-300">
                  Password Baru
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="pl-10 pr-10 bg-gray-800/50 border-gray-700 focus:border-purple-500 text-white placeholder:text-gray-500"
                    autoComplete="new-password"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  Konfirmasi Password Baru
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password"
                    className="pl-10 pr-10 bg-gray-800/50 border-gray-700 focus:border-purple-500 text-white placeholder:text-gray-500"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-900/50">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mereset...</span>
                  </div>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setStep("security")}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  ← Kembali
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400">
                  Password Anda berhasil direset! Sekarang Anda bisa login dengan password baru.
                </p>
              </div>

              <Button
                onClick={handleBackToLogin}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-300"
              >
                Login Sekarang
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
