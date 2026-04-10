export const contentEn = {
  nav: { product: "Product", how: "How it works", mvp: "MVP", vision: "Vision" },
  controls: { lang: "Español", theme: { dark: "Dark mode", light: "Light mode" } },
  hero: {
    badge: "Auditory monitoring desktop app",
    title: "Hear your systems as background music.",
    body: "MAIA turns logs, streams, repositories, and scanned files into a background monitoring mix for technical teams.",
    body2: "A team chooses a favorite track or playlist as the musical bed, then Maia lets system behavior bend that bed so stability, pressure, and anomalies can be heard without staring at a dashboard.",
    cta1: "See MVP",
    cta2: "Explore the workflow",
    stats: [
      { label: "Inputs", value: "Logs · Streams · Repos · File scans" },
      { label: "Runtime", value: "macOS · Windows · Ubuntu/Linux" },
      { label: "Output", value: "Background mix · Replay · Cues" }
    ]
  },
  liveView: {
    title: "MAIA Live View",
    subtitle: "base music, live signal, audible response",
    badge: "local signal",
    lanesTitle: "Input lanes",
    lanes: ["base track / playlist", "log tail", "process session", "repository scan"],
    metricsTitle: "Signal metrics",
    responseTitle: "Musical response surface",
    tags: ["stable → calm groove", "warn → tonal lift", "error → sharper hit"],
    miniCards: ["Base listening bed", "Signal anomalies", "Beat-synced cues"]
  },
  product: {
    eyebrow: "Product",
    title: "Monitor systems without only watching them",
    text: "MAIA creates an audible monitoring layer for servers, logs, repositories, streams, and scanned files.",
    features: [
      { title: "A base track or playlist sets the bed", text: "The team's preferred music becomes the steady listening frame instead of generic alert noise." },
      { title: "Operational signals become musical change", text: "Logs, streams, and repository patterns bend the groove when behavior shifts." },
      { title: "Listen without dashboard lock-in", text: "Maia adds a second perceptual channel so people can keep working and still hear what the system is doing." },
      { title: "Replay and feedback improve the mix", text: "Saved replay notes can drive better monitoring presets for later sessions." }
    ]
  },
  how: {
    eyebrow: "How it works",
    title: "From system behavior to background listening",
    text: "The experience starts from a preferred musical base, analyzes technical sources locally, and turns them into audible system behavior.",
    steps: [
      { title: "Choose the bed", text: "Pick a track or playlist the team actually enjoys hearing for long stretches." },
      { title: "Connect the source", text: "Import a repository, tail a log, open a stream session, or scan files locally." },
      { title: "Map the behavior", text: "Derive deterministic metrics, cadence, anomaly markers, and beat-aware cue routing." },
      { title: "Monitor by ear", text: "Hear calm, pressure, drift, and anomalies without depending only on dashboards and constant visual scanning." }
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
      "Base tracks and playlists as the listening bed",
      "Repository intake with structural parsing",
      "Local log-file import + live tail sonification",
      "Session-based monitoring for local files, processes, WebSocket, and HTTP poll",
      "Reusable base assets catalog",
      "Beat-aware live response anchored to the base bed",
      "Session replay, bookmarks, and feedback-driven mix suggestions",
      "Composition planning + preview audio"
    ],
    framingTitle: "How to frame it",
    framing: [
      { label: "Hook", text: "Turn system behavior into a background mix your team can actually live with." },
      { label: "Promise", text: "Add a second perceptual channel for technical teams without replacing metrics or dashboards." },
      { label: "Proof", text: "Show base tracks/playlists, live tailing, process sessions, replay bookmarks, and beat-aware scheduling." },
      { label: "Tone", text: "Premium, technical, dark, musical, and data-driven." }
    ]
  },
  vision: {
    eyebrow: "Vision",
    title: "This is not music pasted onto observability. It is observability by ear.",
    text: "The strong thesis behind MAIA is that software can be monitored as sound, not only inspected as pixels.",
    cards: [
      { title: "Auditory monitoring first", text: "The product should still make sense when nobody is looking at the screen." },
      { title: "The base bed matters", text: "A track or playlist sets the mood, fatigue profile, and musical continuity." },
      { title: "Signals drive the mutations", text: "Logs, streams, repos, and scans are the inputs that bend the music." },
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
        title: "Push toward a real background monitoring runtime",
        items: [
          { label: "01 · Background music-server mode", text: "Move from app-scoped monitoring to longer-running team listening workflows." },
          { label: "02 · Broader stream adapters", text: "Grow toward CloudWatch, ELK, Loki, Splunk, Datadog, Google Cloud Logging, and Azure Monitor." }
        ]
      },
      next: {
        label: "Next",
        title: "Make the listening loop smarter",
        items: [
          { label: "03 · Auto-apply team feedback", text: "Use replay notes to suggest or apply better future mixes for the same source." },
          { label: "04 · Richer sonification engine", text: "Add denser sequencing and stronger component-level mapping." }
        ]
      },
      later: {
        label: "Later",
        title: "Turn the runtime into a broader platform",
        items: [
          { label: "05 · Full export and bounce pipeline", text: "Move beyond plan.json and preview.wav toward real export UX." },
          { label: "06 · Listener preference profiles", text: "Expand curated listening modes, fatigue control, and team-specific monitoring palettes." }
        ]
      }
    },
    recommendationLabel: "Recommendation",
    recommendation: "The best path is Now → Next → Later: turn Maia into a true background monitoring runtime first, then feed team feedback back into the mix, and only after that invest in broader export and listening catalogs."
  },
  footer: {
    tagline: "Your systems, your mood, your monitoring bed.",
    title: "From system behavior to groove.",
    text: "A cross-platform desktop app that turns technical behavior into background music, cues, and audible monitoring structure.",
    ctaTitle: "Suggested site CTAs",
    ctas: ["Request desktop demo", "See the auditory monitoring workflow", "Explore the product architecture"]
  }
};
