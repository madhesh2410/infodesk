import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToastMessage } from '@/types';
import { generateId } from '@/lib/utils';

interface ToastContextValue {
  toast: (message: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = generateId();
    setToasts(prev => [...prev, { ...message, id }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const success = useCallback((title: string, description?: string) => toast({ type: 'success', title, description }), [toast]);
  const error = useCallback((title: string, description?: string) => toast({ type: 'error', title, description }), [toast]);
  const warning = useCallback((title: string, description?: string) => toast({ type: 'warning', title, description }), [toast]);
  const info = useCallback((title: string, description?: string) => toast({ type: 'info', title, description }), [toast]);

  const icons = {
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    error: <AlertCircle className="h-4 w-4 text-red-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />,
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 bg-white border rounded-lg shadow-lg px-4 py-3 transition-all',
              'animate-slide-in-right',
              t.type === 'success' && 'border-green-200',
              t.type === 'error' && 'border-red-200',
              t.type === 'warning' && 'border-amber-200',
              t.type === 'info' && 'border-blue-200',
            )}
          >
            <div className="pt-0.5">{icons[t.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{t.title}</p>
              {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
