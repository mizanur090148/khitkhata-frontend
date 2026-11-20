import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
}

export interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  required?: boolean;
  minWidth?: number | string;
  maxWidth?: number | string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'নির্বাচন করুন',
  searchPlaceholder = 'খুঁজুন...',
  id,
  className = '',
  style,
  disabled = false,
  required = false,
  minWidth,
  maxWidth,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Filtered options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const q = searchTerm.toLowerCase().trim();
    return options.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(q);
      const subMatch = opt.subLabel ? opt.subLabel.toLowerCase().includes(q) : false;
      const valMatch = opt.value.toLowerCase().includes(q);
      return labelMatch || subMatch || valMatch;
    });
  }, [options, searchTerm]);

  return (
    <div
      ref={containerRef}
      className={`searchable-select-wrap ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: style?.width || '100%',
        minWidth: minWidth || style?.minWidth || 180,
        maxWidth: maxWidth || style?.maxWidth,
        ...style,
      }}
    >
      {/* Hidden native select for form accessibility / test scripts */}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '7px 12px',
          borderRadius: 6,
          border: isOpen ? '1px solid var(--accent, #2f5bea)' : '1px solid var(--border, var(--line, #cbd5e1))',
          background: 'var(--surface, #ffffff)',
          color: selectedOption ? 'var(--text, var(--ink, #0f172a))' : 'var(--muted, #64748b)',
          fontSize: '0.88rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          minHeight: 34,
          boxShadow: isOpen ? '0 0 0 2px var(--accent-soft, #e7edff)' : 'none',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.15s ease',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--muted, #64748b)',
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {/* Floating Popover Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: '100%',
            minWidth: 220,
            maxWidth: 360,
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, var(--line, #cbd5e1))',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'fadeIn 0.12s ease-out',
          }}
        >
          {/* Search Input Bar */}
          <div
            style={{
              padding: '6px 8px',
              borderBottom: '1px solid var(--border, var(--line, #e2e8f0))',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--surface2, #f8fafc)',
            }}
          >
            <Search size={14} style={{ color: 'var(--muted, #64748b)', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.84rem',
                color: 'var(--text, var(--ink, #0f172a))',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted, #64748b)',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="ক্লিয়ার"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '10px 12px', fontSize: '0.84rem', color: 'var(--muted, #64748b)', textAlign: 'center' }}>
                কোনো ফলাফল পাওয়া যায়নি
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    style={{
                      padding: '7px 12px',
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--accent-soft, #e7edff)' : 'transparent',
                      color: isSelected ? 'var(--accent, #2f5bea)' : 'var(--text, var(--ink, inherit))',
                      fontWeight: isSelected ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--surface2, #f1f4f9)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {opt.label}
                      </div>
                      {opt.subLabel && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--muted, #64748b)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {opt.subLabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={14} style={{ flexShrink: 0, color: 'var(--accent, #2f5bea)' }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

