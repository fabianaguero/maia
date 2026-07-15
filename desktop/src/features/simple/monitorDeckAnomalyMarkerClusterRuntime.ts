import type { OverviewAnomalyMarkerViewModel } from "./monitorDeckWavePanelTypes";

export interface StreamAnomalyMarkerCluster {
  id: string;
  left: number;
  count: number;
  marker: OverviewAnomalyMarkerViewModel;
  containsSelected: boolean;
}

export function clusterVisibleStreamAnomalyMarkers(input: {
  markers: OverviewAnomalyMarkerViewModel[];
  currentProgress: number;
  selectedAnomalyId: string | null;
  resolveRelativePosition: (progress: number, currentProgress: number) => number;
  isVisible: (relative: number) => boolean;
  thresholdPercent?: number;
}): StreamAnomalyMarkerCluster[] {
  const positioned = input.markers
    .map((marker) => ({
      marker,
      left: input.resolveRelativePosition(marker.progress, input.currentProgress) * 100,
    }))
    .filter(({ left }) => input.isVisible(left / 100))
    .sort((left, right) => left.left - right.left);
  const threshold = input.thresholdPercent ?? 2.4;

  return positioned.reduce<StreamAnomalyMarkerCluster[]>((clusters, item) => {
    const previous = clusters[clusters.length - 1];
    if (previous && item.left - previous.left <= threshold) {
      const nextCount = previous.count + 1;
      previous.left = (previous.left * previous.count + item.left) / nextCount;
      previous.count = nextCount;
      previous.containsSelected ||= item.marker.id === input.selectedAnomalyId;
      if (item.marker.severity > previous.marker.severity) {
        previous.marker = item.marker;
      }
      return clusters;
    }

    clusters.push({
      id: item.marker.id,
      left: item.left,
      count: 1,
      marker: item.marker,
      containsSelected: item.marker.id === input.selectedAnomalyId,
    });
    return clusters;
  }, []);
}
