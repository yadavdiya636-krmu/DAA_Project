import React from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';

const STYLES = {
  success: { icon: CheckCircle2, bar: 'bg-emerald-500', iconColor: 'text-emerald-500' },
  error: { icon: XCircle, bar: 'bg-rose-500', iconColor: 'text-rose-500' },
  warning: { icon: AlertTriangle, bar: 'bg-amber-500', iconColor: 'text-amber-500' },
  info: { icon: Info, bar: 'bg-brand-500', iconColor: 'text-brand-500' },
};

export default function ToastViewport() {
  const { toasts, dismiss } = useToast();
  if (!toasts.length) return null;
  return (
    <div className="no-print pointer-events-none fixed right-4 top-20 z-[200] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2.5 sm:right-6">
      {toasts.map((toast) => {
        const style = STYLES[toast.type] || STYLES.info;
        const Icon = style.icon;
        return (
          <div key={toast.id} className="pointer-events-auto relative animate-slide-in overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 pl-4 shadow-float dark:border-slate-700 dark:bg-slate-900">
            <span className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} />
            <div className="flex items-start gap-3">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconColor}`} />
              <div className="min-w-0 flex-1">
                {toast.title && <p className="text-sm font-bold text-slate-900 dark:text-white">{toast.title}</p>}
                <p className="text-sm leading-snug text-slate-600 dark:text-slate-300">{toast.message}</p>
              </div>
              <button onClick={() => dismiss(toast.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Dismiss notification">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
