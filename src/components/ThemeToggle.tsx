import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
type Theme = "light" | "dark";
function preferredTheme(): Theme {
  const saved = localStorage.getItem("stepfin-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(preferredTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("stepfin-theme", theme);
  }, [theme]);
  const nextTheme = theme === "dark" ? "light" : "dark";
  return <button type="button" className={`theme-toggle ${className}`.trim()} onClick={() => setTheme(nextTheme)}
    aria-label={`Ativar tema ${nextTheme === "dark" ? "escuro" : "claro"}`}
    title={`Ativar tema ${nextTheme === "dark" ? "escuro" : "claro"}`}>
    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
  </button>;
}
