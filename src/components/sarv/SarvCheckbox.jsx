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
    <label className={`inline-flex items-start gap-3 cursor-pointer select-none group ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
      <div className="relative mt-0.5">
        <label className={`checkbox ${checkboxClass}`}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            {...props}
          />
        </label>
      </div>
      {(label || description) && (
        <div className="flex flex-col text-right">
          {label && <span className="text-sm font-medium text-base-content group-hover:text-primary transition-colors">{label}</span>}
          {description && <span className="text-xs text-neutral mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  );
}
