import React, { useState, useRef, useEffect, useMemo } from 'react';
import { OperatorItem } from '@/types/domain.types';

export interface SearchableOperatorSelectProps {
  value: string;
  onChange: (opName: string, opObj?: OperatorItem) => void;
  operators: OperatorItem[];
  placeholder?: string;
  compact?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  shiftLabel?: string;
  hasError?: boolean;
}

export const SearchableOperatorSelect: React.FC<SearchableOperatorSelectProps> = ({
  value,
  onChange,
  operators,
  placeholder = '-- অপারেটর নির্বাচন করুন --',
  compact = false,
  disabled = false,
  ariaLabel = 'অপারেটর',
  shiftLabel,
  hasError = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Currently selected operator object
  const selectedOp = useMemo(() => {
    return operators.find(
      (op) =>
        op.name === value ||
        (op.id_no && op.id_no === value) ||
        String(op.id) === String(value)
    );
  }, [operators, value]);

  // Filtered operators based on search query
  const filteredOperators = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return operators;
    return operators.filter((op) => {
      const name = (op.name || '').toLowerCase();
      const idNo = (op.id_no || '').toLowerCase();
      const mobile = (op.mobile || '').toLowerCase();
      const machine = (op.machine_assigned || '').toLowerCase();
      const desig = (op.designation || '').toLowerCase();
      return (
        name.includes(q) ||
        idNo.includes(q) ||
        mobile.includes(q) ||
        machine.includes(q) ||
        desig.includes(q)
      );
    });
  }, [operators, searchQuery]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOperators.length ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOperators.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex === 0) {
        // Select empty/clear
        onChange('', undefined);
        setIsOpen(false);
      } else {
        const op = filteredOperators[highlightedIndex - 1];
        if (op) {
          onChange(op.name, op);
          setIsOpen(false);
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`searchable-operator-select-container ${compact ? 'compact' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        minWidth: 0,
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          padding: compact ? '7px 8px' : '8px 10px',
          background: 'var(--surface)',
          border: `1px solid ${hasError ? 'var(--bad)' : isOpen ? 'var(--accent)' : 'var(--line)'}`,
          borderRadius: 8,
          fontSize: compact ? '0.85rem' : '0.92rem',
          color: selectedOp || value ? 'var(--ink)' : 'var(--muted)',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen
            ? '0 0 0 3px var(--accent-soft)'
            : hasError
            ? '0 0 0 3px var(--bad-soft)'
            : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          lineHeight: 1.3,
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}
        >
          {selectedOp ? (
            <>
              <strong style={{ fontWeight: 600 }}>{selectedOp.name}</strong>
              {!compact && selectedOp.id_no && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: '0.78rem',
                    color: 'var(--muted)',
                    fontFamily: 'var(--f-mono)',
                  }}
                >
                  ({selectedOp.id_no})
                </span>
              )}
            </>
          ) : value ? (
            value
          ) : (
            placeholder
          )}
        </span>

        {/* Down Arrow / Caret */}
        <span
          style={{
            fontSize: '0.72rem',
            color: 'var(--muted)',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 9999,
            minWidth: compact ? 220 : '100%',
            maxWidth: 320,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {/* Shift Badge & Search Box */}
          <div style={{ padding: '2px 2px 4px' }}>
            {shiftLabel && (
              <div
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--muted)',
                  marginBottom: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>শিফট: <strong>{shiftLabel}</strong></span>
                <span>মোট: {operators.length} জন</span>
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="অপারেটর খুঁজুন (নাম বা আইডি)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(1);
                }}
                style={{
                  width: '100%',
                  padding: '6px 26px 6px 8px',
                  fontSize: '0.86rem',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  background: 'var(--surface2)',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '0.75rem',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    padding: 2,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* List of Operators */}
          <div
            ref={listRef}
            role="listbox"
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* Clear / Unset option */}
            <div
              role="option"
              aria-selected={!value}
              onClick={() => {
                onChange('', undefined);
                setIsOpen(false);
              }}
              style={{
                padding: '6px 8px',
                borderRadius: 5,
                fontSize: '0.84rem',
                color: 'var(--muted)',
                cursor: 'pointer',
                background: highlightedIndex === 0 ? 'var(--surface2)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onMouseEnter={() => setHighlightedIndex(0)}
            >
              <span>-- অপারেটর খালি রাখুন --</span>
              {!value && <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>}
            </div>

            {/* Filtered Operators */}
            {filteredOperators.length > 0 ? (
              filteredOperators.map((op, idx) => {
                const isSelected =
                  op.name === value ||
                  (op.id_no && op.id_no === value) ||
                  String(op.id) === String(value);
                const isHighlighted = highlightedIndex === idx + 1;

                return (
                  <div
                    key={op.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(op.name, op);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx + 1)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 5,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'var(--accent-soft)'
                        : isHighlighted
                        ? 'var(--surface2)'
                        : 'transparent',
                      color: isSelected ? 'var(--accent)' : 'var(--ink)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: isSelected ? 700 : 600 }}>{op.name}</span>
                        {op.id_no && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--muted)',
                              fontFamily: 'var(--f-mono)',
                            }}
                          >
                            {op.id_no}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {op.shift ? `শিফট ${op.shift}` : ''}
                        {op.machine_assigned ? ` · মেশিন ${op.machine_assigned}` : ''}
                        {op.mobile ? ` · ${op.mobile}` : ''}
                      </div>
                    </div>

                    {isSelected && (
                      <span
                        style={{
                          color: 'var(--accent)',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          flexShrink: 0,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: '0.82rem',
                }}
              >
                কোন অপারেটর পাওয়া যায়নি
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

