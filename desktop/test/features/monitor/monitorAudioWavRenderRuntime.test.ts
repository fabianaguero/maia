import { describe, expect, it } from "vitest";

import { renderMono16BitWav } from "../../../src/features/monitor/monitorAudioWavRenderRuntime";

function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("failed to read blob"));
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(blob);
  });
}

describe("monitorAudioWavRenderRuntime", () => {
  it("renders a mono 16-bit wav payload", async () => {
    const blob = renderMono16BitWav(new Float32Array([2, -2, 0.5, -0.5]), 44100);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("audio/wav");
    expect(blob.size).toBe(52);

    const buffer = await readBlobAsArrayBuffer(blob);
    const view = new DataView(buffer);
    expect(
      String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)),
    ).toBe("RIFF");
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(-32767);
  });
});
