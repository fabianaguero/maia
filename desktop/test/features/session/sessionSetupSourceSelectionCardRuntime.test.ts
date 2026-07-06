import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSessionSetupSourceModeTabs,
  buildSessionSetupSourceOptions,
  buildSessionSetupSourceSummary,
  resolveSessionSetupSourceEmptyState,
} from "../../../src/features/session/sessionSetupSourceSelectionCardRuntime";

describe("sessionSetupSourceSelectionCardRuntime", () => {
  it("builds source mode tabs and empty states", () => {
    const tabs = buildSessionSetupSourceModeTabs({
      t: en,
      mode: "repo",
    });

    expect(tabs[1]).toEqual({
      id: "repo",
      label: en.session.repository,
      active: true,
    });
    expect(
      resolveSessionSetupSourceEmptyState({
        t: en,
        mode: "log",
        sourceCount: 0,
      }),
    ).toBe(en.session.noImportedLogs);
  });

  it("builds source options and summary", () => {
    const options = buildSessionSetupSourceOptions({
      sourceOptions: [
        {
          id: "repo-1",
          title: "orders-service",
          sourcePath: "/logs/orders.log",
        } as never,
      ],
      selectedSourceId: "repo-1",
    });
    const summary = buildSessionSetupSourceSummary({
      t: en,
      selectedSource: {
        id: "repo-1",
        title: "orders-service",
        sourcePath: "/logs/orders.log",
      } as never,
    });

    expect(options[0]).toEqual({
      id: "repo-1",
      selected: true,
      title: "orders-service",
      path: "/logs/orders.log",
    });
    expect(summary?.eyebrow).toBe(en.session.selected);
    expect(summary?.title).toBe("orders-service");
  });
});
