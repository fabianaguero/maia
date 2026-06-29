import React from "react";
import { useT } from "../i18n/I18nContext";

interface Web3SpinnerProps {
  visible: boolean;
  label?: string;
}

export const Web3Spinner: React.FC<Web3SpinnerProps> = ({ visible, label }) => {
  const t = useT();
  if (!visible) return null;

  return (
    <div className="web3-loader-overlay">
      <div className="orbit-spinner-container">
        <div className="orbit-halo" />
        <div className="orbit-inner" />
        <div className="orbit-core" />
      </div>
      <div className="loader-label">{label ?? t.simpleMode.common.analyzingDna}</div>
    </div>
  );
};
