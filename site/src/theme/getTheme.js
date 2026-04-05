export function getTheme(isDark) {
  return {
    shell: isDark ? "bg-[#06070A] text-slate-200" : "bg-slate-50 text-slate-900",
    bgGlow: isDark
      ? "bg-[radial-gradient(circle_at_top,rgba(88,230,255,0.14),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(165,109,255,0.16),transparent_24%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_35%)]"
      : "bg-[radial-gradient(circle_at_top,rgba(88,230,255,0.18),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(165,109,255,0.14),transparent_24%),linear-gradient(to_bottom,rgba(15,23,42,0.03),transparent_35%)]",
    cyanBlur: isDark ? "bg-cyan-400/10" : "bg-cyan-300/20",
    violetBlur: isDark ? "bg-violet-500/10" : "bg-violet-300/20",
    title: isDark ? "text-white" : "text-slate-900",
    body: isDark ? "text-slate-300" : "text-slate-700",
    muted: isDark ? "text-slate-400" : "text-slate-600",
    panelMuted: isDark ? "text-slate-500" : "text-slate-500",
    card: isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white shadow-sm",
    soft: isDark ? "border-white/10 bg-black/20" : "border-slate-200 bg-slate-50",
    showcaseOuter: isDark ? "border-white/10 bg-gradient-to-br from-slate-950 to-slate-900" : "border-slate-200 bg-gradient-to-br from-white to-slate-100",
    showcaseInner: isDark ? "border-white/10 bg-[#0B0E13]" : "border-slate-200 bg-white",
    control: isDark ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
    eyebrow: isDark ? "text-cyan-300/80" : "text-cyan-700"
  };
}
