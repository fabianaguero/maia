export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export function createToastId(randomValue: number): string {
  return randomValue.toString(36).slice(2, 11);
}

export function createToast(
  input: {
    message?: string;
    title: string;
    type: ToastType;
  },
  randomValue: number,
): Toast {
  return {
    id: createToastId(randomValue),
    type: input.type,
    title: input.title,
    message: input.message,
  };
}

export function appendToast(current: Toast[], toast: Toast): Toast[] {
  return [...current, toast];
}

export function removeToastById(current: Toast[], id: string): Toast[] {
  return current.filter((toast) => toast.id !== id);
}
