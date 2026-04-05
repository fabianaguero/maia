export default function SectionTitle({ eyebrow, title, text, classes = {} }) {
  return (
    <div className="max-w-3xl">
      {eyebrow && (
        <div className={`mb-4 text-xs font-semibold uppercase tracking-[0.24em] ${classes.eyebrow ?? ""}`}>
          {eyebrow}
        </div>
      )}
      <h2 className={`text-4xl font-semibold leading-tight lg:text-5xl ${classes.title ?? ""}`}>
        {title}
      </h2>
      {text && (
        <p className={`mt-5 text-base leading-7 ${classes.body ?? ""}`}>{text}</p>
      )}
    </div>
  );
}
