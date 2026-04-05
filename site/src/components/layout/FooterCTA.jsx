export default function FooterCTA({ t, theme, isDark }) {
  return (
    <footer className={`border-t ${theme.soft}`}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className={`rounded-[2rem] border p-10 text-center ${theme.card}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme.eyebrow}`}>
            {t.footer.tagline}
          </p>
          <h2 className={`mt-4 text-4xl font-semibold lg:text-5xl ${theme.title}`}>
            {t.footer.title}
          </h2>
          <p className={`mx-auto mt-5 max-w-2xl text-base leading-7 ${theme.body}`}>
            {t.footer.text}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {t.footer.ctas.map((cta) => (
              <button
                key={cta}
                className={`rounded-2xl border px-6 py-3 text-sm font-medium transition hover:border-cyan-300/50 hover:text-cyan-300 ${theme.control}`}
              >
                {cta}
              </button>
            ))}
          </div>
        </div>
        <p className={`mt-10 text-center text-xs ${theme.muted}`}>
          © {new Date().getFullYear()} MAIA · Local-first · No cloud. No auth. No tracking.
        </p>
      </div>
    </footer>
  );
}
