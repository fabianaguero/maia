interface CatalogNotice {
  tone: "success" | "error" | "info";
  title: string;
  body: string;
}

interface RunCatalogResultActionInput<T> {
  task: () => Promise<T | null>;
  onSuccess: (result: T) => CatalogNotice;
  onError: (error: unknown) => CatalogNotice;
  onEmpty?: () => CatalogNotice | null;
  notify: (tone: "success" | "error" | "info", title: string, body: string) => void;
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

interface RunCatalogBooleanActionInput {
  task: () => Promise<boolean>;
  onSuccess: () => CatalogNotice;
  onError: (error: unknown) => CatalogNotice;
  notify: (tone: "success" | "error" | "info", title: string, body: string) => void;
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

interface RunCatalogUpdateActionInput {
  task: () => Promise<unknown>;
  notify: (tone: "success" | "error" | "info", title: string, body: string) => void;
  onMissing: CatalogNotice;
  onError: (error: unknown) => CatalogNotice;
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
