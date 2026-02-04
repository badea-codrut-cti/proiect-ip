import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/context/AuthContext";
import { MainHeader } from "~/components/MainHeader";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Nihongo Count" },
    {
      name: "description",
      content: "Practice Japanese counters with Nihongo Count.",
    },
  ];
}

import { WalkthroughStep } from "~/components/WalkthroughStep";

export default function Home() {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  return (
    <div className="home-page min-h-screen bg-slate-50 text-slate-900 flex flex-col dark:bg-slate-950 dark:text-slate-50">
      <MainHeader activeNav="home" />

      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col items-center justify-center px-4 py-8 text-center">
          <WalkthroughStep
            step="welcome"
            title="Welcome to Nihongo Count! 🎌"
            description="Master Japanese counters with our interactive SRS training system. Ready for a quick tour?"
          >
            <h1 className="text-4xl md:text-5xl font-semibold tracking-[0.35em] uppercase text-slate-900 dark:text-slate-50">
              NIHONGO COUNT
            </h1>
          </WalkthroughStep>
          

          {!isAuthenticated && !loading && (
            <Button
              asChild
              className="mt-8 rounded-full px-6 text-xs font-semibold tracking-[0.18em] uppercase"
            >
              <Link to="/login">Login / Register</Link>
            </Button>
          )}
        </section>
      </main>
    </div>
  );
}
