"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setError("");
    setLoading(false);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-forest-950">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold text-green-400 mb-2">Vinacado</h1>
          <div className="bg-forest-800/80 border border-forest-700/30 rounded-2xl p-6 mt-6">
            <p className="text-lg font-semibold mb-2">Check your email</p>
            <p className="text-sm text-forest-400">
              We sent a confirmation link to <span className="text-white font-medium">{email}</span>. Click the link to activate your account.
            </p>
          </div>
          <Link href="/login" className="text-sm text-green-400 hover:underline mt-6 inline-block">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-forest-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-400 mb-1">Vinacado</h1>
          <p className="text-forest-400 text-sm">Join the World Cup 2026 Pool</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-forest-300 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-forest-800 border border-forest-700 text-white placeholder-forest-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-forest-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-forest-800 border border-forest-700 text-white placeholder-forest-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="you@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-forest-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-forest-800 border border-forest-700 text-white placeholder-forest-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 active:scale-[0.97] text-white font-semibold transition-all disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-forest-400 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-green-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
