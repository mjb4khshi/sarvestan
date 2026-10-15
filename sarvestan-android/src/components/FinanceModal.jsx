import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, X } from 'lucide-react';
import FinanceScreen from '../screens/FinanceScreen';

export default function FinanceModal({ isOpen, onClose, onNavigate }) {
  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.5 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative z-10 w-full max-w-[460px] rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 p-4 shadow-2xl h-[90vh] flex flex-col"
      >
        {/* هدر مودال امور مالی */}
        <div className="flex items-center justify-between pb-3 border-b border-base-500/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-success-soft text-success grid place-items-center shadow-sm">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-base-content">امور مالی و شهریه</h3>
              <p className="text-[11px] text-neutral">ریز تراز مالی، شهریه و رسید رسمی سرو</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* بدنه محتوا */}
        <div className="overflow-y-auto flex-1 no-scrollbar pt-1 pb-4">
          <FinanceScreen onNavigate={onNavigate} />
        </div>
      </motion.div>
    </div>
  );

  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}
