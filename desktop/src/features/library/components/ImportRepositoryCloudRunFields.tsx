interface ImportRepositoryCloudRunFieldsProps {
  gcpProjectId: string;
  gcpServiceName: string;
  gcpRegion: string;
  gcpProjectIdLabel: string;
  gcpProjectIdPlaceholder: string;
  cloudRunServiceLabel: string;
  cloudRunServicePlaceholder: string;
  regionOptionalLabel: string;
  regionPlaceholder: string;
  onGcpProjectIdChange: (value: string) => void;
  onGcpServiceNameChange: (value: string) => void;
  onGcpRegionChange: (value: string) => void;
}

export function ImportRepositoryCloudRunFields({
  gcpProjectId,
  gcpServiceName,
  gcpRegion,
  gcpProjectIdLabel,
  gcpProjectIdPlaceholder,
  cloudRunServiceLabel,
  cloudRunServicePlaceholder,
  regionOptionalLabel,
  regionPlaceholder,
  onGcpProjectIdChange,
  onGcpServiceNameChange,
  onGcpRegionChange,
}: ImportRepositoryCloudRunFieldsProps) {
  return (
    <>
      <label className="field maia-field">
        <span className="field-label">{gcpProjectIdLabel}</span>
        <input
          value={gcpProjectId}
          className="maia-input"
          onChange={(event) => onGcpProjectIdChange(event.target.value)}
          placeholder={gcpProjectIdPlaceholder}
        />
      </label>
      <label className="field maia-field">
        <span className="field-label">{cloudRunServiceLabel}</span>
        <input
          value={gcpServiceName}
          className="maia-input"
          onChange={(event) => onGcpServiceNameChange(event.target.value)}
          placeholder={cloudRunServicePlaceholder}
        />
      </label>
      <label className="field maia-field">
        <span className="field-label">{regionOptionalLabel}</span>
        <input
          value={gcpRegion}
          className="maia-input"
          onChange={(event) => onGcpRegionChange(event.target.value)}
          placeholder={regionPlaceholder}
        />
      </label>
    </>
  );
}
