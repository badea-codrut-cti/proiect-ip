import { useState, useEffect } from "react";
import { Link } from "react-router";
import { MainHeader } from "~/components/MainHeader";
import { useAuth } from "~/context/AuthContext";
import { authClient } from "~/utils/authClient";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

interface Application {
    id: string;
    applied_at: string;
    description: string;
    jlpt_level: number | null;
    status: 'pending' | 'approved' | 'rejected';
}

export default function ContributorApply() {
    const { user, loading: authLoading } = useAuth();
    const [description, setDescription] = useState("");
    const [jlptLevel, setJlptLevel] = useState<string>("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loadingApps, setLoadingApps] = useState(true);

    useEffect(() => {
        if (user) {
            fetchApplications();
        }
    }, [user]);

    const fetchApplications = async () => {
        try {
            setLoadingApps(true);
            const apps = await authClient.getContributorApplications();
            setApplications(apps);
        } catch (err) {
            console.error("Failed to fetch applications:", err);
        } finally {
            setLoadingApps(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            await authClient.applyForContributor(
                description,
                jlptLevel ? parseInt(jlptLevel) : null
            );
            setSuccess(true);
            fetchApplications();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit application");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="animate-pulse text-slate-500 uppercase tracking-widest text-xs">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
                <MainHeader />
                <main className="max-w-4xl mx-auto px-4 py-12 text-center">
                    <h1 className="text-2xl font-bold mb-4">Login required</h1>
                    <p className="mb-6">You must be logged in to apply for the contributor role.</p>
                    <Button asChild>
                        <Link to="/login">Login / Register</Link>
                    </Button>
                </main>
            </div>
        );
    }

    if (user.role === "contributor" || user.role === "admin") {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors text-slate-900 dark:text-slate-100">
                <MainHeader activeNav="contrib" />
                <main className="max-w-4xl mx-auto px-4 py-12 text-center">
                    <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            ✓
                        </div>
                        <h1 className="text-2xl font-bold mb-2">You are already a contributor</h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Thank you for being part of the team! You have access to all contributor tools.
                        </p>
                        <Button asChild variant="outline">
                            <Link to="/contributions">Go to Contribution Dashboard</Link>
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    const pendingApp = applications.find(app => app.status === 'pending');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors text-slate-900 dark:text-slate-100">
            <MainHeader />

            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Become a Contributor</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Help us expand Nihongo Count by creating and editing exercises and documentation.
                        </p>
                    </div>

                    {success ? (
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                ✓
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Application Submitted!</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                Your application has been successfully submitted. We will review it and notify you of the outcome.
                            </p>
                            <Button onClick={() => setSuccess(false)}>View Applications</Button>
                        </div>
                    ) : pendingApp ? (
                        <Card className="border-sky-200 bg-sky-50/50 dark:border-sky-900/50 dark:bg-sky-900/10">
                            <CardHeader>
                                <CardTitle className="text-lg">Application Pending</CardTitle>
                                <CardDescription>
                                    You already have a pending application submitted on {new Date(pendingApp.applied_at).toLocaleDateString()}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                    " {pendingApp.description.length > 200 ? pendingApp.description.substring(0, 200) + "..." : pendingApp.description} "
                                </p>
                                <div className="mt-4 pt-4 border-t border-sky-100 dark:border-sky-900/30">
                                    <p className="text-xs text-sky-700 dark:text-sky-300">
                                        Please wait for an administrator to review your request.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                <CardTitle>Application Form</CardTitle>
                                <CardDescription>Tell us about your Japanese knowledge and why you want to contribute.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label htmlFor="description" className="text-sm font-medium">
                                            Tell us about yourself *
                                        </label>
                                        <Textarea
                                            id="description"
                                            placeholder="Your background in Japanese, experience with counting, and why you'd like to help..."
                                            className="min-h-[150px] resize-none"
                                            value={description}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                            required
                                            maxLength={5000}
                                        />
                                        <p className="text-[10px] text-slate-400 text-right">{description.length}/5000</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="jlptLevel" className="text-sm font-medium">
                                            What is your estimated JLPT level? (Optional)
                                        </label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {[5, 4, 3, 2, 1].map((level) => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setJlptLevel(level.toString())}
                                                    className={`py-2 rounded-md text-sm font-medium transition-all ${jlptLevel === level.toString()
                                                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md"
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                                        }`}
                                                >
                                                    N{level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-md text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full h-11"
                                        disabled={isSubmitting || description.trim().length < 20}
                                    >
                                        {isSubmitting ? "Submitting..." : "Submit Application"}
                                    </Button>
                                    <p className="text-[10px] text-center text-slate-400">
                                        * Minimum 20 characters required. We usually review applications within 48 hours.
                                    </p>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {applications.length > 0 && (
                        <div className="mt-12">
                            <h2 className="text-xl font-bold mb-4">Past Applications</h2>
                            <div className="space-y-4">
                                {applications.map((app) => (
                                    <div
                                        key={app.id}
                                        className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="text-sm font-medium mb-1">
                                                Applied on {new Date(app.applied_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-slate-400 line-clamp-1 max-w-md">
                                                {app.description}
                                            </div>
                                        </div>
                                        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${app.status === 'approved'
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : app.status === 'rejected'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                            {app.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
