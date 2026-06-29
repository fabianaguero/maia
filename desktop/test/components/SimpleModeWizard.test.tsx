import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

import { SimpleModeWizard } from "../../src/features/simple/SimpleModeWizard";

const importRepositoryFormSpy = vi.fn();
const importBaseAssetFormSpy = vi.fn();

vi.mock("../../src/i18n/I18nContext", () => ({
  useT: () => ({
    simpleMode: {
      wizard: {
        title: "Wizard",
        calm: "Calm",
        calmDesc: "Calm desc",
        alert: "Alert",
        alertDesc: "Alert desc",
        intense: "Intense",
        intenseDesc: "Intense desc",
        startButton: "Start",
        errorMessage: "Missing selection",
      },
      steps: {
        step1: "Step 1",
        step2: "Step 2",
        step3: "Step 3",
      },
    },
  }),
}));

vi.mock("../../src/features/library/components/ImportRepositoryForm", () => ({
  ImportRepositoryForm: (props: unknown) => {
    importRepositoryFormSpy(props);
    return <div>import-repository-form</div>;
  },
}));

vi.mock("../../src/features/library/components/ImportBaseAssetForm", () => ({
  ImportBaseAssetForm: (props: unknown) => {
    importBaseAssetFormSpy(props);
    return <div>import-base-asset-form</div>;
  },
}));

describe("SimpleModeWizard", () => {
  const onImportRepository = vi.fn(async () => true);
  const onImportBaseAsset = vi.fn(async () => true);
  const onStartSession = vi.fn(async () => undefined);

  beforeEach(() => {
    importRepositoryFormSpy.mockClear();
    importBaseAssetFormSpy.mockClear();
    onImportRepository.mockClear();
    onImportBaseAsset.mockClear();
    onStartSession.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders repository import first when no repositories exist", () => {
    render(
      <SimpleModeWizard
        busyRepository={false}
        busyBaseAsset={false}
        onImportRepository={onImportRepository}
        onImportBaseAsset={onImportBaseAsset}
        onStartSession={onStartSession}
        repositoryCount={0}
        baseAssetCount={0}
        baseAssetCategories={[]}
      />,
    );

    expect(screen.getByText("import-repository-form")).toBeInTheDocument();
    expect(importRepositoryFormSpy).toHaveBeenCalled();
  });

  it("renders base asset import when repositories exist but assets do not", () => {
    render(
      <SimpleModeWizard
        busyRepository={false}
        busyBaseAsset={false}
        onImportRepository={onImportRepository}
        onImportBaseAsset={onImportBaseAsset}
        onStartSession={onStartSession}
        repositoryCount={1}
        baseAssetCount={0}
        baseAssetCategories={[]}
        defaultCategoryId="drums"
      />,
    );

    expect(screen.getByText("import-base-asset-form")).toBeInTheDocument();
    expect(importBaseAssetFormSpy).toHaveBeenCalled();
  });

  it("shows the preset step and keeps the start button disabled without a valid selection", () => {
    render(
      <SimpleModeWizard
        busyRepository={false}
        busyBaseAsset={false}
        onImportRepository={onImportRepository}
        onImportBaseAsset={onImportBaseAsset}
        onStartSession={onStartSession}
        repositoryCount={1}
        baseAssetCount={1}
        baseAssetCategories={[]}
      />,
    );

    const startButton = screen.getByText("Start");
    expect(startButton).toBeDisabled();

    fireEvent.click(screen.getByText("Calm"));
    expect(startButton).not.toBeDisabled();

    fireEvent.click(startButton);
    expect(screen.getByText("Missing selection")).toBeInTheDocument();
    expect(onStartSession).not.toHaveBeenCalled();
  });
});
