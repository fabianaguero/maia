import { describe, expect, it } from "vitest";

import {
  appendUniqueEntity,
  clearDeletedSelectedEntityId,
  removeEntityById,
  replaceEntityById,
  resolveSelectedEntityId,
  sortEntitiesByDescendingTimestamp,
} from "../../src/hooks/entityCollectionRuntime";

interface TestEntity {
  id: string;
  updatedAt: string;
  label: string;
}

function createEntity(id: string, updatedAt: string): TestEntity {
  return {
    id,
    updatedAt,
    label: id,
  };
}

describe("entityCollectionRuntime", () => {
  it("sorts entities by descending timestamp", () => {
    const older = createEntity("older", "2026-07-03T10:00:00.000Z");
    const newer = createEntity("newer", "2026-07-03T11:00:00.000Z");

    expect(sortEntitiesByDescendingTimestamp([older, newer], (entity) => entity.updatedAt)).toEqual(
      [newer, older],
    );
  });

  it("resolves the selected entity id safely", () => {
    const older = createEntity("older", "2026-07-03T10:00:00.000Z");
    const newer = createEntity("newer", "2026-07-03T11:00:00.000Z");

    expect(resolveSelectedEntityId("newer", [older, newer])).toBe("newer");
    expect(resolveSelectedEntityId("missing", [older, newer])).toBe("older");
    expect(resolveSelectedEntityId(null, [])).toBeNull();
  });

  it("appends, replaces and removes entities by id", () => {
    const older = createEntity("older", "2026-07-03T10:00:00.000Z");
    const newer = createEntity("newer", "2026-07-03T11:00:00.000Z");
    const replacement = { ...older, label: "replacement" };

    expect(appendUniqueEntity([older], newer)).toEqual([newer, older]);
    expect(appendUniqueEntity([older], { ...older, label: "updated" })).toEqual([
      { ...older, label: "updated" },
    ]);
    expect(replaceEntityById([older, newer], "older", replacement)).toEqual([replacement, newer]);
    expect(removeEntityById([older, newer], "older")).toEqual([newer]);
  });

  it("clears the selected entity when the matching entity is deleted", () => {
    expect(clearDeletedSelectedEntityId("older", "older")).toBeNull();
    expect(clearDeletedSelectedEntityId("older", "newer")).toBe("older");
  });
});
