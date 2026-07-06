export interface CatalogNotice {
  tone: "success" | "error" | "info";
  title: string;
  body: string;
}

export type CatalogNotify = (
  tone: "success" | "error" | "info",
  title: string,
  body: string,
) => void;

export interface RunCatalogResultActionInput<T> {
  task: () => Promise<T | null>;
  onSuccess: (result: T) => CatalogNotice;
  onError: (error: unknown) => CatalogNotice;
  onEmpty?: () => CatalogNotice | null;
  notify: CatalogNotify;
}

export interface RunCatalogBooleanActionInput {
  task: () => Promise<boolean>;
  onSuccess: () => CatalogNotice;
  onError: (error: unknown) => CatalogNotice;
  notify: CatalogNotify;
}

export interface RunCatalogUpdateActionInput {
  task: () => Promise<unknown>;
  notify: CatalogNotify;
  onMissing: CatalogNotice;
  onError: (error: unknown) => CatalogNotice;
}

export interface BuildCatalogNamedResultActionInput<T> {
  task: () => Promise<T | null>;
  resolveName: (result: T) => string;
  successTitle: string;
  successBodyTemplate: string;
  errorTitle: string;
  notify: CatalogNotify;
}

export interface BuildCatalogBooleanNoticeActionInput {
  task: () => Promise<boolean>;
  successTitle: string;
  successBody: string;
  errorTitle: string;
  notify: CatalogNotify;
}

export interface BuildCatalogUpdateNoticeActionInput {
  task: () => Promise<unknown>;
  notify: CatalogNotify;
  missingTitle: string;
  missingBody: string;
  errorTitle: string;
}

export async function runCatalogResultAction<T>({
  task,
  onSuccess,
  onError,
  onEmpty,
  notify,
}: RunCatalogResultActionInput<T>): Promise<boolean> {
  try {
    const result = await task();
    if (!result) {
      const emptyNotice = onEmpty?.() ?? null;
      if (emptyNotice) {
        notify(emptyNotice.tone, emptyNotice.title, emptyNotice.body);
      }
      return false;
    }

    const notice = onSuccess(result);
    notify(notice.tone, notice.title, notice.body);
    return true;
  } catch (error) {
    const notice = onError(error);
    notify(notice.tone, notice.title, notice.body);
    return false;
  }
}

export async function runCatalogBooleanAction({
  task,
  onSuccess,
  onError,
  notify,
}: RunCatalogBooleanActionInput): Promise<boolean> {
  try {
    const success = await task();
    if (!success) {
      return false;
    }

    const notice = onSuccess();
    notify(notice.tone, notice.title, notice.body);
    return true;
  } catch (error) {
    const notice = onError(error);
    notify(notice.tone, notice.title, notice.body);
    return false;
  }
}

export async function runCatalogUpdateAction({
  task,
  notify,
  onMissing,
  onError,
}: RunCatalogUpdateActionInput): Promise<void> {
  try {
    const result = await task();
    if (!result) {
      notify(onMissing.tone, onMissing.title, onMissing.body);
    }
  } catch (error) {
    const notice = onError(error);
    notify(notice.tone, notice.title, notice.body);
  }
}

export function buildCatalogNamedResultAction<T>({
  task,
  resolveName,
  successTitle,
  successBodyTemplate,
  errorTitle,
  notify,
}: BuildCatalogNamedResultActionInput<T>): RunCatalogResultActionInput<T> {
  return {
    task,
    onSuccess: (result) => ({
      tone: "success",
      title: successTitle,
      body: successBodyTemplate.replace("{title}", resolveName(result)),
    }),
    onError: (error) => ({
      tone: "error",
      title: errorTitle,
      body: String(error),
    }),
    notify,
  };
}

export function buildCatalogBooleanNoticeAction({
  task,
  successTitle,
  successBody,
  errorTitle,
  notify,
}: BuildCatalogBooleanNoticeActionInput): RunCatalogBooleanActionInput {
  return {
    task,
    onSuccess: () => ({
      tone: "success",
      title: successTitle,
      body: successBody,
    }),
    onError: (error) => ({
      tone: "error",
      title: errorTitle,
      body: String(error),
    }),
    notify,
  };
}

export function buildCatalogUpdateNoticeAction({
  task,
  notify,
  missingTitle,
  missingBody,
  errorTitle,
}: BuildCatalogUpdateNoticeActionInput): RunCatalogUpdateActionInput {
  return {
    task,
    notify,
    onMissing: {
      tone: "error",
      title: missingTitle,
      body: missingBody,
    },
    onError: (error) => ({
      tone: "error",
      title: errorTitle,
      body: String(error),
    }),
  };
}
