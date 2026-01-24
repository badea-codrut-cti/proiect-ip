import { Link, Navigate, useLoaderData } from "react-router";
import { MainHeader } from "~/components/MainHeader";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { BookOpen } from "lucide-react";
import { useAuth } from "~/context/AuthContext";

export function meta() {
  return [
    { title: "Counters – Nihongo Count" },
    { name: "description", content: "Browse all Japanese counters" },
  ];
}

interface CounterListItem {
  id: string;
  name: string;
}

interface LoaderData {
  counters: CounterListItem[];
}

export async function loader() {
  const browserBase =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const apiUrl = browserBase;

  const res = await fetch(`${apiUrl}/api/counters`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Response("Failed to load counters", { status: res.status });
  }

  const raw = await res.json();

  const counters: CounterListItem[] = Array.isArray(raw)
    ? raw
    : raw.counters ?? [];

  return { counters } as LoaderData;
}

export default function CountersPage() {
  const { counters } = useLoaderData<typeof loader>();

  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Loading…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 flex flex-col">
      <MainHeader activeNav="counters" />

      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">

          <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                Counters Library
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Browse all Japanese counters available in the system and start
                learning them.
              </p>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Total counters:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {counters.length}
              </span>
            </p>
          </section>

          <section>
            <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  All Counters
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Select a counter and click “Learn” to see detailed
                  information and examples.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {counters.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No counters found in the database.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {counters.map((counter) => (
                      <div
                        key={counter.id}
                        className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                              {counter.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              ID: {counter.id}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            asChild
                            size="sm"
                            className="rounded-full text-xs font-semibold tracking-[0.18em] uppercase"
                          >
                            <Link to={`/counters/${counter.id}`}>
                              Learn
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
