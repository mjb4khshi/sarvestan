import React from 'react';
import { motion } from 'framer-motion';

/**
 * تب‌های segmented با نشانگر لغزان (مثل ناوبری Sidebar سرو)
 * items: [{ id, label, icon? }]
 */
export default function SarvTabs({
  items = [],
  value,
  onChange,
  layoutId = 'sarvTabsPill',
  className = '',
  size = 'md'
}) {
  const pad = size === 'sm' ? 'px-2 py-1.5 text-[11px]' : 'px-3 py-2 text-xs';

  return (
    <div className={`sarv-seg w-full ${className}`} role="tablist">
      {items.map((item) => {
        const isActive = value === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(item.id)}
            title={item.title || item.label}
            className={`relative flex-1 min-w-0 flex items-center justify-center gap-1.5 rounded-[var(--radius-button,0.75rem)] transition-colors outline-none ${pad} ${
              isActive
                ? 'text-primary-content font-semibold z-10'
                : 'text-neutral hover:text-base-content font-medium z-10'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 bg-primary rounded-[var(--radius-button,0.75rem)] z-0 shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5 truncate">
              {Icon ? <Icon className="w-3.5 h-3.5 shrink-0" /> : null}
              <span className="truncate">{item.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
