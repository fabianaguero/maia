export const enCore = {
  locale: "en-US",

  workspace: "Maia",

  workspaceCopy: "Library · Deck · Booth",

  tagline: "Library → Analyze → Perform",

  nav: {
    library: {
      label: "Library",
      description: "Crates, source imports, and base material",
    },
    session: {
      label: "Monitor",
      description: "Live booth and reactive playback",
    },
    inspect: {
      label: "Analyze",
      description: "Waveform, cues, and detail deck",
    },
    compose: {
      label: "Compose",
      description: "Arrangement and render deck",
    },
    pillars: {
      perform: {
        label: "PERFORM",
        description: "The Deck: Live sonification & monitor",
        lane: "A01",
      },
      design: {
        label: "DESIGN",
        description: "The Studio: Semantic audio & presets",
        lane: "B02",
      },
      curate: {
        label: "CURATE",
        description: "The Crate: Library & administration",
        lane: "C03",
      },
    },
  },

  sidebar: {
    selected: "Selected",
    noAsset: "No asset selected",
    connectionsLane: "Connect",
    tracks: "Tracks",
    codeLogs: "Code / Logs",
    bases: "Base assets",
    comps: "Compositions",
  },
} as const;
