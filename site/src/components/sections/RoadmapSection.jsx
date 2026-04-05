export default function RoadmapSection({ t, theme }) {
  const { now, next, later } = t.roadmap.columns;
  const colClass = [theme.card, theme.card, theme.card];
  const cols = [now, next, later];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <div className={`rounded-[2rem] border p-8 ${theme.card}`}>
        <div className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme.panelMuted}`}>{t.roadmap.eyebrow}</div>
        <h3 className={`mt-3 text-3xl font-semibold ${theme.title}`}>{t.roadmap.title}</h3>
        <p className={`mt-4 max-w-4xl text-base leading-7 ${theme.body}`}>{t.roadmap.text}</p>
        <div className="mt-10 grid gap-5 xl:grid-cols-3">
          {cols.map((col, idx) => (
            <div key={col.label} className={`rounded-[1.7rem] border p-6 ${colClass[idx]}`}>
              <div className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme.eyebrow}`}>{col.label}</div>
              <h4 className={`mt-3 text-2xl font-semibold ${theme.title}`}>{col.title}</h4>
              <div className={`mt-5 space-y-4 text-sm leading-7 ${theme.body}`}>
                {col.items.map((item) => (
                  <div key={item.label} className={`rounded-2xl border p-4 ${theme.soft}`}>
                    <div className={`text-xs uppercase tracking-[0.18em] ${theme.panelMuted}`}>{item.label}</div>
                    <div className="mt-2">{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={`mt-8 rounded-[1.5rem] border p-5 ${theme.soft}`}>
          <div className={`text-xs font-semibold uppercase tracking-[0.2em] ${theme.panelMuted}`}>{t.roadmap.recommendationLabel}</div>
          <p className={`mt-3 max-w-4xl text-sm leading-7 ${theme.body}`}>{t.roadmap.recommendation}</p>
        </div>
      </div>
    </section>
  );
}
