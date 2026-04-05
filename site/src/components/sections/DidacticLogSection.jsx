import SectionTitle from "../layout/SectionTitle";

export default function DidacticLogSection({ t, theme, isDark }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <SectionTitle eyebrow={t.didactic.eyebrow} title={t.didactic.title} text={t.didactic.text} theme={theme} />

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className={`rounded-[1.8rem] border p-5 ${theme.card}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className={`text-sm font-semibold ${theme.title}`}>{t.didactic.inputTitle}</div>
                <div className={`text-xs uppercase tracking-[0.18em] ${theme.panelMuted}`}>{t.didactic.inputSubtitle}</div>
              </div>
              <div className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${theme.soft} ${theme.panelMuted}`}>payments-api</div>
            </div>

            <div className={`space-y-2 font-mono text-[12px] leading-6 ${theme.body}`}>
              {t.didactic.logExample.map((entry, index) => {
                const levelTone = entry.level === "ERROR"
                  ? "text-rose-300 border-rose-400/20 bg-rose-400/10"
                  : entry.level === "WARN"
                    ? "text-amber-200 border-amber-300/20 bg-amber-300/10"
                    : isDark
                      ? "text-cyan-200 border-cyan-300/20 bg-cyan-300/10"
                      : "text-cyan-800 border-cyan-300/40 bg-cyan-50";
                return (
                  <div key={`${entry.time}-${index}`} className={`rounded-2xl border px-3 py-2 ${theme.soft}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={theme.panelMuted}>{entry.time}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${levelTone}`}>{entry.level}</span>
                      <span className={theme.panelMuted}>{entry.service}</span>
                    </div>
                    <div className={`mt-1 ${theme.title}`}>{entry.message}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`rounded-[1.8rem] border p-5 ${theme.card}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className={`text-sm font-semibold ${theme.title}`}>{t.didactic.outputTitle}</div>
                <div className={`text-xs uppercase tracking-[0.18em] ${theme.panelMuted}`}>{t.didactic.outputSubtitle}</div>
              </div>
              <div className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-violet-200">
                {t.didactic.outputBadge}
              </div>
            </div>

            <div className={`rounded-[1.4rem] border p-4 ${theme.soft}`}>
              <div className={`mb-4 flex items-center justify-between text-xs uppercase tracking-[0.16em] ${theme.panelMuted}`}>
                <span>{t.didactic.timeline}</span>
                <span>128 BPM</span>
              </div>
              <div className="space-y-4">
                {t.didactic.sonicMapping.map((row) => (
                  <div key={row.label}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div>
                        <div className={`text-sm font-medium ${theme.title}`}>{row.label}</div>
                        <div className={`text-xs ${theme.panelMuted}`}>{row.sound}</div>
                      </div>
                      <div className={`text-[11px] uppercase tracking-[0.16em] ${theme.panelMuted}`}>{t.didactic.mappedCue}</div>
                    </div>
                    <div className={`h-3 rounded-full ${isDark ? "bg-white/5" : "bg-slate-200"}`}>
                      <div className="h-3 rounded-full bg-gradient-to-r from-cyan-300 via-white to-violet-300" style={{ width: row.width }} />
                    </div>
                    <div className={`mt-2 text-xs leading-6 ${theme.panelMuted}`}>{row.effect}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className={`rounded-2xl border px-4 py-3 ${theme.soft}`}>
                <div className={`text-xs uppercase tracking-[0.16em] ${theme.panelMuted}`}>{t.didactic.patternLogicTitle}</div>
                <div className={`mt-2 text-sm ${theme.body}`}>{t.didactic.patternLogicText}</div>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${theme.soft}`}>
                <div className={`text-xs uppercase tracking-[0.16em] ${theme.panelMuted}`}>{t.didactic.operatorValueTitle}</div>
                <div className={`mt-2 text-sm ${theme.body}`}>{t.didactic.operatorValueText}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
