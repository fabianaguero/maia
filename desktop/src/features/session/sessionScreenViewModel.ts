export type {
  BuildSessionScreenViewModelInput,
  SessionScreenViewModel,
} from "./sessionScreenViewModelTypes";

import { buildSessionScreenBoothProps } from "./sessionScreenBoothPropsRuntime";
import { buildSessionScreenHeaderProps } from "./sessionScreenHeaderPropsRuntime";
import { buildSessionScreenNoticeProps } from "./sessionScreenNoticePropsRuntime";
import { buildSessionScreenPanelsProps } from "./sessionScreenPanelsPropsRuntime";
import type {
  BuildSessionScreenViewModelInput,
  SessionScreenViewModel,
} from "./sessionScreenViewModelTypes";

export function buildSessionScreenViewModel(
  input: BuildSessionScreenViewModelInput,
): SessionScreenViewModel {
  return {
    headerProps: buildSessionScreenHeaderProps(input),
    noticeProps: buildSessionScreenNoticeProps(input),
    boothProps: buildSessionScreenBoothProps(input),
    panelsProps: buildSessionScreenPanelsProps(input),
  };
}
