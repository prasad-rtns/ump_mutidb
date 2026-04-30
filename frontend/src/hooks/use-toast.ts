'use client';
import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let _listeners: Array<(toasts: Toast[]) => void> = [];
let _toasts: Toast[] = [];

function emit(toasts: Toast[]) {
  _toasts = toasts;
  _listeners.forEach((l) => l(toasts));
}

export function toast({ title, description, variant = 'default' }: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2);
  emit([..._toasts, { id, title, description, variant }]);
  setTimeout(() => emit(_toasts.filter((t) => t.id !== id)), 4000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(_toasts);
  const listener = useCallback((t: Toast[]) => setToasts([...t]), []);
  useState(() => { _listeners.push(listener); return () => { _listeners = _listeners.filter((l) => l !== listener); }; });
  return { toasts, toast };
}
