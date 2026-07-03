import {
  resolveArrangementSections,
  resolveCuePoints,
  resolveRenderPreview,
} from "./compositionPreview";
import {
  clampPan,
  fallbackCategoryProfile,
  fallbackGenreProfile,
  fallbackStrategyProfile,
} from "./liveSonificationSceneProfiles";
import { routeSampleAssignment } from "./liveSonificationSampleSourceRuntime";
import type { LiveSonificationRoute } from "./liveSonificationSceneTypes";

export function buildLiveSonificationRoutes(input: {
  genreId: string;
  categoryLabel: string;
  sections: ReturnType<typeof resolveArrangementSections>;
  cuePoints: ReturnType<typeof resolveCuePoints>;
  renderPreview: ReturnType<typeof resolveRenderPreview> | null;
  sampleSources: Array<{ path: string; label: string }>;
  categoryId: string;
  strategy: string;
}): LiveSonificationRoute[] {
  const { categoryLabel, sections, cuePoints, renderPreview, sampleSources, genreId } = input;
  const genreProfile = fallbackGenreProfile(genreId);
  const categoryProfile = fallbackCategoryProfile(input.categoryId);
  const strategyProfile = fallbackStrategyProfile(input.strategy);
  const foundationStem =
    renderPreview?.stems.find((stem) => stem.role === "foundation") ?? renderPreview?.stems[0];
  const supportStem =
    renderPreview?.stems.find((stem) => stem.role === "support") ??
    renderPreview?.stems[1] ??
    foundationStem;
  const glueStem =
    renderPreview?.stems.find((stem) => stem.role === "glue") ??
    renderPreview?.stems[renderPreview.stems.length - 1] ??
    supportStem ??
    foundationStem;
  const spotlightStem =
    renderPreview?.stems.find((stem) => stem.role === "spotlight") ?? glueStem ?? foundationStem;
  const introSection = sections[0];
  const buildSection = sections[1] ?? introSection;
  const mainSection = sections[2] ?? buildSection ?? introSection;
  const outroSection = sections[3] ?? mainSection ?? buildSection ?? introSection;
  const introCue = cuePoints[0];
  const buildCue = cuePoints[1] ?? introCue;
  const mainCue = cuePoints[2] ?? buildCue ?? introCue;
  const outroCue = cuePoints[cuePoints.length - 1] ?? mainCue ?? buildCue ?? introCue;

  return (
    [
      {
        key: "info",
        label: genreProfile.infoLabel,
        stemLabel: foundationStem?.label ?? `${categoryLabel} foundation`,
        sectionLabel: introSection?.label ?? "Baseline window",
        cueLabel: introCue?.label ?? "Baseline cue",
        focus:
          foundationStem?.focus ??
          "Keep a continuous representation of nominal system activity in the background.",
        waveform: genreProfile.infoWaveform,
        noteMultiplier: 0.96,
        durationScale: 1,
        gainScale: 0.92,
        pan: foundationStem?.pan ?? 0,
        samplePath: null,
        sampleLabel: null,
      },
      {
        key: "warn",
        label: genreProfile.warnLabel,
        stemLabel: supportStem?.label ?? `${categoryLabel} motion`,
        sectionLabel: buildSection?.label ?? "Build window",
        cueLabel: buildCue?.label ?? "Build cue",
        focus:
          supportStem?.focus ??
          "Push warning pressure forward before the system crosses into a harder anomaly state.",
        waveform: genreProfile.warnWaveform,
        noteMultiplier: 1.08,
        durationScale: 1.06,
        gainScale: 1.08,
        pan: supportStem?.pan ?? 0.08,
        samplePath: null,
        sampleLabel: null,
      },
      {
        key: "error",
        label: genreProfile.errorLabel,
        stemLabel: spotlightStem?.label ?? `${categoryLabel} impact`,
        sectionLabel: mainSection?.label ?? "Impact window",
        cueLabel: mainCue?.label ?? "Impact cue",
        focus:
          spotlightStem?.focus ??
          "Make clear when the live stream shifts from pressure into a real failure state.",
        waveform: genreProfile.errorWaveform,
        noteMultiplier: 1.22,
        durationScale: 0.96,
        gainScale: 1.16,
        pan: spotlightStem?.pan ?? 0,
        samplePath: null,
        sampleLabel: null,
      },
      {
        key: "anomaly",
        label: genreProfile.anomalyLabel,
        stemLabel: glueStem?.label ?? `${categoryLabel} anomaly accent`,
        sectionLabel: outroSection?.label ?? "Accent window",
        cueLabel: outroCue?.label ?? "Accent cue",
        focus:
          glueStem?.focus ??
          "Mark bursts, exceptions, or drift spikes with a clearly distinct accent.",
        waveform: genreProfile.anomalyWaveform,
        noteMultiplier: 1.38,
        durationScale: 0.84,
        gainScale: 1.24,
        pan: glueStem?.pan ?? 0.18,
        samplePath: null,
        sampleLabel: null,
      },
    ] satisfies LiveSonificationRoute[]
  ).map((route) => ({
    ...route,
    pan: clampPan(route.pan + categoryProfile.panBias + strategyProfile.panBias),
    ...routeSampleAssignment(sampleSources, route.key),
  }));
}
