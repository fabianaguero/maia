import { motion } from "framer-motion";
import { Activity, AudioWaveform, Binary, Gauge, ShieldCheck, TerminalSquare } from "lucide-react";
import { brandAssets } from "../../data/brandAssets";

const showcaseIcons = [Binary, Activity, TerminalSquare];

export default function HeroSection({ t, theme }) {
  const liveViewLanes = t.liveView.lanes ?? [];
  const liveViewTags = t.liveView.tags ?? [];
  const liveViewMiniCards = t.liveView.miniCards ?? [
    "Repository pulse",
    "Signal anomalies",
    "Beat-synced cues",
  ];

  return (
    <section id="top" className="mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-10 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:pb-32 lg:pt-12">
      <div className="flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`mb-5 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] backdrop-blur ${theme.badge}`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
          {t.hero.badge}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className={`max-w-4xl text-5xl font-semibold leading-[0.98] tracking-tight md:text-7xl ${theme.title}`}
        >
          {t.hero.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className={`mt-6 max-w-2xl text-lg leading-8 md:text-xl ${theme.body}`}
        >
          {t.hero.body}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16 }}
          className={`mt-4 max-w-2xl text-base leading-7 ${theme.muted}`}
        >
          {t.hero.body2}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="mt-8 flex flex-wrap gap-4"
        >
          <a href="#mvp" className={`rounded-2xl border px-6 py-3 text-sm font-semibold transition ${theme.primaryBtn}`}>
            {t.hero.cta1}
          </a>
          <a href="#how-it-works" className={`rounded-2xl border px-6 py-3 text-sm font-semibold transition ${theme.secondaryBtn}`}>
            {t.hero.cta2}
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24 }}
          className="mt-10 grid gap-4 sm:grid-cols-3"
        >
          {t.hero.stats.map((item) => (
            <div key={item.label} className={`rounded-3xl border p-5 backdrop-blur-sm ${theme.card}`}>
              <div className={`text-xs uppercase tracking-[0.2em] ${theme.muted}`}>{item.label}</div>
              <div className={`mt-2 text-lg font-medium ${theme.title}`}>{item.value}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.12 }}
        className="relative"
      >
        <div className={`relative overflow-hidden rounded-[2rem] border p-4 ${theme.showcaseOuter}`}>
          <div className={`rounded-[1.6rem] border p-5 ${theme.showcaseInner}`}>
            <div className="mb-5 rounded-[1.5rem] border border-cyan-400/10 bg-slate-950/70 p-4 shadow-[0_0_40px_rgba(168,85,247,0.08)]">
              <img src={brandAssets.heroLockup} alt="MAIA brand lockup" className="mx-auto h-auto w-full max-w-xl object-contain" />
            </div>

            <div className={`flex items-center justify-between border-b pb-4 ${theme.line}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-slate-950/70 ring-1 ring-cyan-400/20">
                  <img src={brandAssets.icon} alt="MAIA icon" className="h-9 w-9 object-contain" />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${theme.title}`}>{t.liveView.title}</div>
                  <div className={`text-xs ${theme.panelMuted}`}>{t.liveView.subtitle}</div>
                </div>
              </div>
              <div className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-violet-200">
                {t.liveView.badge}
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-4">
                <div className={`rounded-3xl border p-4 ${theme.card}`}>
                  <div className={`mb-3 flex items-center gap-2 text-sm font-medium ${theme.title}`}>
                    <TerminalSquare className="h-4 w-4 text-cyan-300" />
                    {t.liveView.lanesTitle}
                  </div>
                  <div className={`space-y-2 text-sm ${theme.body}`}>
                    {liveViewLanes.map((lane, idx) => (
                      <div key={lane} className={`flex items-center justify-between rounded-2xl border px-3 py-2 ${theme.soft}`}>
                        <span>{lane}</span>
                        <span className={`text-xs ${theme.panelMuted}`}>0{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`rounded-3xl border p-4 ${theme.card}`}>
                  <div className={`mb-3 flex items-center gap-2 text-sm font-medium ${theme.title}`}>
                    <Gauge className="h-4 w-4 text-violet-300" />
                    {t.liveView.metricsTitle}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["BPM", "126"],
                      ["Errors", "04"],
                      ["Bursts", "11"],
                      ["Anomaly", "High"],
                    ].map(([k, v]) => (
                      <div key={k} className={`rounded-2xl border p-3 ${theme.soft}`}>
                        <div className={`text-xs uppercase tracking-[0.14em] ${theme.panelMuted}`}>{k}</div>
                        <div className={`mt-1 text-lg font-semibold ${theme.title}`}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`rounded-3xl border p-5 ${theme.card}`}>
                <div className={`mb-4 flex items-center gap-2 text-sm font-medium ${theme.title}`}>
                  <AudioWaveform className="h-4 w-4 text-cyan-300" />
                  {t.liveView.responseTitle}
                </div>

                <div className={`relative h-56 overflow-hidden rounded-[1.5rem] border ${theme.line} ${theme.timelineBg}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_50%,rgba(88,230,255,0.22),transparent_30%),radial-gradient(circle_at_80%_50%,rgba(165,109,255,0.22),transparent_26%)]" />
                  <div className={`absolute inset-x-0 top-1/2 h-px ${theme.rule}`} />
                  <div className={`absolute inset-y-5 left-1/2 w-px ${theme.ruleSoft}`} />
                  <div className="absolute inset-x-5 top-1/2 -translate-y-1/2">
                    <svg viewBox="0 0 800 160" className="w-full">
                      <defs>
                        <linearGradient id="hero-wave" x1="0" x2="1">
                          <stop offset="0%" stopColor="#58E6FF" />
                          <stop offset="100%" stopColor="#B27DFF" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 80 C35 80, 45 26, 82 26 S128 140, 160 100 S218 18, 256 46 S300 138, 334 108 S392 12, 430 52 S486 144, 530 94 S594 24, 632 48 S706 118, 800 82"
                        fill="none"
                        stroke="url(#hero-wave)"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className={`absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-3 text-xs ${theme.body}`}>
                    {liveViewTags.map((tag) => (
                      <div key={tag} className={`rounded-2xl border px-3 py-2 ${theme.soft}`}>{tag}</div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {liveViewMiniCards.map((label, idx) => {
                    const Icon = showcaseIcons[idx];
                    return (
                      <div key={label} className={`rounded-2xl border px-3 py-3 text-sm ${theme.soft} ${theme.body}`}>
                        <Icon className="mb-2 h-4 w-4 text-cyan-300" />
                        {label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
