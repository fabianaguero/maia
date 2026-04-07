import React from "react";

interface ProgressBarProps {
  visible: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar" />
    </div>
  );
};
