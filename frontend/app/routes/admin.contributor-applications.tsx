import { useState, useEffect } from "react";
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
import { Textarea } from "~/components/ui/textarea";

interface PendingApplication {
    id: string;
    applied_at: string;
    description: string;
    jlpt_level: number | null;
    username: string;
    email: string;
}

export default function AdminContributorApplications() {
    const { user, loading: authLoading } = useAuth();
    const [applications, setApplications] = useState<PendingApplication[]>([]);
    const [loadingApps, setLoadingApps] = useState(true);
    const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (user?.role === "admin") {
            fetchApplications();
        }
    }, [user]);

    const fetchApplications = async () => {
        try {
            setLoadingApps(true);
            const data = await authClient.getPendingContributorApplications();
            setApplications(data);
        } catch (err) {
            console.error("Failed to fetch pending applications:", err);
        } finally {
            setLoadingApps(false);
        }
    };

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            await authClient.approveContributorApplication(id);
            setApplications(applications.filter(app => app.id !== id));
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to approve application");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = rejectionReason[id];
        if (!reason) {
            alert("Please provide a reason for rejection");
            return;
        }

        setProcessingId(id);
        try {
            await authClient.rejectContributorApplication(id, reason);
            setApplications(applications.filter(app => app.id !== id));
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to reject application");
        } finally {
            setProcessingId(null);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="animate-pulse text-slate-500 uppercase tracking-widest text-xs">Loading...</div>
            </div>
        );
    }

    if (user?.role !== "admin") {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
                <MainHeader />
                <main className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="text-4xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold mb-2 uppercase tracking-widest text-slate-900 dark:text-slate-100">Access Denied</h1>
                    <p className="text-slate-500 dark:text-slate-400">Admin privileges are required to view this page.</p>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <MainHeader activeNav="admin" />

            <main className="max-w-5xl mx-auto px-4 py-12">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Contributor Applications</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Review and manage user requests for contributor status.
                        </p>
                    </div>
                    <div className="text-xs font-mono bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-400">
                        {applications.length} PENDING
                    </div>
                </div>

                {loadingApps ? (
                    <div className="grid gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-white dark:bg-slate-900 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800" />
                        ))}
                    </div>
                ) : applications.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                        <div className="text-4xl mb-4">🎉</div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">All caught up!</h2>
                        <p className="text-slate-500 dark:text-slate-400">There are no pending contributor applications at this time.</p>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {applications.map((app) => (
                            <Card key={app.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">{app.username}</CardTitle>
                                        <CardDescription>{app.email}</CardDescription>
                                    </div>
                                    <div className="text-right text-xs text-slate-400">
                                        <div>Applied {new Date(app.applied_at).toLocaleDateString()}</div>
                                        <div className="mt-1">{new Date(app.applied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 space-y-4">
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Message from Applicant</h4>
                                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm border border-slate-100 dark:border-slate-800/50 leading-relaxed italic">
                                                    "{app.description}"
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">JLPT Level</h4>
                                                    <div className="inline-flex items-center justify-center h-8 w-12 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-md font-bold text-sm">
                                                        {app.jlpt_level ? `N${app.jlpt_level}` : '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-6">
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Actions</h4>
                                                <Button
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
                                                    onClick={() => handleApprove(app.id)}
                                                    disabled={processingId !== null}
                                                >
                                                    {processingId === app.id ? "Processing..." : "Approve Application"}
                                                </Button>
                                            </div>

                                            <div className="space-y-2 pt-2">
                                                <Textarea
                                                    placeholder="Reason for rejection (required)..."
                                                    className="text-xs resize-none"
                                                    value={rejectionReason[app.id] || ""}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason({ ...rejectionReason, [app.id]: e.target.value })}
                                                />
                                                <Button
                                                    variant="destructive"
                                                    className="w-full"
                                                    onClick={() => handleReject(app.id)}
                                                    disabled={processingId !== null}
                                                >
                                                    {processingId === app.id ? "Processing..." : "Reject"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
