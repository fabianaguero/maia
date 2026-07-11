import { motion } from "framer-motion";

const screenshots = [
  {
    id: "library",
    name: "Library & Catalog",
    description: "Browse and manage your musical assets and repositories",
    src: "/assets/screenshots/library-home.png",
  },
  {
    id: "monitor",
    name: "Live Monitoring",
    description: "Real-time auditory monitoring with waveform visualization",
    src: "/assets/screenshots/live-monitor.png",
  },
  {
    id: "connections",
    name: "Log Connections",
    description: "Connect to Cloud Run, local files, and streaming sources",
    src: "/assets/screenshots/connections.png",
  },
  {
    id: "settings",
    name: "Preferences",
    description: "Customize your monitoring setup and workspace",
    src: "/assets/screenshots/settings.png",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function ScreenshotsSection() {
  return (
    <section id="screenshots" className="w-full px-4 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Inside Maia
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore the interface that transforms code into music
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {screenshots.map((screenshot) => (
            <motion.div
              key={screenshot.id}
              variants={itemVariants}
              className="rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white dark:bg-gray-900"
            >
              <div className="aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <img
                  src={screenshot.src}
                  alt={screenshot.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {screenshot.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{screenshot.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
