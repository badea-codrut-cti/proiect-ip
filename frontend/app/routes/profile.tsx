import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";

export default function ProfileRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate(`/profile/${user.id}`, { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-slate-500 text-sm">Redirecting to your profile...</div>
    </div>
  );
}
