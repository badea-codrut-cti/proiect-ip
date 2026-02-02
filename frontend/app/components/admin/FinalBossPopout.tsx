import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";

export function FinalBossPopout({
  open,
  onClose,
  title = "All tasks cleared!",
  subtitle = "Queue eliminated. Good job.",
  videoSrc = "/video/well-done.mp4",
  autoCloseOnVideoEnd = true,
  showCloseButton = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  videoSrc?: string;
  autoCloseOnVideoEnd?: boolean;
  showCloseButton?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      const v = videoRef.current;
      if (!v) return;
      v.pause();
      v.currentTime = 0;
      setStarted(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* FULLSCREEN CONTAINER */}
      <div className="relative h-full w-full overflow-hidden bg-slate-950 animate-in fade-in duration-300">
        {/* Ambient effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-sky-400/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-pink-400/25 blur-3xl" />
        </div>

        {/* VIDEO */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
          playsInline
          onEnded={() => autoCloseOnVideoEnd && onClose()}
        />

        {/* CLICK TO START (required for sound) */}
        {!started && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 cursor-pointer"
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              v.currentTime = 0;
              v.muted = false;
              v.play();
              setStarted(true);
            }}
          >
            <div className="text-center text-white">
              <Sparkles className="mx-auto mb-4 h-10 w-10 animate-pulse" />
              <p className="text-sm uppercase tracking-widest opacity-80">
                Click to unleash
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                Well done
              </h2>
            </div>
          </div>
        )}

        {/* UI OVERLAY */}
        {started && (
          <div className="relative z-20 flex h-full flex-col justify-between p-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Admin Flow
              </div>

              <h1 className="mt-4 text-4xl font-bold text-white">
                {title}
              </h1>
              <p className="mt-2 text-lg text-white/70">
                {subtitle}
              </p>
            </div>

            {showCloseButton && (
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="rounded-full bg-white/90"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
