/**
 * Auth Form Component
 * Unified sign in / sign up form with smooth animations
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/providers/auth-provider";
import { useTheme } from "@/lib/providers/theme-provider";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  onToggleMode: () => void;
}

export function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const { signIn, signUp } = useAuth();
  const { theme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "sign-in") {
        await signIn(email, password);
      } else {
        if (!fullName.trim()) {
          setError("Please enter your full name");
          setLoading(false);
          return;
        }
        await signUp(email, password, fullName);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  const isSignUp = mode === "sign-up";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        padding: 40,
        background: theme.bgCard,
        borderRadius: 16,
        border: `1px solid ${theme.borderMuted}`,
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      }}
    >
      {/* Logo/Title */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentLight} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 8,
          }}
        >
          Roxy AI
        </div>
        <div
          style={{
            fontSize: 14,
            color: theme.textMuted,
          }}
        >
          {isSignUp ? "Create your account" : "Welcome back"}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: theme.textPrimary,
                marginBottom: 8,
              }}
            >
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: 14,
                background: theme.bg,
                border: `1px solid ${theme.borderMuted}`,
                borderRadius: 8,
                color: theme.textPrimary,
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.accent;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.borderMuted;
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: theme.textPrimary,
              marginBottom: 8,
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: 14,
              background: theme.bg,
              border: `1px solid ${theme.borderMuted}`,
              borderRadius: 8,
              color: theme.textPrimary,
              outline: "none",
              transition: "all 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.accent;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.borderMuted;
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: theme.textPrimary,
              marginBottom: 8,
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: 14,
              background: theme.bg,
              border: `1px solid ${theme.borderMuted}`,
              borderRadius: 8,
              color: theme.textPrimary,
              outline: "none",
              transition: "all 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.accent;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.borderMuted;
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: 20,
              background: `${theme.error}15`,
              border: `1px solid ${theme.error}40`,
              borderRadius: 8,
              fontSize: 13,
              color: theme.error,
            }}
          >
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 24px",
            fontSize: 14,
            fontWeight: 600,
            color: "#ffffff",
            background: loading ? theme.borderMuted : theme.accent,
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = `0 4px 12px ${theme.accent}40`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
        </button>
      </form>

      {/* Toggle Mode */}
      <div
        style={{
          marginTop: 24,
          textAlign: "center",
          fontSize: 13,
          color: theme.textMuted,
        }}
      >
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={onToggleMode}
          style={{
            background: "none",
            border: "none",
            color: theme.accent,
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = "none";
          }}
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </div>
    </div>
  );
}
