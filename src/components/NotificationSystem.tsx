"use client";
import React, { useEffect } from 'react';
import { usePantryStore, Toast } from '@/store/pantryStore';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

const icons = {
  success: <CheckCircle className="text-green-500" />,
  error: <XCircle className="text-red-500" />,
  info: <AlertTriangle className="text-blue-500" />,
};

const colors = {
  success: 'border-green-500',
  error: 'border-red-500',
  info: 'border-blue-500',
};

// This is the individual toast component
const ToastComponent: React.FC<{ toast: Toast }> = ({ toast }) => {
  const removeToast = usePantryStore((state) => state.removeToast);

  // Auto-dismiss the toast after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative w-full max-w-sm p-4 bg-white rounded-lg shadow-xl border-l-4 ${colors[toast.type]}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{icons[toast.type]}</div>
        <p className="flex-1 text-sm font-medium text-gray-800">{toast.message}</p>
        <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
    </motion.div>
  );
};

// This container holds and manages all active toasts
export const NotificationSystem = () => {
  const toasts = usePantryStore((state) => state.toasts);

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};