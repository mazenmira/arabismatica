'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';

export interface ComboOption {
  value: string;
  label: string;
  count?: number;
}

interface ComboFilterProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  loadOptions: (query: string) => Promise<ComboOption[]>;
}

export default function ComboFilter({
  placeholder, value, onChange, loadOptions,
}: ComboFilterProps) {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState('');
  const [options, setOptions] = useState<ComboOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [label,   setLabel]   = useState('');
  const ref       = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load options whenever query or open changes
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const timer = setTimeout(async () => {
      const opts = await loadOptions(query);
      setOptions(opts);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, open, loadOptions]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // When value is set externally (e.g. pill click), look it up in options for display label
  useEffect(() => {
    if (!value) { setLabel(''); return; }
    const found = options.find(o => o.value === value);
    if (found) setLabel(found.label);
    else setLabel(value); // fallback: show raw value
  }, [value, options]);

  const handleOpen = () => {
    setOpen(o => !o);
    setQuery('');
  };

  const handleSelect = (opt: ComboOption) => {
    onChange(opt.value);
    setLabel(opt.label);
    setOpen(false);
    setQuery('');
  };

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setLabel('');
    setQuery('');
    setOpen(false);
  }, [onChange]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={handleOpen}
        className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border
          bg-parch-cream text-ink/70 outline-none min-w-[140px] max-w-[180px] justify-between
          transition-colors
          ${value ? 'border-gold-500 text-gold-700 font-medium' : 'border-gold-700/30 hover:border-gold-500/60'}`}>
        <span className="truncate">{label || placeholder}</span>
        {value ? (
          <X size={11} className="shrink-0 text-ink/40 hover:text-ink/70" onClick={handleClear} />
        ) : (
          <ChevronDown size={11} className={`shrink-0 text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full start-0 mt-1 bg-white border border-gold-700/20 rounded-xl shadow-xl z-50 w-64">
          {/* Search */}
          <div className="p-2 border-b border-gold-700/10 flex items-center gap-1.5">
            <Search size={12} className="text-ink/30 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type to filter…"
              className="flex-1 text-[11px] py-1 bg-transparent outline-none text-ink/70 placeholder:text-ink/30"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-ink/30 hover:text-ink/60">
                <X size={10} />
              </button>
            )}
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-[11px] text-ink/30">Loading…</div>
            ) : options.length === 0 ? (
              <div className="px-3 py-4 text-center text-[11px] text-ink/30">No results</div>
            ) : (
              options.map(opt => (
                <button key={opt.value}
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-start px-3 py-2 text-[11px] hover:bg-gold-50 transition-colors
                    border-b border-gold-700/8 last:border-0 flex items-center justify-between gap-2
                    ${opt.value === value ? 'bg-gold-50 text-gold-700 font-medium' : 'text-ink/70'}`}>
                  <span className="truncate">{opt.label}</span>
                  {opt.count != null && (
                    <span className="text-[9px] text-ink/30 shrink-0 tabular-nums">
                      {opt.count.toLocaleString()}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
