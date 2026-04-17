export type ToastKind = 'success' | 'error' | 'info';

export interface ToastEntry {
  id: number;
  kind: ToastKind;
  message: string;
}

const _toasts = ref<ToastEntry[]>([]);
let _id = 0;

export const useToast = () => {
  const push = (kind: ToastKind, message: string, timeoutMs = 3800) => {
    const id = ++_id;
    _toasts.value.push({ id, kind, message });
    setTimeout(() => {
      _toasts.value = _toasts.value.filter((t) => t.id !== id);
    }, timeoutMs);
  };

  return {
    toasts: _toasts,
    success: (msg: string) => push('success', msg),
    error: (msg: string) => push('error', msg),
    info: (msg: string) => push('info', msg),
  };
};
