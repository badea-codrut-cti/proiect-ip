import { Moon, Sun } from "lucide-react";
import { useTheme } from "~/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-6 w-11 items-center rounded-full bg-slate-200 px-1 
                 transition-colors hover:bg-slate-300
                 dark:bg-slate-700 dark:hover:bg-slate-600"
      aria-label="Toggle dark mode"
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform
          ${isDark ? "translate-x-5" : "translate-x-0"}`}
      />
      <span className="flex w-full items-center justify-between text-[0.6rem] text-slate-500 dark:text-slate-200">
        <Sun className="h-3 w-3" />
        <Moon className="h-3 w-3" />
      </span>
    </button>
  );
}
