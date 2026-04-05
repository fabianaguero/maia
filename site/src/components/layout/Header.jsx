import { Moon, Sun } from "lucide-react";

export default function Header({ t, theme, lang, setLang, isDark, setIsDark }) {
  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-md ${theme.soft}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <span className={`text-lg font-bold tracking-tight ${theme.title}`}>MAIA</span>

        <nav className="hidden gap-7 text-sm font-medium md:flex">
          {[
            { label: t.nav.product, href: "#product" },
            { label: t.nav.how, href: "#how" },
            { label: t.nav.mvp, href: "#mvp" },
            { label: t.nav.vision, href: "#vision" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`transition hover:text-cyan-300 ${theme.muted}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${theme.control}`}
          >
            {t.controls.lang}
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label={isDark ? t.controls.theme.light : t.controls.theme.dark}
            className={`rounded-xl border p-2 transition ${theme.control}`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
