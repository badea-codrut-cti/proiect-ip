import { useEffect } from "react";

export function XpToast({ xp, onDone }: { xp: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed top-20 right-6 z-50">
      <div className="nc-xp-float rounded-xl border border-sky-200 bg-white px-4 py-2 shadow-lg dark:border-sky-900 dark:bg-slate-900">
        <div className="text-xs font-semibold text-slate-900 dark:text-slate-50">
          ⭐ +{xp} XP
        </div>
        <div className="text-[0.7rem] text-slate-500 dark:text-slate-400">
          Nice!
        </div>
      </div>
    </div>
  );
}
