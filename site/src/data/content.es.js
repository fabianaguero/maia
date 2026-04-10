export const contentEs = {
  nav: { product: "Producto", how: "Cómo funciona", mvp: "MVP", vision: "Visión" },
  controls: { lang: "English", theme: { dark: "Modo nocturno", light: "Modo claro" } },
  hero: {
    badge: "App desktop de monitoreo audible",
    title: "Escuchá tus sistemas como música de fondo.",
    body: "MAIA convierte logs, streams, repositorios y scans de archivos en una mezcla de monitoreo en background para equipos técnicos.",
    body2: "El equipo elige un track o playlist base que le gusta escuchar y Maia deja que el comportamiento del sistema deforme esa base para que estabilidad, presión y anomalías se puedan oír sin quedarse mirando un dashboard.",
    cta1: "Ver MVP",
    cta2: "Explorar el flujo",
    stats: [
      { label: "Entradas", value: "Logs · Streams · Repos · Scans" },
      { label: "Runtime", value: "macOS · Windows · Ubuntu/Linux" },
      { label: "Salida", value: "Mix de fondo · Replay · Cues" }
    ]
  },
  liveView: {
    title: "Vista en vivo de MAIA",
    subtitle: "base musical, señal en vivo y respuesta audible",
    badge: "señal local",
    lanesTitle: "Canales de entrada",
    lanes: ["track / playlist base", "tail del log", "sesión de proceso", "scan del repositorio"],
    metricsTitle: "Métricas de señal",
    responseTitle: "Superficie de respuesta musical",
    tags: ["estable → groove calmo", "warn → elevación tonal", "error → golpe más agudo"],
    miniCards: ["Cama musical base", "Anomalías de señal", "Cues alineados al beat"]
  },
  product: {
    eyebrow: "Producto",
    title: "Monitoreá sistemas sin solo mirarlos",
    text: "MAIA crea una capa audible de monitoreo para servers, logs, repositorios, streams y scans de archivos.",
    features: [
      { title: "Un track o playlist fija la cama", text: "La música preferida del equipo se vuelve el marco estable de escucha en vez de ruido de alertas." },
      { title: "La señal operativa se vuelve cambio musical", text: "Logs, streams y patrones del repo deforman el groove cuando el comportamiento cambia." },
      { title: "Escucha sin lock-in al dashboard", text: "Maia agrega un segundo canal perceptivo para poder seguir trabajando y aun así oír qué hace el sistema." },
      { title: "El replay mejora la mezcla", text: "Las notas y bookmarks del replay pueden empujar mejores presets para sesiones futuras." }
    ]
  },
  how: {
    eyebrow: "Cómo funciona",
    title: "De comportamiento técnico a escucha de fondo",
    text: "La experiencia parte de una base musical elegida por el equipo, analiza fuentes técnicas localmente y las convierte en comportamiento audible.",
    steps: [
      { title: "Elegí la cama", text: "Seleccioná un track o playlist que el equipo realmente disfrute escuchar durante horas." },
      { title: "Conectá la fuente", text: "Importá un repositorio, seguí un log, abrí una sesión de stream o escaneá archivos localmente." },
      { title: "Mapeá el comportamiento", text: "Derivá métricas determinísticas, cadencia, marcadores de anomalía y routing alineado al beat." },
      { title: "Monitoreá por oído", text: "Escuchá calma, presión, drift y anomalías sin depender sólo del dashboard y el escaneo visual constante." }
    ]
  },
  didactic: {
    eyebrow: "Ejemplo didáctico",
    title: "Mirá cómo un log típico se transforma en sonido",
    text: "Warnings y errores cambian el sonido para que la anomalía se vuelva audible antes de escanear visualmente el stream.",
    inputTitle: "Log productivo típico",
    inputSubtitle: "Muestra de stream de entrada",
    outputTitle: "En qué lo convierte MAIA",
    outputSubtitle: "Ejemplo de mapeo audible",
    outputBadge: "modo instrumental guiado",
    timeline: "Timeline musical",
    patternLogicTitle: "Lógica del patrón",
    patternLogicText: "INFO mantiene el groove estable, WARN agrega tensión y ERROR introduce golpes más fuertes y cambio tímbrico.",
    operatorValueTitle: "Valor para el operador",
    operatorValueText: "Podés seguir trabajando y aun así notar cuándo cambia el patrón productivo.",
    mappedCue: "cue mapeado",
    logExample: [
      { time: "09:14:22", level: "INFO", service: "payments-api", message: "Health check OK · latencia 42ms" },
      { time: "09:14:27", level: "WARN", service: "payments-api", message: "Pico de reintentos detectado en provider A" },
      { time: "09:14:29", level: "ERROR", service: "payments-api", message: "Timeout llamando al settlement gateway" },
      { time: "09:14:35", level: "INFO", service: "payments-api", message: "Ruta de fallback activada" }
    ],
    sonicMapping: [
      { label: "Flujo estable de info", sound: "Pulso suave + pad cálido", effect: "Mantiene un groove estable cuando el stream está sano y predecible", width: "58%" },
      { label: "Cluster de warnings", sound: "Elevación tonal + percusión más brillante", effect: "Señala aumento de tensión cuando empiezan a aparecer bursts", width: "74%" },
      { label: "Anomalía de error", sound: "Golpe agudo + cambio de filtro + ritmo más denso", effect: "Vuelve audibles los eventos disruptivos sin mirar el stream", width: "94%" }
    ]
  },
  mvp: {
    title: "Qué ya está lo bastante sólido como para mostrar",
    text: "El site tiene que vender visión sin perder credibilidad.",
    items: [
      "App desktop multiplataforma para macOS, Windows y Ubuntu/Linux",
      "Tracks y playlists base como cama de escucha",
      "Ingesta de repositorios con parsing estructural",
      "Import de logs locales + sonificación live tail",
      "Monitoreo por sesiones para archivos locales, procesos, WebSocket y HTTP poll",
      "Catálogo de base assets reutilizables",
      "Respuesta en vivo anclada a la base musical",
      "Replay de sesiones, bookmarks y sugerencias de mezcla",
      "Composition planning + preview audio"
    ],
    framingTitle: "Cómo contarlo",
    framing: [
      { label: "Hook", text: "Convertir el comportamiento del sistema en una mezcla de fondo que el equipo realmente quiera escuchar." },
      { label: "Promesa", text: "Sumar un segundo canal perceptivo sin reemplazar métricas ni dashboards." },
      { label: "Prueba", text: "Mostrar tracks base, playlists, live tailing, sesiones de proceso, replay bookmarks y scheduling con beat." },
      { label: "Tono", text: "Premium, técnico, oscuro, musical y guiado por datos." }
    ]
  },
  vision: {
    eyebrow: "Visión",
    title: "No es música pegada a observabilidad. Es observabilidad por oído.",
    text: "La tesis fuerte detrás de MAIA es que el software puede monitorearse como sonido, no sólo inspeccionarse como píxeles.",
    cards: [
      { title: "Monitoreo audible primero", text: "El producto tiene que seguir teniendo sentido aunque nadie mire la pantalla." },
      { title: "La cama base importa", text: "Un track o playlist define el mood, la fatiga y la continuidad musical." },
      { title: "Las señales empujan las mutaciones", text: "Logs, streams, repos y scans son las entradas que deforman la música." },
      { title: "Instrumental y determinístico", text: "Perfiles instrumentales curados en vez de magia IA vaga." }
    ]
  },
  roadmap: {
    eyebrow: "Roadmap recomendado",
    title: "Qué falta implementar",
    text: "La siguiente capa tiene que construirse en un orden realista.",
    columns: {
      now: {
        label: "Ahora",
        title: "Empujar hacia un runtime real de monitoreo en background",
        items: [
          { label: "01 · Modo music-server de fondo", text: "Pasar de monitoreo acotado a un workflow largo de escucha para el equipo." },
          { label: "02 · Adapters de streams más amplios", text: "Crecer hacia CloudWatch, ELK, Loki, Splunk, Datadog, Google Cloud Logging y Azure Monitor." }
        ]
      },
      next: {
        label: "Después",
        title: "Volver más inteligente el loop de escucha",
        items: [
          { label: "03 · Auto-aplicar feedback del equipo", text: "Usar las notas del replay para sugerir o aplicar mejores mezclas futuras." },
          { label: "04 · Motor de sonificación más rico", text: "Agregar secuenciación más densa y mapeo más fuerte por componente." }
        ]
      },
      later: {
        label: "Más adelante",
        title: "Convertir el runtime en una plataforma más amplia",
        items: [
          { label: "05 · Pipeline completo de export y bounce", text: "Ir más allá de plan.json y preview.wav hacia una UX real de export." },
          { label: "06 · Perfiles de preferencia de escucha", text: "Expandir modos curados, control de fatiga y paletas por equipo." }
        ]
      }
    },
    recommendationLabel: "Recomendación",
    recommendation: "La mejor ruta es Ahora → Después → Más adelante: convertir primero a Maia en un runtime real de monitoreo en background, luego devolver el feedback del equipo a la mezcla, y recién después invertir fuerte en export y catálogo."
  },
  footer: {
    tagline: "Tus sistemas, tu mood, tu cama de monitoreo.",
    title: "Del comportamiento del sistema al groove.",
    text: "Una app desktop multiplataforma que convierte comportamiento técnico en música de fondo, cues y estructura audible de monitoreo.",
    ctaTitle: "CTAs sugeridos del site",
    ctas: ["Solicitar demo desktop", "Ver el flujo de monitoreo audible", "Explorar la arquitectura del producto"]
  }
};
