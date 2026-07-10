import { motion } from 'framer-motion';

export default function ContributeSection({ t, theme }) {

  return (
    <section id="contribute" className={`relative py-24 ${theme.bg}`}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`mb-4 text-sm font-medium uppercase tracking-wide ${theme.accent}`}
          >
            {t.contribute.eyebrow}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`mb-4 text-4xl font-bold ${theme.text}`}
          >
            {t.contribute.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`mx-auto max-w-2xl text-lg ${theme.textMuted}`}
          >
            {t.contribute.text}
          </motion.p>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`rounded-lg p-8 ${theme.cardBg} border ${theme.border}`}
          >
            <h3 className={`mb-6 text-xl font-bold ${theme.text}`}>Getting started</h3>
            <ol className="space-y-3">
              {t.contribute.guidelines.map((guideline, idx) => (
                <li key={idx} className={`flex items-start gap-4 ${theme.textMuted}`}>
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${theme.accent} text-white font-bold text-sm`}>
                    {idx + 1}
                  </div>
                  <span className="pt-0.5">{guideline}</span>
                </li>
              ))}
            </ol>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`rounded-lg p-8 ${theme.cardBg} border ${theme.border}`}
          >
            <h3 className={`mb-6 text-xl font-bold ${theme.text}`}>
              {t.contribute.areasTitle}
            </h3>
            <ul className="space-y-3">
              {t.contribute.areas.map((area, idx) => (
                <li key={idx} className={`flex items-start gap-3 ${theme.textMuted}`}>
                  <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${theme.accent}`} />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={`rounded-lg p-8 text-center ${theme.cardBg} border ${theme.border}`}
        >
          <p className={`mb-6 text-lg ${theme.textMuted}`}>
            Ready to start? Head over to the GitHub repository to fork, clone, and submit your first PR.
          </p>
          <a
            href="https://github.com/faguero/maia"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-block rounded-lg px-8 py-3 font-semibold transition ${theme.accentBg} text-white hover:opacity-90`}
          >
            View Repository
          </a>
        </motion.div>
      </div>
    </section>
  );
}
