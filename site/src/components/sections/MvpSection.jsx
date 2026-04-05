export default function MvpSection({ t, theme }) {
  return (
    <section id="mvp" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className={`rounded-[2rem] border p-8 ${theme.card}`}>
          <h3 className={`text-3xl font-semibold ${theme.title}`}>{t.mvp.title}</h3>
          <p className={`mt-4 max-w-2xl text-base leading-7 ${theme.body}`}>{t.mvp.text}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {t.mvp.items.map((item) => (
              <div key={item} className={`rounded-2xl border px-4 py-3 text-sm ${theme.soft} ${theme.title}`}>{item}</div>
            ))}
          </div>
        </div>
        <div className={`rounded-[2rem] border p-8 ${theme.card}`}>
          <div className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme.panelMuted}`}>{t.mvp.framingTitle}</div>
          <div className={`mt-6 space-y-5 text-sm leading-7 ${theme.body}`}>
            {t.mvp.framing.map((item) => (
              <p key={item.label}><span className={`font-semibold ${theme.title}`}>{item.label}:</span> {item.text}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
