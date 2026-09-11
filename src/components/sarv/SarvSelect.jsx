import React, { useState, useRef, useEffect } from 'react';

export default function SarvSelect({
  label,
  value,
  onChange,
  options = [], // [{ value: '...', label: '...', icon: '...', description: '...' }]
  placeholder = 'انتخاب کنید...',
  variant = 'primary',
  className = '',
  size = 'md', // sm, md, lg
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`select-wrap w-full text-right ${className}`} ref={containerRef}>
      {label && <label className="select-label text-right mb-1.5 font-medium">{label}</label>}
      <div className="select-box relative w-full">
        <div className={`select select-${variant} ${size === 'sm' ? 'select-sm' : ''} ${isOpen ? 'is-open' : ''} w-full`}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className="select-trigger w-full flex items-center justify-between"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className="select-value flex items-center gap-2 text-sm">
              {selectedOption ? (
                <>
                  {selectedOption.icon && <span className="text-base">{selectedOption.icon}</span>}
                  <span>{selectedOption.label}</span>
                </>
              ) : (
                <span className="text-neutral">{placeholder}</span>
              )}
            </span>
            <svg
              className="select-chevron transition-transform duration-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {isOpen && (
            <div className="select-menu" role="listbox" style={{ opacity: 1, visibility: 'visible', transform: 'translateY(0) scale(1)' }}>
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`select-option ${isSelected ? 'is-selected font-semibold' : ''} cursor-pointer p-2 rounded-lg flex items-center justify-between text-sm transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      {opt.icon && <span>{opt.icon}</span>}
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && (
                      <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
