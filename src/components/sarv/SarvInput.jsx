import React, { useState, useId } from 'react';

export default function SarvInput({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  variant = 'primary',
  icon = null,
  message = null,
  messageType = 'normal',
  className = '',
  disabled = false,
  hideIconOnFocus = false,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const id = useId();
  const showIcon = Boolean(icon) && !(hideIconOnFocus && focused);

  return (
    <div className={`input-wrap w-full text-right ${className}`}>
      {label && (
        <label htmlFor={id} className="input-label text-right mb-1.5 font-medium">
          {label}
        </label>
      )}
      <div className="input-box relative w-full flex items-center">
        {showIcon && (
          <span
            className="absolute right-3.5 z-10 text-neutral pointer-events-none flex items-center justify-center transition-opacity duration-200"
            aria-hidden
          >
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={(e) => {
            setFocused(true);
            onFocusProp?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlurProp?.(e);
          }}
          className={`input input-${variant} w-full ${showIcon ? 'pr-10 pl-4' : 'px-4'} py-2.5 rounded-input text-sm transition-all focus:outline-none`}
          style={{
            direction: type === 'password' || type === 'number' || type === 'email' ? 'ltr' : 'rtl',
            textAlign: type === 'password' || type === 'number' || type === 'email' ? 'left' : 'right'
          }}
          {...props}
        />
      </div>
      {message && (
        <span
          className={`text-xs mt-1.5 block ${
            messageType === 'danger'
              ? 'text-danger'
              : messageType === 'success'
                ? 'text-success'
                : messageType === 'warn'
                  ? 'text-warn'
                  : 'text-neutral'
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
