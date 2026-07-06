import type { AppTranslations } from "../types";
import { esCore } from "./es/core";
import { esLibrary } from "./es/library";
import { esInspect } from "./es/inspect";
import { esCompose } from "./es/compose";
import { esSession } from "./es/session";
import { esControls } from "./es/controls";
import { esAppShell } from "./es/appShell";

export const es: AppTranslations = {
  ...esCore,
  ...esLibrary,
  ...esInspect,
  ...esCompose,
  ...esSession,
  ...esControls,
  ...esAppShell,
};
