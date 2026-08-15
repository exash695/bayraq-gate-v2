import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, onClose, onConfirm, title, message, confirmText = 'نعم، حذف', cancelText = 'لا', type = 'danger' 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1c24] border border-slate-700 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
        <h3 className="text-white text-xl font-bold mb-3 text-center">{title}</h3>
        <p className="text-slate-400 mb-8 text-center">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-4 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 font-bold transition-all">{cancelText}</button>
          <button onClick={async () => { await onConfirm(); onClose(); }} className={`flex-1 px-4 py-4 text-white rounded-2xl font-bold transition-all ${type === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]'}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};
