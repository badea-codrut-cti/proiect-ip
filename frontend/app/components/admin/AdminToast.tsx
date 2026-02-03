import { useEffect } from "react";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";

export type AdminToastType = "success" | "error" | "info";

export function AdminToast({
  open,
  type,
  title,
  subtitle,
  onClose,
}: {
  open: boolean;
  type: AdminToastType;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  const icon =
    type === "success" ? (
      <CheckCircle2 className="h-4 w-4 animate-[scale_0.25s_ease-out_1]" />
    ) : type === "error" ? (
      <XCircle className="h-4 w-4 animate-[scale_0.25s_ease-out_1]" />
    ) : (
      <Sparkles className="h-4 w-4 animate-[scale_0.25s_ease-out_1]" />
    );

  const tone =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/15 dark:text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_0_24px_rgba(16,185,129,0.35)]"
      : type === "error"
      ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/15 dark:text-rose-200 shadow-[0_0_0_1px_rgba(244,63,94,0.3),0_0_24px_rgba(0,0,0,0.45)]"
      : "border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 shadow-[0_0_20px_rgba(148,163,184,0.25)]";

  return (
    <div className="fixed top-4 right-4 z-[9999]">
      <div
        className={
          "w-[280px] rounded-2xl border px-4 py-3 shadow-lg " +
          "transition-all ease-out " +
          "animate-[toastPop_420ms_cubic-bezier(.16,1,.3,1)_1] " +
          "motion-reduce:animate-none motion-reduce:transition-none " +
          "will-change-transform will-change-opacity " +
          tone
        }
      >
        <div className="flex items-start gap-2">
          <div className="mt-0.5">{icon}</div>
          <div className="flex-1">
            <div className="text-xs font-semibold">{title}</div>
            {subtitle && (
              <div className="mt-0.5 text-[0.7rem] opacity-80">
                {subtitle}
              </div>
            )}
          </div>
        </div>
      </div>

      
    </div>
  );
}
