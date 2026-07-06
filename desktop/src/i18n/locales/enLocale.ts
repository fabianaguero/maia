import { enCore } from "./en/core";
import { enLibrary } from "./en/library";
import { enInspect } from "./en/inspect";
import { enCompose } from "./en/compose";
import { enSession } from "./en/session";
import { enControls } from "./en/controls";
import { enAppShell } from "./en/appShell";

export const en = {
  ...enCore,
  ...enLibrary,
  ...enInspect,
  ...enCompose,
  ...enSession,
  ...enControls,
  ...enAppShell,
};
