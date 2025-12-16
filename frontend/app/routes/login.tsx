import { useEffect, useState, type FormEvent } from "react";
import type { Route } from "./+types/login";
import { Link } from "react-router";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

import { authClient } from "~/utils/authClient";
import { setAuthMode } from "~/utils/authMode";
import { ThemeToggle } from "~/components/ThemeToggle";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login – Nihongo Count" },
    { name: "description", content: "Login to your Nihongo Count account" },
  ];
}

type ViewMode = "login" | "signup" | "reset";

export default function Auth() {
  const [mode, setMode] = useState<ViewMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      setMode("reset");
    }
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await authClient.login(username, password);
      setAuthMode("real");
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await authClient.signup(username, email, password);
      setAuthMode("real");
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${apiUrl}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send reset email");
      }

      setSuccess("Password reset link sent to your email");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset email"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: resetToken, newPassword: password }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Password reset failed");
      }

      setSuccess("Password reset successful!");
      setMode("login");
      setPassword("");
      setConfirmPassword("");
      setResetToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: ViewMode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const renderLoginForm = () => (
    <>
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-md dark:bg-slate-100 dark:text-slate-900">
          <span className="text-lg" aria-hidden="true">
            🔒
          </span>
        </div>
        <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Welcome back
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="your.username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          {success && (
            <div className="text-green-500 text-sm text-center">
              {success}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>

          <div className="flex flex-col gap-2 text-sm text-center">
            <button
              type="button"
              onClick={() => switchMode("reset")}
              className="text-blue-600 hover:underline"
              disabled={isLoading}
            >
              Forgot password?
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="text-blue-600 hover:underline"
              disabled={isLoading}
            >
              New user? Create an account
            </button>
          </div>
        </form>
      </CardContent>
    </>
  );

  const renderSignupForm = () => (
    <>
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Create an account
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Start tracking your Japanese counters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Choose a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          {success && (
            <div className="text-green-500 text-sm text-center">
              {success}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>

          <div className="text-sm text-center">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-blue-600 hover:underline"
              disabled={isLoading}
            >
              Already have an account? Login
            </button>
          </div>
        </form>
      </CardContent>
    </>
  );

  const renderResetForm = () => {
    if (resetToken) {
      return (
        <>
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Reset Password
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Enter your new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  New Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-green-500 text-sm text-center">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>

              <div className="text-sm text-center">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-blue-600 hover:underline"
                  disabled={isLoading}
                >
                  Back to login
                </button>
              </div>
            </form>
          </CardContent>
        </>
      );
    }

    return (
      <>
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Reset Password
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Enter your email to receive a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            {success && (
              <div className="text-green-500 text-sm text-center">
                {success}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-sm text-center">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-blue-600 hover:underline"
                disabled={isLoading}
              >
                Back to login
              </button>
            </div>
          </form>
        </CardContent>
      </>
    );
  };

  const renderForm = () => {
    if (mode === "login") return renderLoginForm();
    if (mode === "signup") return renderSignupForm();
    return renderResetForm();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
      <div className="absolute top-4 left-4">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full px-3 text-xs"
        >
          <Link to="/">← Back to Home</Link>
        </Button>
      </div>

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md px-4">
        <Card className="border border-slate-200 shadow-sm bg-white dark:border-slate-800 dark:bg-slate-900">
          {renderForm()}
        </Card>
      </div>
    </div>
  );
}
