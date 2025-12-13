import { useEffect, useState, type FormEvent, type JSX } from "react";
import { Link } from "react-router";
import { LockKeyhole } from "lucide-react";
import { setAuthMode } from "~/utils/authMode";


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

export function meta() { 
  return [
    { title: "Login" },
    { name: "description", content: "Login to your account" },
  ];
}

type AuthMode = "login" | "signup" | "reset";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);


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
      await authClient.requestPasswordReset(email);
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
      await authClient.resetPassword(resetToken, password);
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

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    if (newMode !== "reset") setResetToken("");
  };

  const renderLogin = () => (
    <>
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
          <LockKeyhole className="h-4 w-4" />
        </div>
        <CardTitle className="text-lg font-semibold tracking-wide">
          Welcome back
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="text-xs font-medium text-slate-700"
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

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium text-slate-700"
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
            <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-center text-xs text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-center text-xs text-emerald-700">
              {success}
            </div>
          )}

          <Button
            type="submit"
            className="mt-2 w-full rounded-full text-xs font-semibold uppercase tracking-[0.18em]"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>

          <div className="mt-4 flex flex-col gap-2 text-center text-xs text-slate-600">
            <button
              type="button"
              onClick={() => switchMode("reset")}
              className="hover:underline cursor-pointer"
              disabled={isLoading}
            >
              Forgot password?
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="hover:underline cursor-pointer"
              disabled={isLoading}
            >
              New user? Create an account
            </button>
          </div>
        </form>
      </CardContent>
    </>
  );

  const renderSignup = () => (
    <>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-lg font-semibold tracking-wide">
          Create account
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Sign up to start using Nihongo Count
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="text-xs font-medium text-slate-700"
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

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium text-slate-700"
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

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium text-slate-700"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-medium text-slate-700"
            >
              Confirm password
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
            <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-center text-xs text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-center text-xs text-emerald-700">
              {success}
            </div>
          )}

          <Button
            type="submit"
            className="mt-2 w-full rounded-full text-xs font-semibold uppercase tracking-[0.18em]"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign up"}
          </Button>

          <div className="mt-4 text-center text-xs text-slate-600">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="hover:underline cursor-pointer"
              disabled={isLoading}
            >
              Already have an account? Login
            </button>
          </div>
        </form>
      </CardContent>
    </>
  );

  const renderReset = () => {
    if (resetToken) {
      return (
        <>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-lg font-semibold tracking-wide">
              Reset password
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enter and confirm your new password
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-slate-700"
                >
                  New password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="text-xs font-medium text-slate-700"
                >
                  Confirm password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-center text-xs text-red-600">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-center text-xs text-emerald-700">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                className="mt-2 w-full rounded-full text-xs font-semibold uppercase tracking-[0.18em]"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset password"}
              </Button>

              <div className="mt-4 text-center text-xs text-slate-600">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="hover:underline cursor-pointer"
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
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-lg font-semibold tracking-wide">
            Forgot password
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Enter your email to receive a reset link
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-slate-700"
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
              <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-center text-xs text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-center text-xs text-emerald-700">
                {success}
              </div>
            )}

            <Button
              type="submit"
              className="mt-2 w-full rounded-full text-xs font-semibold uppercase tracking-[0.18em]"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </Button>

            <div className="mt-4 text-center text-xs text-slate-600">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="hover:underline cursor-pointer"
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

  let content: JSX.Element;
  if (mode === "login") content = renderLogin();
  else if (mode === "signup") content = renderSignup();
  else content = renderReset();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-pink-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">
              nihongo count
            </span>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full px-4 text-xs font-semibold tracking-[0.18em] uppercase"
          >
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 bg-slate-50">
        <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-lg">
            {content}
          </Card>
        </section>
      </main>
    </div>
  );
}

