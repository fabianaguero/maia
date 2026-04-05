export default function SectionTitle({ eyebrow, title, text, theme }) {
  return (
    <div className="max-w-3xl">
      <div className={`mb-3 text-xs font-semibold uppercase tracking-[0.32em] ${theme.eyebrow}`}>{eyebrow}</div>
      <h2 className={`text-3xl font-semibold tracking-tight md:text-5xl ${theme.title}`}>{title}</h2>
      {text ? <p className={`mt-4 text-base leading-7 md:text-lg ${theme.body}`}>{text}</p> : null}
    </div>
  );
}
