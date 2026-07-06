import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useImportRepositoryFormDraftState } from "../../../../src/features/library/components/useImportRepositoryFormDraftState";

describe("useImportRepositoryFormDraftState", () => {
  it("tracks the local draft plus Cloud Run and workspace shortcuts", () => {
    const { result } = renderHook(() => useImportRepositoryFormDraftState("/workspace/maia"));

    expect(result.current.sourceKind).toBe("directory");
    expect(result.current.isGcpCloudRun).toBe(false);

    act(() => {
      result.current.selectGcpCloudRun();
    });

    expect(result.current.sourceKind).toBe("url");
    expect(result.current.sourcePath).toBe("gcp-cloud-run");
    expect(result.current.isGcpCloudRun).toBe(true);

    act(() => {
      result.current.useCurrentWorkspace();
    });

    expect(result.current.sourceKind).toBe("directory");
    expect(result.current.sourcePath).toBe("/workspace/maia");
    expect(result.current.isGcpCloudRun).toBe(false);
  });
});
