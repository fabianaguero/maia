import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import { InspectBaseAssetView } from "../../src/features/inspect/InspectBaseAssetView";
import type { BaseAssetRecord } from "../../src/types/library";

vi.mock("../../src/features/analyzer/components/BaseAssetOverviewPanel", () => ({
  BaseAssetOverviewPanel: () => <div data-testid="base-overview">overview</div>,
}));

vi.mock("../../src/features/analyzer/components/BaseAssetMetricsPanel", () => ({
  BaseAssetMetricsPanel: () => <div data-testid="base-metrics">metrics</div>,
}));

const baseAsset: BaseAssetRecord = {
  id: "base-1",
  title: "Hybrid stems",
  sourcePath: "/assets/stems",
  storagePath: "/library/stems",
  sourceKind: "directory",
  importedAt: "2026-06-20T10:00:00.000Z",
  categoryId: "stems",
  categoryLabel: "Stems",
  reusable: true,
  entryCount: 12,
  checksum: null,
  confidence: 0.9,
  summary: "Reusable stem bank",
  analyzerStatus: "ready",
  notes: ["good transient separation"],
  tags: ["stems"],
  metrics: {},
};

describe("InspectBaseAssetView", () => {
  it("renders base asset panels and metadata summary", () => {
    render(
      <I18nContext.Provider value={en}>
        <InspectBaseAssetView
          baseAsset={baseAsset}
          analyzerLabel="Maia Analyzer"
          contextBar={<div data-testid="context-bar">context</div>}
          onGoCompose={vi.fn()}
        />
      </I18nContext.Provider>,
    );

    expect(screen.getByText("Hybrid stems")).toBeInTheDocument();
    expect(screen.getByTestId("context-bar")).toBeInTheDocument();
    expect(screen.getByTestId("base-overview")).toBeInTheDocument();
    expect(screen.getByTestId("base-metrics")).toBeInTheDocument();
    expect(screen.getByText("good transient separation")).toBeInTheDocument();
  });
});
