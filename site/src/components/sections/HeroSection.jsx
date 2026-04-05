import { motion } from "framer-motion";

export default function HeroSection({ t, theme, isDark }) {
  const h = t.hero;
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="text-center"
      >
        <div
          className={`mb-6 inline-block rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] ${theme.soft} ${theme.eyebrow}`}
        >
          {h.badge}
        </div>

        <h1 className={`mx-auto max-w-4xl text-5xl font-bold leading-[1.12] tracking-tight lg:text-7xl ${theme.title}`}>
          {h.title}
        </h1>

        <p className={`mx-auto mt-7 max-w-2xl text-lg leading-8 ${theme.body}`}>
          {h.body}
        </p>
        <p className={`mx-auto mt-4 max-w-2xl text-base leading-8 ${theme.muted}`}>
          {h.body2}
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#mvp"
            className="rounded-2xl bg-cyan-400 px-7 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
          >
            {h.cta1}
          </a>
          <a
            href="#how"
            className={`rounded-2xl border px-7 py-3 text-sm font-semibold transition hover:border-cyan-300/50 hover:text-cyan-300 ${theme.control}`}
          >
            {h.cta2}
          </a>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="mt-16 grid gap-4 sm:grid-cols-3"
      >
        {h.stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-[1.6rem] border px-6 py-5 text-center backdrop-blur-sm ${theme.card}`}
          >
            <div className={`text-xs font-semibold uppercase tracking-[0.2em] ${theme.panelMuted}`}>
              {stat.label}
            </div>
            <div className={`mt-2 text-sm font-medium ${theme.title}`}>{stat.value}</div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
