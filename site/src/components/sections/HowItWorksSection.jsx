import SectionTitle from "../layout/SectionTitle";

export default function HowItWorksSection({ t, theme }) {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <SectionTitle eyebrow={t.how.eyebrow} title={t.how.title} text={t.how.text} theme={theme} />
        <div className="grid gap-4">
          {t.how.steps.map((step, index) => (
            <div key={step.title} className={`rounded-[1.6rem] border p-6 ${theme.card}`}>
              <div className={`mb-2 text-xs font-semibold uppercase tracking-[0.24em] ${theme.panelMuted}`}>0{index + 1}</div>
              <h3 className={`text-xl font-semibold ${theme.title}`}>{step.title}</h3>
              <p className={`mt-2 text-sm leading-7 ${theme.body}`}>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
