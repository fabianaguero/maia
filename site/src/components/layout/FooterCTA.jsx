import { brandAssets } from "../../data/brandAssets";

export default function FooterCTA({ t, theme }) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-8 lg:px-10 lg:pb-32">
      <div className={`overflow-hidden rounded-[2.2rem] border p-8 md:p-10 ${theme.footerWrap} ${theme.footerGradient}`}>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className={`text-xs font-semibold uppercase tracking-[0.28em] ${theme.muted}`}>{t.footer.tagline}</div>
            <div className="mt-5 rounded-2xl bg-slate-950/80 p-4 shadow-[0_0_40px_rgba(34,211,238,0.12)] ring-1 ring-cyan-400/10 w-fit">
              <img src={brandAssets.wordmark} alt="MAIA" className="h-12 w-auto object-contain" />
            </div>
            <h2 className={`mt-6 text-3xl font-semibold tracking-tight md:text-5xl ${theme.title}`}>{t.footer.title}</h2>
            <p className={`mt-4 max-w-2xl text-base leading-7 md:text-lg ${theme.body}`}>{t.footer.text}</p>
          </div>

          <div className={`rounded-[1.8rem] border p-6 ${theme.soft}`}>
            <div className={`text-sm font-medium ${theme.title}`}>{t.footer.ctaTitle}</div>
            <div className={`mt-2 text-xs uppercase tracking-[0.2em] ${theme.muted}`}>{t.footer.tagline}</div>
            <div className={`mt-4 space-y-3 text-sm ${theme.body}`}>
              {t.footer.ctas.map((cta) => (
                <div key={cta} className={`rounded-2xl border px-4 py-3 ${theme.soft}`}>{cta}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
