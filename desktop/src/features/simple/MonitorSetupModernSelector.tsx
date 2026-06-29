import type { ReactNode } from "react";

import { MonitorSetupMiniWave } from "./MonitorSetupMiniWave";

interface MonitorSetupModernSelectorProps<T> {
  label: string;
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  headerAside?: ReactNode;
  renderTitle: (item: T) => string;
  renderSub: (item: T) => string;
  color: string;
  seedPrefix?: string;
  renderLeading?: (item: T, isSelected: boolean) => ReactNode;
  renderAction?: (item: T, isSelected: boolean) => ReactNode;
  renderWave?: (item: T, isSelected: boolean) => ReactNode;
  renderBadge?: (item: T, isSelected: boolean) => ReactNode;
  emptyMessage: string;
}

export function MonitorSetupModernSelector<T extends { id: string }>({
  label,
  items,
  selectedId,
  onSelect,
  headerAside,
  renderTitle,
  renderSub,
  color,
  seedPrefix = "item",
  renderLeading,
  renderAction,
  renderWave,
  renderBadge,
  emptyMessage,
}: MonitorSetupModernSelectorProps<T>) {
  return (
    <div className="modern-selector">
      <div className="modern-selector__header">
        <div className="modern-selector__header-copy">
          <label className="setup-label">{label}</label>
          <span className="modern-selector__count">{items.length}</span>
        </div>
        {headerAside ? <div className="modern-selector__header-aside">{headerAside}</div> : null}
      </div>
      <div className="selector-grid">
        {items.length === 0 ? (
          <div className="selector-empty">
            <span>{emptyMessage}</span>
          </div>
        ) : (
          items.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                className={`selector-card ${isSelected ? "selected" : ""}`}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={renderTitle(item)}
                onClick={() => onSelect(item.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(item.id);
                  }
                }}
              >
                {renderLeading ? renderLeading(item, isSelected) : null}
                <div className="card-content">
                  <div className="card-head">
                    <span className="card-title">{renderTitle(item)}</span>
                    {renderBadge ? renderBadge(item, isSelected) : null}
                  </div>
                  <span className="card-sub">{renderSub(item)}</span>
                </div>
                {renderAction ? (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    {renderAction(item, isSelected)}
                  </div>
                ) : renderWave ? (
                  renderWave(item, isSelected)
                ) : (
                  <MonitorSetupMiniWave
                    color={color}
                    count={isSelected ? 14 : 6}
                    active={isSelected}
                    seed={`${seedPrefix}-${item.id}`}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
