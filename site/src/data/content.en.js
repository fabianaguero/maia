export const contentEn = {
  nav: { product: "Product", how: "How it works", mvp: "MVP", vision: "Vision" },
  controls: { lang: "Español", theme: { dark: "Dark mode", light: "Light mode" } },
  hero: {
    badge: "Cross-platform desktop sonification",
    title: "Turn code and live signals into living music.",
    body: "MAIA transforms repositories, local log files, and live session streams into an audible experience for technical teams.",
    body2: "It detects patterns, tension, rhythm, and anomalies so the music evolves with the real behavior of software systems.",
    cta1: "See MVP",
    cta2: "Explore the workflow",
    stats: [
      { label: "Inputs", value: "Logs · Repos · Assets · Sessions" },
      { label: "Runtime", value: "macOS · Windows · Ubuntu/Linux" },
      { label: "Output", value: "Cues · Preview · BPM" }
    ]
  },
  liveView: {
    title: "MAIA Live View",
    subtitle: "code, logs, and live cues",
    badge: "local signal",
    lanesTitle: "Input lanes",
    lanes: ["repository snapshot", "log tail", "process session", "base asset pack"],
    metricsTitle: "Signal metrics",
    responseTitle: "Musical response surface",
    tags: ["info → soft pulse", "warn → tonal lift", "error → sample hit"]
  },
  product: {
    eyebrow: "Product",
    title: "Listen to systems instead of only reading them",
    text: "MAIA creates an audible analysis layer for repositories, production logs, and live sessions.",
    features: [
      { title: "Repositories become rhythm", text: "Structure-aware repository analysis turns code behavior into musical response." },
      { title: "Live logs become cues", text: "Production-log anomalies become audible when stable patterns shift into errors, bursts, or unusual behavior." },
      { title: "Reference tracks as anchors", text: "Reference tracks seed BPM, energy, and style tilt for musically grounded live response." },
      { title: "Beat-aware scheduling", text: "A persistent beat clock aligns live cues to musical subdivisions instead of random beeps." }
    ]
  },
  how: {
    eyebrow: "How it works",
    title: "From technical signal to musical response",
    text: "The experience starts from a technical source, analyzes it locally, and turns it into a reusable sonic surface.",
    steps: [
      { title: "Ingest", text: "Import a local repository, a local log file, or reusable base assets." },
      { title: "Analyze", text: "Derive deterministic metrics, cadence bins, BPM suggestions, structural signals, and anomaly markers." },
      { title: "Map", text: "Map events to cue routes, beat-aligned timing, scenes, and reusable sonic vocabulary." },
      { title: "Listen", text: "Hear software behavior without depending only on dashboards and constant visual scanning." }
    ]
  },
  didactic: {
    eyebrow: "Didactic example",
    title: "See a typical log turn into sound",
    text: "Warnings and errors change the sound so the anomaly becomes audible before someone scans the stream visually.",
    inputTitle: "Typical production log",
    inputSubtitle: "Input stream sample",
    outputTitle: "What MAIA turns it into",
    outputSubtitle: "Audible mapping example",
    outputBadge: "guided instrumental mode",
    timeline: "Musical timeline",
    patternLogicTitle: "Pattern logic",
    patternLogicText: "INFO keeps the groove stable, WARN adds tension, ERROR introduces stronger hits and timbral change.",
    operatorValueTitle: "Operator value",
    operatorValueText: "You can keep working and still notice when the production pattern shifts.",
    mappedCue: "mapped cue",
    logExample: [
      { time: "09:14:22", level: "INFO", service: "payments-api", message: "Health check OK · latency 42ms" },
      { time: "09:14:27", level: "WARN", service: "payments-api", message: "Retry spike detected on provider A" },
      { time: "09:14:29", level: "ERROR", service: "payments-api", message: "Timeout calling settlement gateway" },
      { time: "09:14:35", level: "INFO", service: "payments-api", message: "Fallback route engaged" }
    ],
    sonicMapping: [
      { label: "Stable info flow", sound: "Soft pulse + warm pad", effect: "Keeps a steady groove when the stream is healthy and predictable", width: "58%" },
      { label: "Warning cluster", sound: "Tonal lift + brighter percussion", effect: "Signals rising tension when bursts start to appear", width: "74%" },
      { label: "Error anomaly", sound: "Sharp hit + filter shift + denser rhythm", effect: "Makes disruptive events audible without watching the stream", width: "94%" }
    ]
  },
  mvp: {
    title: "What is already strong enough to show",
    text: "The site should sell vision without losing credibility.",
    items: [
      "Cross-platform desktop app for macOS, Windows, and Ubuntu/Linux",
      "Repository intake with Java/Kotlin structural parsing",
      "Local log-file import + live tail sonification",
      "Session-based monitoring for local files and spawned processes",
      "Reusable base assets catalog",
      "Reference-track anchored live response",
      "Composition planning + preview audio",
      "Saveable previews and composition artifacts"
    ],
    framingTitle: "How to frame it",
    framing: [
      { label: "Hook", text: "Transform repositories, production logs, and live stream sessions into an audible experience." },
      { label: "Promise", text: "Add a second perceptual channel for technical teams without replacing metrics or dashboards." },
      { label: "Proof", text: "Show structural parsing, live tailing, process sessions, beat-aware scheduling, and preview artifacts." },
      { label: "Tone", text: "Premium, technical, dark, musical, and data-driven." }
    ]
  },
  vision: {
    eyebrow: "Vision",
    title: "This is not music for aesthetics. It is music as an analysis surface.",
    text: "The strong thesis behind MAIA is that software can also be heard.",
    cards: [
      { title: "Not just another dashboard", text: "A second perceptual channel for system behavior." },
      { title: "Code and logs are the real signal", text: "Tracks are support inputs, not the main business output." },
      { title: "Beat-synced, not random", text: "Live cues align to a persistent beat clock." },
      { title: "Instrumental and deterministic", text: "Curated instrumental profiles instead of vague AI magic." }
    ]
  },
  roadmap: {
    eyebrow: "Recommended build roadmap",
    title: "What is still missing to implement",
    text: "Build the next layer in a realistic order.",
    columns: {
      now: {
        label: "Now",
        title: "Stabilize and expand the signal surface",
        items: [
          { label: "01 · Consolidation and test coverage", text: "Strengthen fixtures, golden tests, and native-vs-mock gates." },
          { label: "02 · Broader stream adapters", text: "Grow toward CloudWatch, ELK, Loki, Splunk, Datadog, Google Cloud Logging, and Azure Monitor." }
        ]
      },
      next: {
        label: "Next",
        title: "Make monitoring deeper and the music smarter",
        items: [
          { label: "03 · Always-on monitoring", text: "Move from screen-scoped sessions to longer-running background workflows." },
          { label: "04 · Richer sonification engine", text: "Add denser sequencing and stronger component-level mapping." }
        ]
      },
      later: {
        label: "Later",
        title: "Turn previews into a fuller production pipeline",
        items: [
          { label: "05 · Full export and bounce pipeline", text: "Move beyond plan.json and preview.wav toward real export UX." },
          { label: "06 · Additional format and catalog coverage", text: "Expand supported audio formats and curated instrumental palette coverage." }
        ]
      }
    },
    recommendationLabel: "Recommendation",
    recommendation: "The best path is Now → Next → Later: harden the product, widen real inputs, then deepen monitoring and sonification, and only after that invest in full export and broader catalog coverage."
  },
  footer: {
    tagline: "Your data, your mood, your soundtrack.",
    title: "From code and logs to groove.",
    text: "A cross-platform desktop app that turns technical behavior into music, cues, and audible structure.",
    ctaTitle: "Suggested site CTAs",
    ctas: ["Request desktop demo", "See the sonification workflow", "Explore the product architecture"]
  }
};
