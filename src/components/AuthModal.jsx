import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthModal() {
  const { signIn, signUp, authModalOpen: open, closeAuthModal: onClose } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setError("");
      setNotice("");
    }
  }, [open, mode]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!email.trim() || !password) {
      setError("Enter both email and password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { data, error: authError } =
      mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (mode === "signup" && !data.session) {
      // Email confirmation is enabled in the Supabase project — no active session yet.
      setNotice("Account created. Check your inbox to confirm your email before signing in.");
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-lagoon-900/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-sand-50 w-full max-w-md rounded-3xl shadow-2xl p-7 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-lagoon-900"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
          </svg>
        </button>

        <h2 className="font-display text-2xl text-lagoon-900 mb-1">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-driftwood text-sm mb-6">
          {mode === "signin"
            ? "Sign in to track your enquiries and shortlisted activities."
            : "Save your shortlist and enquiries across visits."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-lagoon-900 mb-1.5 block">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@example.com"
              autoComplete="email"
              className="form-input"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-lagoon-900 mb-1.5 block">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="form-input"
            />
          </label>

          {mode === "signup" && (
            <label className="block">
              <span className="text-sm font-medium text-lagoon-900 mb-1.5 block">Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="form-input"
              />
            </label>
          )}

          {error && <p className="text-coral-600 text-sm">{error}</p>}
          {notice && <p className="text-lagoon-600 text-sm">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white font-semibold px-6 py-3 transition-colors"
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-driftwood mt-6 text-center">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button onClick={() => setMode("signup")} className="text-lagoon-700 font-semibold hover:underline">
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} className="text-lagoon-700 font-semibold hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
