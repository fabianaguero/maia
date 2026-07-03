import type { AppTranslations } from "../../i18n/en";
import type { ComposeScreenViewModel } from "./composeScreenRuntime";
import type { ReturnTypeOfBuildComposeScreenSummaryState } from "./composeScreenTypes";

interface ComposeScreenHeaderProps {
  t: AppTranslations;
  viewModel: ComposeScreenViewModel;
  summaryState: ReturnTypeOfBuildComposeScreenSummaryState;
}

export function ComposeScreenHeader({ t, viewModel, summaryState }: ComposeScreenHeaderProps) {
  return (
    <header className="screen-header">
      <div>
        <p className="eyebrow">{t.compose.title}</p>
        <h2>{viewModel.title}</h2>
        <p className="support-copy">{viewModel.copy}</p>
      </div>
      {summaryState.showSummary && (
        <div className="screen-summary">
          <div className="summary-pill">
            <span>{t.compose.compositions}</span>
            <strong>{summaryState.compositionsCount}</strong>
          </div>
          {summaryState.selectedComposition && (
            <>
              <div className="summary-pill">
                <span>{t.compose.targetBpm}</span>
                <strong>{summaryState.targetBpmLabel}</strong>
              </div>
              <div className="summary-pill">
                <span>{t.compose.timingSource}</span>
                <strong>{summaryState.timingSourceLabel}</strong>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
