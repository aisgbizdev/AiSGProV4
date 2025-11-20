/**
 * Registration Page for AiSG
 * Public self-registration with security question
 */

import { useState } from "react";
import { useLocation, Link, Redirect } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Lock, Mail, Sparkles, HelpCircle, Key, Eye, EyeOff } from "lucide-react";

const SECURITY_QUESTIONS = [
  "Apa nama ibu kandung Anda?",
  "Apa nama hewan peliharaan pertama Anda?",
  "Di kota mana Anda lahir?",
  "Apa nama sekolah dasar Anda?",
  "Apa makanan favorit Anda?",
  "Apa nama sahabat masa kecil Anda?",
];

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // If already logged in, redirect to dashboard
  if (!authLoading && user) {
    return <Redirect to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password match
    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          name,
          email: email || undefined,
          securityQuestion,
          securityAnswer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.userMessage || "Pendaftaran gagal");
      }

      // Auto-login after successful registration, redirect to home
      setLocation("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
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
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-50" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Daftar Akun
            </CardTitle>
            <CardDescription className="text-gray-400">
              Buat akun baru untuk menggunakan AiSG
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                Nama Lengkap
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="pl-10 bg-gray-800/50 border-gray-700 focus:border-purple-500 text-white placeholder:text-gray-500"
                  required
                  autoFocus
                />
              </div>
            </div>

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
                  placeholder="Pilih username (min 3 karakter)"
                  className="pl-10 bg-gray-800/50 border-gray-700 focus:border-purple-500 text-white placeholder:text-gray-500"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Email (optional) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email <span className="text-gray-500 text-xs">(opsional)</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="pl-10 bg-gray-800/50 border-gray-700 focus:border-purple-500 text-white placeholder:text-gray-500"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="pl-10 pr-10 bg-gray-800/50 border-gray-700 focus:border-purple-500 text-white placeholder:text-gray-500"
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">
                Konfirmasi Password
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

            {/* Security Question */}
            <div className="space-y-2">
              <Label htmlFor="securityQuestion" className="text-gray-300 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Pertanyaan Keamanan
              </Label>
              <select
                id="securityQuestion"
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
                required
              >
                {SECURITY_QUESTIONS.map((q) => (
                  <option key={q} value={q} className="bg-gray-800">
                    {q}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Untuk reset password jika lupa
              </p>
            </div>

            {/* Security Answer */}
            <div className="space-y-2">
              <Label htmlFor="securityAnswer" className="text-gray-300">
                Jawaban Keamanan
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="securityAnswer"
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Jawaban Anda"
                  className="pl-10 bg-gray-800/50 border-gray-700 focus:border-purple-500 text-white placeholder:text-gray-500"
                  required
                />
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
                  <span>Mendaftar...</span>
                </div>
              ) : (
                "Daftar Sekarang"
              )}
            </Button>

            {/* Login link */}
            <div className="text-center text-sm">
              <span className="text-gray-400">Sudah punya akun? </span>
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                Login di sini
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
