export const esCore = {
  locale: "es-AR",

  workspace: "Maia",

  workspaceCopy: "Biblioteca · Deck · Booth",

  tagline: "Biblioteca → Analizar → Ejecutar",

  nav: {
    library: {
      label: "Biblioteca",
      description: "Colecciones, importaciones y material base",
    },
    session: {
      label: "Monitor",
      description: "Booth en vivo y reproducción reactiva",
    },
    inspect: {
      label: "Analizar",
      description: "Forma de onda, cues y panel de detalle",
    },
    compose: {
      label: "Componer",
      description: "Deck de arreglo y exportación",
    },
    pillars: {
      perform: {
        label: "PERFORM",
        description: "El Deck: sonificación en vivo y monitor",
        lane: "A01",
      },
      design: {
        label: "DESIGN",
        description: "El Studio: audio semántico y presets",
        lane: "B02",
      },
      curate: {
        label: "CURATE",
        description: "El Crate: biblioteca y administración",
        lane: "C03",
      },
    },
  },

  sidebar: {
    selected: "Seleccionado",
    noAsset: "Sin activo seleccionado",
    connectionsLane: "Conectar",
    tracks: "Pistas",
    codeLogs: "Código / Logs",
    bases: "Activos base",
    comps: "Composiciones",
  },
} as const;
