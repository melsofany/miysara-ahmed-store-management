interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
const listeners = new Set<(toasts: Toast[]) => void>();
let current: Toast[] = [];

function emit() {
  listeners.forEach((l) => l([...current]));
}

// eslint-disable-next-line react-refresh/only-export-components
export function toast(message: string, type: Toast['type'] = 'success') {
  const id = `t${++toastId}`;
  current = [...current, { id, message, type }];
  emit();
  setTimeout(() => {
    current = current.filter((t) => t.id !== id);
    emit();
  }, 3500);
}

export function ToastContainer() {
  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-2">
      <ToastList />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

function ToastList() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  const icon = {
    success: <CheckCircle2 size={18} className="text-green-600" />,
    error: <XCircle size={18} className="text-red-600" />,
    info: <Info size={18} className="text-blue-600" />,
  };
  const border = {
    success: 'border-green-200',
    error: 'border-red-200',
    info: 'border-blue-200',
  };

  return (
    <>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-pop flex items-center gap-2.5 rounded-xl border ${border[t.type]} bg-white px-4 py-3 shadow-lg`}
        >
          {icon[t.type]}
          <span className="text-sm font-semibold text-slate-700">{t.message}</span>
        </div>
      ))}
    </>
  );
}
