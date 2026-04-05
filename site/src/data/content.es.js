export const contentEs = {
  nav: { product: "Producto", how: "Cómo funciona", mvp: "MVP", vision: "Visión" },
  controls: { lang: "English", theme: { dark: "Modo nocturno", light: "Modo claro" } },
  hero: {
    badge: "Sonificación desktop multiplataforma",
    title: "Convertí código y señales en vivo en música viva.",
    body: "MAIA transforma repositorios, archivos de log locales y sesiones de streams en una experiencia audible para equipos técnicos.",
    body2: "Detecta patrones, tensión, ritmo y anomalías para que la música evolucione con el comportamiento real de sistemas de software.",
    cta1: "Ver MVP",
    cta2: "Explorar el flujo",
    stats: [
      { label: "Entradas", value: "Logs · Repos · Assets · Sesiones" },
      { label: "Runtime", value: "macOS · Windows · Ubuntu/Linux" },
      { label: "Salida", value: "Cues · Preview · BPM" }
    ]
  },
  liveView: {
    title: "Vista en vivo de MAIA",
    subtitle: "código, logs y cues en vivo",
    badge: "señal local",
    lanesTitle: "Canales de entrada",
    lanes: ["snapshot del repositorio", "tail del log", "sesión de proceso", "pack de base assets"],
    metricsTitle: "Métricas de señal",
    responseTitle: "Superficie de respuesta musical",
    tags: ["info → pulso suave", "warn → elevación tonal", "error → golpe sampleado"]
  },
  product: {
    eyebrow: "Producto",
    title: "Escuchá sistemas en lugar de solo leerlos",
    text: "MAIA crea una capa audible de análisis para repositorios, logs productivos y sesiones en vivo.",
    features: [
      { title: "Los repos se vuelven ritmo", text: "El análisis estructural del repositorio convierte el comportamiento del código en respuesta musical." },
      { title: "Los logs en vivo se vuelven cues", text: "Las anomalías de logs productivos se vuelven audibles cuando patrones estables cambian hacia errores, bursts o comportamiento inusual." },
      { title: "Tracks de referencia como anchors", text: "Los tracks de referencia siembran BPM, energía e inclinación de estilo para respuestas en vivo más musicales." },
      { title: "Scheduling alineado al beat", text: "Un beat clock persistente alinea los cues en vivo a subdivisiones musicales en vez de lanzar beeps aleatorios." }
    ]
  },
  how: {
    eyebrow: "Cómo funciona",
    title: "De señal técnica a respuesta musical",
    text: "La experiencia parte de una fuente técnica, la analiza localmente y la convierte en una superficie sonora reutilizable.",
    steps: [
      { title: "Ingesta", text: "Importá un repositorio local, un archivo de log local o base assets reutilizables." },
      { title: "Análisis", text: "Derivá métricas determinísticas, bins de cadencia, sugerencias de BPM, señales estructurales y marcadores de anomalía." },
      { title: "Mapeo", text: "Mapeá eventos a rutas de cues, timing alineado al beat, escenas y vocabulario sónico reutilizable." },
      { title: "Escucha", text: "Escuchá el comportamiento del software sin depender solo de dashboards y escaneo visual constante." }
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
      "Ingesta de repositorios con parsing estructural Java/Kotlin",
      "Import de logs locales + sonificación live tail",
      "Monitoreo por sesiones para archivos locales y procesos",
      "Catálogo de base assets reutilizables",
      "Respuesta en vivo anclada a tracks de referencia",
      "Composition planning + preview audio",
      "Previews y artifacts de composición guardables"
    ],
    framingTitle: "Cómo contarlo",
    framing: [
      { label: "Hook", text: "Transformar repositorios, logs productivos y sesiones de streams en una experiencia audible." },
      { label: "Promesa", text: "Sumar un segundo canal perceptivo sin reemplazar métricas ni dashboards." },
      { label: "Prueba", text: "Mostrar parsing estructural, live tailing, sesiones de proceso, scheduling con beat y preview artifacts." },
      { label: "Tono", text: "Premium, técnico, oscuro, musical y guiado por datos." }
    ]
  },
  vision: {
    eyebrow: "Visión",
    title: "No es música por estética. Es música como superficie de análisis.",
    text: "La tesis fuerte detrás de MAIA es que el software también puede escucharse.",
    cards: [
      { title: "No es otro dashboard más", text: "Un segundo canal perceptivo para el comportamiento del sistema." },
      { title: "Código y logs son la señal real", text: "Los tracks son inputs de soporte, no la salida principal del negocio." },
      { title: "Sincronizado al beat, no aleatorio", text: "Los cues en vivo se alinean a un beat clock persistente." },
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
        title: "Estabilizar y ampliar la superficie de señal",
        items: [
          { label: "01 · Consolidación y cobertura de tests", text: "Fortalecer fixtures, golden tests y compuertas native-vs-mock." },
          { label: "02 · Adapters de streams más amplios", text: "Crecer hacia CloudWatch, ELK, Loki, Splunk, Datadog, Google Cloud Logging y Azure Monitor." }
        ]
      },
      next: {
        label: "Después",
        title: "Volver más profundo el monitoreo y más inteligente la música",
        items: [
          { label: "03 · Monitoreo always-on", text: "Pasar de sesiones acotadas a workflows de fondo más duraderos." },
          { label: "04 · Motor de sonificación más rico", text: "Agregar secuenciación más densa y mapeo más fuerte por componente." }
        ]
      },
      later: {
        label: "Más adelante",
        title: "Llevar los previews a un pipeline más completo de producción",
        items: [
          { label: "05 · Pipeline completo de export y bounce", text: "Ir más allá de plan.json y preview.wav hacia una UX real de export." },
          { label: "06 · Más formatos y cobertura de catálogo", text: "Expandir formatos soportados y la paleta instrumental curada." }
        ]
      }
    },
    recommendationLabel: "Recomendación",
    recommendation: "La mejor ruta es Ahora → Después → Más adelante: endurecer el producto, ampliar entradas reales, luego profundizar monitoreo y sonificación, y recién después invertir en export completo y catálogo más amplio."
  },
  footer: {
    tagline: "Tus datos, tu mood, tu soundtrack.",
    title: "Del código y los logs al groove.",
    text: "Una app desktop multiplataforma que convierte comportamiento técnico en música, cues y estructura audible.",
    ctaTitle: "CTAs sugeridos del site",
    ctas: ["Solicitar demo desktop", "Ver el flujo de sonificación", "Explorar la arquitectura del producto"]
  }
};
