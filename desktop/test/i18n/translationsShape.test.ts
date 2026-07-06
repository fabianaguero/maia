import { describe, expect, it } from "vitest";

import { en } from "../../src/i18n/en";
import { es } from "../../src/i18n/es";

function collectShape(value: unknown, prefix = ""): Map<string, string> {
  const shape = new Map<string, string>();

  if (Array.isArray(value)) {
    shape.set(prefix, "array");
    return shape;
  }

  if (value && typeof value === "object") {
    shape.set(prefix, "object");
    for (const [key, child] of Object.entries(value)) {
      const childPrefix = prefix ? `${prefix}.${key}` : key;
      for (const [path, type] of collectShape(child, childPrefix)) {
        shape.set(path, type);
      }
    }
    return shape;
  }

  shape.set(prefix, typeof value);
  return shape;
}

describe("i18n translation shape", () => {
  it("keeps the english and spanish dictionaries aligned", () => {
    const englishShape = collectShape(en);
    const spanishShape = collectShape(es);

    expect([...spanishShape.keys()].sort()).toEqual([...englishShape.keys()].sort());

    for (const [path, englishType] of englishShape) {
      expect(spanishShape.get(path), `translation mismatch at ${path}`).toBe(englishType);
    }
  });
});
