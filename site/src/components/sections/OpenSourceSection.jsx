import { motion } from 'framer-motion';

export default function OpenSourceSection({ t, theme }) {
  return (
    <section id="opensource" className={`relative py-24 ${theme.bg}`}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`mb-4 text-sm font-medium uppercase tracking-wide ${theme.accent}`}
          >
            {t.opensource.eyebrow}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`mb-4 text-4xl font-bold ${theme.text}`}
          >
            {t.opensource.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`mx-auto max-w-2xl text-lg ${theme.textMuted}`}
          >
            {t.opensource.text}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`mb-12 inline-block rounded-full px-4 py-2 text-sm font-medium ${theme.badgeBg} ${theme.accent}`}
        >
          {t.opensource.badge}
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {t.opensource.features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
              className={`rounded-lg p-6 ${theme.cardBg} border ${theme.border}`}
            >
              <h3 className={`mb-3 font-bold ${theme.text}`}>{feature.title}</h3>
              <p className={theme.textMuted}>{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
