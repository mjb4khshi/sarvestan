import React from 'react';

const CHECKBOX_MAP = {
  primary: 'checkbox-primary',
  secondary: 'checkbox-secondary',
  accent: 'checkbox-accent',
  success: 'checkbox-success',
  warn: 'checkbox-warn',
  danger: 'checkbox-danger',
  info: 'checkbox-info',
  neutral: 'checkbox-neutral',
};

/**
 * کامپوننت رسمی چک‌باکس سروستان و سرو یوآی
 */
export default function SarvCheckbox({
  checked,
  onChange,
  label,
  variant = 'primary',
  disabled = false,
  className = '',
  description = null,
  ...props
}) {
  const checkboxClass = CHECKBOX_MAP[variant] || CHECKBOX_MAP.primary;
  return (
    <label
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      <div className="relative shrink-0 flex items-center justify-center">
        <label className={`checkbox ${checkboxClass}`}>
          <input
            type="checkbox"
            checked={Boolean(checked)}
            onChange={(e) => onChange && onChange(e.target.checked)}
            disabled={disabled}
            {...props}
          />
          <svg
            className="checkbox-icon"
            viewBox="0 0 24 24"
            fill="none"
          >
            <polyline points="4 12 9 17 20 6" />
          </svg>
        </label>
      </div>
      {(label || description) && (
        <div className="flex flex-col text-right min-w-0">
          {label && (
            <span className="text-sm font-medium text-base-content group-hover:text-primary transition-colors truncate">
              {label}
            </span>
          )}
          {description && <span className="text-xs text-neutral mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  );
}
