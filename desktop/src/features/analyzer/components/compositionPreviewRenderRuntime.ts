import type { CompositionResultRecord } from "../../../types/library";
import { buildDerivedRenderPreview } from "./compositionPreviewDerivedRenderRuntime";
import { readPersistedRenderPreview } from "./compositionPreviewPersistedRenderRuntime";
import type { RenderPreview } from "./compositionPreviewTypes";

export function resolveRenderPreview(composition: CompositionResultRecord): RenderPreview {
  return readPersistedRenderPreview(composition.metrics) ?? buildDerivedRenderPreview(composition);
}
