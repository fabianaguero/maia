import { describe, expect, it } from "vitest";

import {
  filterObservableConnectionLines,
  findCloudProbeError,
  hasCloudReadyMarker,
  isCloudSdkNoise,
} from "../../../src/features/simple/connectionProbeMarkers";

describe("connectionProbeMarkers", () => {
  it("filters Cloud SDK syntax noise from observable lines", () => {
    expect(
      filterObservableConnectionLines({
        warnings: [
          "/usr/lib/google-cloud-sdk/... SyntaxWarning: ignored",
          "Initializing tail session",
        ],
        parsedLines: ["Waiting for new log lines"],
      }),
    ).toEqual(["Initializing tail session", "Waiting for new log lines"]);
  });

  it("detects known ready markers from Cloud Run tail startup", () => {
    expect(hasCloudReadyMarker(["foo", "Waiting for new log lines from Cloud Logging"])).toBe(true);
    expect(hasCloudReadyMarker(["foo", "bar"])).toBe(false);
  });

  it("returns the first known adapter startup error", () => {
    expect(
      findCloudProbeError([
        "noise",
        "ERROR: You do not currently have an active account selected.",
        "Permission denied",
      ]),
    ).toContain("ERROR:");
    expect(findCloudProbeError(["healthy line"])).toBeNull();
  });

  it("recognizes Cloud SDK syntax warnings specifically", () => {
    expect(isCloudSdkNoise("/usr/lib/google-cloud-sdk/... SyntaxWarning: x")).toBe(true);
    expect(isCloudSdkNoise("plain log line")).toBe(false);
  });
});
