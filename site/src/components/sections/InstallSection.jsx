import { motion } from 'framer-motion';
import { Download, Code2 } from 'lucide-react';

export default function InstallSection({ t, theme }) {
  const icons = [Download, Code2];

  return (
    <section id="install" className={`relative py-24 ${theme.bg}`}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`mb-4 text-sm font-medium uppercase tracking-wide ${theme.accent}`}
          >
            {t.install.eyebrow}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`mb-4 text-4xl font-bold ${theme.text}`}
          >
            {t.install.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`mx-auto max-w-2xl text-lg ${theme.textMuted}`}
          >
            {t.install.text}
          </motion.p>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          {t.install.methods.map((method, idx) => {
            const Icon = icons[idx];
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
                className={`rounded-lg p-8 ${theme.cardBg} border ${theme.border}`}
              >
                <Icon className={`mb-4 h-8 w-8 ${theme.accent}`} />
                <h3 className={`mb-3 text-xl font-bold ${theme.text}`}>{method.label}</h3>
                <p className={`mb-4 ${theme.textMuted}`}>{method.text}</p>
                <div className={`text-sm ${theme.textMuted}`}>{method.platform}</div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`rounded-lg p-8 ${theme.cardBg} border ${theme.border}`}
        >
          <h3 className={`mb-6 text-xl font-bold ${theme.text}`}>
            {t.install.requirementsTitle}
          </h3>
          <ul className="space-y-3">
            {t.install.requirements.map((req, idx) => (
              <li key={idx} className={`flex items-start gap-3 ${theme.textMuted}`}>
                <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${theme.accent}`} />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
