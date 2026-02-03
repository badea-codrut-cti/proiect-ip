import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ShoppingBag, Gem, Check, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/context/AuthContext";
import { MainHeader } from "~/components/MainHeader";
import { apiFetch } from "~/utils/api";

export function meta() {
    return [
        { title: "Profile Picture Shop - Nihongo Count" },
        { name: "description", content: "Purchase profile pictures with your gems" },
    ];
}

interface ProfilePicture {
    id: string;
    name: string;
    description: string;
    cost: number;
}

interface UserProfile {
    gems: number;
    owned_profile_pictures: ProfilePicture[];
}

export default function ShopPage() {
    const navigate = useNavigate();
    const { user: authUser, loading: authLoading } = useAuth();
    const [profilePictures, setProfilePictures] = useState<ProfilePicture[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (!authUser) {
            navigate("/login");
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const [picturesData, profileData] = await Promise.all([
                    apiFetch<{ profile_pictures: ProfilePicture[] }>("/api/profiles/profile-pictures/available"),
                    apiFetch<UserProfile>(`/api/profiles/${authUser.id}`)
                ]);
                setProfilePictures(picturesData.profile_pictures);
                setUserProfile(profileData);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load shop data");
                setLoading(false);
            }
        };

        fetchData();
    }, [authUser, navigate]);

    const handlePurchase = async (pictureId: string, pictureName: string) => {
        if (!authUser) return;

        setPurchaseLoading(pictureId);
        setPurchaseError(null);
        setPurchaseSuccess(null);

        try {
            const result = await apiFetch<{ success: boolean; message: string; gems_remaining: number }>(
                "/api/profiles/buy-profile-picture",
                {
                    method: "POST",
                    body: JSON.stringify({ profilePictureId: pictureId }),
                }
            );

            setPurchaseSuccess(result.message);

            const updatedProfile = await apiFetch<UserProfile>(`/api/profiles/${authUser.id}`);
            setUserProfile(updatedProfile);

            setTimeout(() => setPurchaseSuccess(null), 3000);
        } catch (err) {
            setPurchaseError(err instanceof Error ? err.message : "Purchase failed");
            setTimeout(() => setPurchaseError(null), 3000);
        } finally {
            setPurchaseLoading(null);
        }
    };

    const isOwned = (pictureId: string) => {
        return userProfile?.owned_profile_pictures.some(p => p.id === pictureId) ?? false;
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-slate-500">Loading shop...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                        <Button className="mt-4 w-full" onClick={() => navigate("/")}>Go Home</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col dark:bg-slate-950 dark:text-slate-50">
            <MainHeader />

            <main className="flex-1 bg-slate-50 dark:bg-slate-950">
                <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center justify-center gap-2">
                            <ShoppingBag className="h-8 w-8 text-purple-500" />
                            Profile Picture Shop
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Customize your profile with unique avatars
                        </p>
                    </div>

                    <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Gem className="h-5 w-5 text-emerald-500" />
                                Your Gems
                            </CardTitle>
                            <CardDescription>Earn gems by completing exercises and reviews</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                                    <Gem className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                                        {userProfile?.gems ?? 0}
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        Available Gems
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {purchaseSuccess && (
                        <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
                            {purchaseSuccess}
                        </div>
                    )}

                    {purchaseError && (
                        <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                            {purchaseError}
                        </div>
                    )}

                    <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Available Profile Pictures</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {profilePictures.map((picture) => {
                                    const owned = isOwned(picture.id);
                                    const canAfford = (userProfile?.gems ?? 0) >= picture.cost;
                                    const isPurchasing = purchaseLoading === picture.id;

                                    return (
                                        <div
                                            key={picture.id}
                                            className={`relative flex flex-col p-6 rounded-xl border ${owned
                                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700"
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                                }`}
                                        >
                                            {owned && (
                                                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold">
                                                    <Check className="h-3 w-3" />
                                                    OWNED
                                                </div>
                                            )}

                                            <div className="flex flex-col items-center gap-4 flex-1">
                                                <div className={`flex items-center justify-center w-24 h-24 rounded-full border-4 ${owned
                                                        ? "border-emerald-300 dark:border-emerald-600"
                                                        : "border-slate-200 dark:border-slate-700"
                                                    } bg-slate-100 dark:bg-slate-900 overflow-hidden`}>
                                                    <img
                                                        src={`/icons/profile_pictures/${picture.name}.png`}
                                                        alt={picture.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="text-center flex-1">
                                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 capitalize">
                                                        {picture.name.replace(/_/g, ' ')}
                                                    </h3>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                        {picture.description}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 mt-auto">
                                                    <Gem className="h-5 w-5 text-emerald-500" />
                                                    <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
                                                        {picture.cost}
                                                    </span>
                                                </div>

                                                {!owned && (
                                                    <Button
                                                        onClick={() => handlePurchase(picture.id, picture.name)}
                                                        disabled={!canAfford || isPurchasing}
                                                        className="w-full mt-2"
                                                        variant={canAfford ? "default" : "outline"}
                                                    >
                                                        {isPurchasing ? (
                                                            "Purchasing..."
                                                        ) : !canAfford ? (
                                                            <>
                                                                <Lock className="h-4 w-4 mr-2" />
                                                                Insufficient Gems
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ShoppingBag className="h-4 w-4 mr-2" />
                                                                Purchase
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
