export interface IdentifiedEntity {
  id: string;
}

export function sortEntitiesByDescendingTimestamp<T>(
  entities: readonly T[],
  getTimestamp: (entity: T) => string,
): T[] {
  return [...entities].sort((left, right) => getTimestamp(right).localeCompare(getTimestamp(left)));
}

export function resolveSelectedEntityId<T extends IdentifiedEntity>(
  current: string | null,
  entities: readonly T[],
): string | null {
  if (current && entities.some((entity) => entity.id === current)) {
    return current;
  }

  return entities[0]?.id ?? null;
}

export function appendUniqueEntity<T extends IdentifiedEntity>(
  entities: readonly T[],
  nextEntity: T,
): T[] {
  return [nextEntity, ...entities.filter((entity) => entity.id !== nextEntity.id)];
}

export function replaceEntityById<T extends IdentifiedEntity>(
  entities: readonly T[],
  entityId: string,
  nextEntity: T,
): T[] {
  return entities.map((entity) => (entity.id === entityId ? nextEntity : entity));
}

export function removeEntityById<T extends IdentifiedEntity>(
  entities: readonly T[],
  entityId: string,
): T[] {
  return entities.filter((entity) => entity.id !== entityId);
}

export function clearDeletedSelectedEntityId(
  selectedEntityId: string | null,
  entityId: string,
): string | null {
  return selectedEntityId === entityId ? null : selectedEntityId;
}
