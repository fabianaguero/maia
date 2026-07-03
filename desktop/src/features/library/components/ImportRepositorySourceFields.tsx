import type { RepositorySourceKind } from "../../../types/library";
import { ImportRepositoryCloudRunFields } from "./ImportRepositoryCloudRunFields";
import { ImportRepositorySourcePathField } from "./ImportRepositorySourcePathField";

interface ImportRepositorySourceFieldsProps {
  isGcpCloudRun: boolean;
  sourceKind: RepositorySourceKind;
  sourcePath: string;
  label: string;
  gcpProjectId: string;
  gcpServiceName: string;
  gcpRegion: string;
  sourcePathFieldCopy: {
    label: string;
    placeholder: string;
  };
  busy: boolean;
  pickerBusy: boolean;
  pickerBusyLabel: string;
  gcpProjectIdLabel: string;
  gcpProjectIdPlaceholder: string;
  cloudRunServiceLabel: string;
  cloudRunServicePlaceholder: string;
  regionOptionalLabel: string;
  regionPlaceholder: string;
  targetSessionLabelOptional: string;
  targetSessionLabelPlaceholder: string;
  onSourcePathChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onGcpProjectIdChange: (value: string) => void;
  onGcpServiceNameChange: (value: string) => void;
  onGcpRegionChange: (value: string) => void;
  onBrowseDirectory: () => void;
  onBrowseFile: () => void;
}

export function ImportRepositorySourceFields({
  isGcpCloudRun,
  sourceKind,
  sourcePath,
  label,
  gcpProjectId,
  gcpServiceName,
  gcpRegion,
  sourcePathFieldCopy,
  busy,
  pickerBusy,
  pickerBusyLabel,
  gcpProjectIdLabel,
  gcpProjectIdPlaceholder,
  cloudRunServiceLabel,
  cloudRunServicePlaceholder,
  regionOptionalLabel,
  regionPlaceholder,
  targetSessionLabelOptional,
  targetSessionLabelPlaceholder,
  onSourcePathChange,
  onLabelChange,
  onGcpProjectIdChange,
  onGcpServiceNameChange,
  onGcpRegionChange,
  onBrowseDirectory,
  onBrowseFile,
}: ImportRepositorySourceFieldsProps) {
  return (
    <div className="form-fields-section">
      {isGcpCloudRun ? (
        <ImportRepositoryCloudRunFields
          gcpProjectId={gcpProjectId}
          gcpServiceName={gcpServiceName}
          gcpRegion={gcpRegion}
          gcpProjectIdLabel={gcpProjectIdLabel}
          gcpProjectIdPlaceholder={gcpProjectIdPlaceholder}
          cloudRunServiceLabel={cloudRunServiceLabel}
          cloudRunServicePlaceholder={cloudRunServicePlaceholder}
          regionOptionalLabel={regionOptionalLabel}
          regionPlaceholder={regionPlaceholder}
          onGcpProjectIdChange={onGcpProjectIdChange}
          onGcpServiceNameChange={onGcpServiceNameChange}
          onGcpRegionChange={onGcpRegionChange}
        />
      ) : (
        <ImportRepositorySourcePathField
          sourceKind={sourceKind}
          sourcePath={sourcePath}
          sourcePathFieldCopy={sourcePathFieldCopy}
          busy={busy}
          pickerBusy={pickerBusy}
          pickerBusyLabel={pickerBusyLabel}
          onSourcePathChange={onSourcePathChange}
          onBrowseDirectory={onBrowseDirectory}
          onBrowseFile={onBrowseFile}
        />
      )}

      <label className="field maia-field">
        <span className="field-label">{targetSessionLabelOptional}</span>
        <input
          value={label}
          className="maia-input"
          onChange={(event) => onLabelChange(event.target.value)}
          placeholder={targetSessionLabelPlaceholder}
        />
      </label>
    </div>
  );
}
