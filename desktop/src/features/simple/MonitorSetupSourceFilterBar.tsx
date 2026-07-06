import type { MonitorSourceFilter } from "./monitorSourceOptions";

interface MonitorSetupSourceFilterOption {
  id: MonitorSourceFilter;
  label: string;
}

interface MonitorSetupSourceFilterBarProps {
  sourceFilter: MonitorSourceFilter;
  sourceFilterOptions: MonitorSetupSourceFilterOption[];
  filterAriaLabel: string;
  onSourceFilterChange: (filter: MonitorSourceFilter) => void;
}

export function MonitorSetupSourceFilterBar({
  sourceFilter,
  sourceFilterOptions,
  filterAriaLabel,
  onSourceFilterChange,
}: MonitorSetupSourceFilterBarProps) {
  return (
    <div className="source-filter-bar" role="tablist" aria-label={filterAriaLabel}>
      {sourceFilterOptions.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={`source-filter-chip ${sourceFilter === filter.id ? "active" : ""}`}
          onClick={() => onSourceFilterChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
