import SectionTitle from "../layout/SectionTitle";

export default function VisionSection({ t, theme }) {
  return (
    <section id="vision" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <SectionTitle eyebrow={t.vision.eyebrow} title={t.vision.title} text={t.vision.text} theme={theme} />
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {t.vision.cards.map((item) => (
          <div key={item.title} className={`rounded-[1.7rem] border p-6 ${theme.card}`}>
            <h3 className={`text-xl font-semibold ${theme.title}`}>{item.title}</h3>
            <p className={`mt-3 text-sm leading-7 ${theme.body}`}>{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
