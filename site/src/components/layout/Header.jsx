import { Globe2, Moon, Sun } from "lucide-react";
import { brandAssets } from "../../data/brandAssets";

export default function Header({ t, theme, lang, setLang, isDark, setIsDark }) {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6 lg:px-10">
      <a href="#top" className={`group flex items-center gap-3 rounded-2xl border px-3 py-2 ${theme.soft}`}>
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-slate-950/60 ring-1 ring-cyan-400/20">
          <img src={brandAssets.icon} alt="MAIA icon" className="h-10 w-10 object-contain" />
        </div>
        <div className="hidden rounded-xl bg-slate-950/80 px-3 py-2 sm:block">
          <img src={brandAssets.wordmark} alt="MAIA" className="h-6 w-auto object-contain" />
        </div>
      </a>

      <div className="flex items-center gap-3">
        <nav className={`hidden items-center gap-8 text-sm md:flex ${theme.body}`}>
          <a href="#product" className="transition hover:text-cyan-300">{t.nav.product}</a>
          <a href="#how-it-works" className="transition hover:text-cyan-300">{t.nav.how}</a>
          <a href="#mvp" className="transition hover:text-cyan-300">{t.nav.mvp}</a>
          <a href="#vision" className="transition hover:text-cyan-300">{t.nav.vision}</a>
        </nav>

        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "es" : "en")}
          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${theme.control}`}
        >
          <Globe2 className="h-4 w-4" />
          {t.controls.lang}
        </button>

        <button
          type="button"
          onClick={() => setIsDark(!isDark)}
          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${theme.control}`}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? t.controls.theme.light : t.controls.theme.dark}
        </button>
      </div>
    </header>
  );
}
