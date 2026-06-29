import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import { LibraryConnectionsListPanel } from "../../src/features/library/components/LibraryConnectionsListPanel";

function renderWithI18n(node: ReactNode) {
  return render(<I18nContext.Provider value={en}>{node}</I18nContext.Provider>);
}

describe("LibraryConnectionsListPanel", () => {
  it("renders saved connections and deletes the selected connection", () => {
    const onDeleteConnection = vi.fn();

    renderWithI18n(
      <LibraryConnectionsListPanel
        connections={[
          {
            id: "conn-1",
            label: "services",
            kind: "gcp_cloud_run",
            enabled: true,
            adapterKind: "gcloud",
            sourceUri: "gcp-cloud-run://project/services",
            updatedAt: "2026-06-28T14:00:00.000Z",
          } as never,
        ]}
        onDeleteConnection={onDeleteConnection}
      />,
    );

    expect(screen.getByText("services")).toBeInTheDocument();
    expect(screen.getByText(/gcp cloud run/i)).toBeInTheDocument();
    expect(screen.getByText("gcp-cloud-run://project/services")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: en.library.deleteConnection }));

    expect(onDeleteConnection).toHaveBeenCalledWith("conn-1");
  });
});
