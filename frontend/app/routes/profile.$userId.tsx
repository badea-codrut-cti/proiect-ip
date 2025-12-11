import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export function meta() {
  return [
    { title: "User Profile" },
    { name: "description", content: "View user profile" },
  ];
}

interface ProfilePicture {
  id: number;
  name: string;
  description: string;
  cost?: number;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  xp: number;
  gems: number;
  joined_at: string;
  current_profile_picture: ProfilePicture | null;
  owned_profile_pictures: ProfilePicture[];
}

export default function UserProfile() {
  const params = useParams();
  const userId = params.userId;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    fetch(`${apiUrl}/api/profiles/${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        return response.json();
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load profile");
        setLoading(false);
      });
  }, [userId, apiUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div>Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "Profile not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{profile.username}</CardTitle>
            <CardDescription>{profile.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">XP</p>
                <p className="text-2xl font-bold">{profile.xp}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Gems</p>
                <p className="text-2xl font-bold text-purple-600">{profile.gems}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Joined</p>
              <p>{new Date(profile.joined_at).toLocaleDateString()}</p>
            </div>
            {profile.current_profile_picture && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Current Profile Picture</p>
                <div className="p-4 border rounded-lg bg-white">
                  <p className="font-semibold">{profile.current_profile_picture.name}</p>
                  <p className="text-sm text-gray-600">{profile.current_profile_picture.description}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {profile.owned_profile_pictures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Owned Profile Pictures</CardTitle>
              <CardDescription>
                {profile.owned_profile_pictures.length} picture(s) owned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.owned_profile_pictures.map((pic) => (
                  <div key={pic.id} className="p-4 border rounded-lg bg-white">
                    <p className="font-semibold">{pic.name}</p>
                    <p className="text-sm text-gray-600">{pic.description}</p>
                    {pic.cost !== undefined && (
                      <p className="text-sm text-purple-600 mt-2">Cost: {pic.cost} gems</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
