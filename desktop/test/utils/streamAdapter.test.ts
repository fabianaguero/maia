import { describe, expect, it } from "vitest";

import { getStreamAdapterDescription, getStreamAdapterLabel } from "../../src/utils/streamAdapter";

describe("streamAdapter", () => {
  it("returns stable labels for every supported adapter kind", () => {
    expect(getStreamAdapterLabel("file")).toBe("File tail");
    expect(getStreamAdapterLabel("process")).toBe("Process stdout");
    expect(getStreamAdapterLabel("websocket")).toBe("WebSocket");
    expect(getStreamAdapterLabel("http-poll")).toBe("HTTP poll");
    expect(getStreamAdapterLabel("journald")).toBe("journald");
  });

  it("returns file-specific and disabled-adapter descriptions", () => {
    expect(getStreamAdapterDescription("file")).toContain("Tail the imported log file directly");
    expect(getStreamAdapterDescription("process")).toContain("Disabled in the Week 1 MVP");
    expect(getStreamAdapterDescription("websocket")).toContain("Use an imported log file instead");
    expect(getStreamAdapterDescription("http-poll")).toContain("Use an imported log file instead");
    expect(getStreamAdapterDescription("journald")).toContain("Use an imported log file instead");
  });
});
