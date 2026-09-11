import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, AlertCircle, Search } from 'lucide-react';
import SarvButton from './sarv/SarvButton';
import SarvBadge from './sarv/SarvBadge';
import { toFaDigits } from '../utils/faDigits';

/**
 * مودال: گزارش/فرآیند هنوز در سروستان پیاده نشده
 */
export default function NotAvailableModal({ item, onClose }) {
  if (!item) return null;

  const openBehestan = () => {
    window.open('https://behestan.kntu.ac.ir/', '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          className="sarv-card p-6 w-full max-w-md space-y-5 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-[var(--radius-button,0.75rem)] bg-warn/15 text-warn shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.code && (
                    <SarvBadge variant="warn" soft size="sm" className="font-mono">
                      فرم {toFaDigits(item.code)}
                    </SarvBadge>
                  )}
                  {item.type === 'report' && (
                    <SarvBadge variant="neutral" outline size="sm">گزارش</SarvBadge>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-base-content leading-relaxed">
                  {item.title}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral hover:text-base-content hover:bg-base-500/40 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-neutral leading-relaxed">
            این مورد هنوز در <strong className="text-base-content">سروستان</strong> پیاده نشده است.
          </p>

          <div className="p-3 rounded-[var(--radius-button,0.75rem)] bg-warn/10 border border-warn/25 flex items-start gap-2.5 text-xs text-warn">
            <Search className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              پس از باز شدن بهستان، در منوی سامانه{' '}
              {item.code && (
                <strong className="font-mono">«{toFaDigits(item.code)}»</strong>
              )}{' '}
              را سرچ یا از لیست انتخاب کنید.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <SarvButton
              variant="primary"
              className="flex-1"
              onClick={openBehestan}
            >
              <ExternalLink className="w-4 h-4 ml-1.5" />
              باز کردن بهستان
            </SarvButton>
            <SarvButton
              variant="primary"
              styleType="flat"
              onClick={onClose}
            >
              بستن
            </SarvButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
