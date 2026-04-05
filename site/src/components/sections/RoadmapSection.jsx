import SectionTitle from "../layout/SectionTitle";

function RoadmapColumn({ label, title, items, toneClass, theme }) {
  return (
    <div className={`rounded-[1.7rem] border p-6 ${toneClass}`}>
      <div className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme.accentText}`}>{label}</div>
      <h4 className={`mt-3 text-2xl font-semibold ${theme.title}`}>{title}</h4>
      <div className={`mt-5 space-y-4 text-sm leading-7 ${theme.body}`}>
        {items.map((item) => (
          <div key={item.label} className={`rounded-2xl border p-4 ${theme.soft}`}>
            <div className={`text-xs uppercase tracking-[0.18em] ${theme.panelMuted}`}>{item.label}</div>
            <div className="mt-2">{item.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RoadmapSection({ t, theme }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <div className={`rounded-[2rem] border p-8 ${theme.card}`}>
        <SectionTitle eyebrow={t.roadmap.eyebrow} title={t.roadmap.title} text={t.roadmap.text} theme={theme} />
        <div className="mt-10 grid gap-5 xl:grid-cols-3">
          <RoadmapColumn {...t.roadmap.columns.now} toneClass={theme.roadmapNow} theme={theme} />
          <RoadmapColumn {...t.roadmap.columns.next} toneClass={theme.roadmapNext} theme={theme} />
          <RoadmapColumn {...t.roadmap.columns.later} toneClass={theme.roadmapLater} theme={theme} />
        </div>
        <div className={`mt-8 rounded-[1.5rem] border p-5 ${theme.recommendation}`}>
          <div className={`text-xs font-semibold uppercase tracking-[0.2em] ${theme.panelMuted}`}>{t.roadmap.recommendationLabel}</div>
          <p className={`mt-3 max-w-4xl text-sm leading-7 ${theme.body}`}>{t.roadmap.recommendation}</p>
        </div>
      </div>
    </section>
  );
}
