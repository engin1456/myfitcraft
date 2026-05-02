import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

interface ToastState {
  toasts: Toast[];
  show: (params: { message: string; variant?: ToastVariant; durationMs?: number }) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

/**
 * Hafif toast queue. UI tarafında <ToastHost /> render edilir,
 * Alert.alert yerine ufak snackbar olarak gösterilir.
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: ({ message, variant = 'info', durationMs = 2400 }) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          message,
          variant,
          durationMs,
        },
      ],
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Helper — herhangi bir yerden çağrılabilir (component dışı). */
export const toast = {
  success: (message: string, durationMs?: number) =>
    useToastStore.getState().show({ message, variant: 'success', durationMs }),
  error: (message: string, durationMs?: number) =>
    useToastStore.getState().show({ message, variant: 'error', durationMs }),
  info: (message: string, durationMs?: number) =>
    useToastStore.getState().show({ message, variant: 'info', durationMs }),
};
