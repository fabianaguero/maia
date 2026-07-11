import { motion } from "framer-motion";

const features = [
  {
    id: "live-view",
    title: "MAIA Live View",
    description: "Real-time monitoring with base music + live signals",
    highlight: "Watch how code anomalies translate into musical variations",
  },
  {
    id: "input-lanes",
    title: "Input Lanes",
    description: "Base track, log tail, process sessions, repository scans",
    highlight: "Connect multiple data sources simultaneously",
  },
  {
    id: "response-surface",
    title: "Musical Response Surface",
    description: "Visual waveform showing emotional response to anomalies",
    highlight: "Stable, warn, error states mapped to musical dimensions",
  },
  {
    id: "signal-metrics",
    title: "Signal Metrics",
    description: "BPM, error count, burst detection, anomaly severity",
    highlight: "Real-time metrics synchronized with audio feedback",
  },
];

export default function FeatureMapSection() {
  return (
    <section className="w-full px-4 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Architecture at a Glance
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            How Maia transforms code signals into auditory insights
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Mockup Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 547 886' class='w-full'%3E%3Crect fill='%230f172a' width='547' height='886'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' fill='%2364748b' font-size='48' font-family='system-ui'%3EMAIA Live View%3C/text%3E%3C/svg%3E"
              alt="MAIA Live View Architecture"
              className="rounded-lg shadow-2xl"
            />
          </motion.div>

          {/* Feature Mapping */}
          <div className="space-y-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-semibold text-sm">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {feature.description}
                    </p>
                    <p className="text-blue-400 text-sm italic">💡 {feature.highlight}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Data Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-lg p-8"
        >
          <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Data Flow</h3>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">→</span>
              <span>Ingest: Logs, code changes, repository events</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">→</span>
              <span>Analyze: Extract anomalies, patterns, metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">→</span>
              <span>Compose: Map data to musical dimensions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">→</span>
              <span>Listen: Real-time auditory feedback</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
