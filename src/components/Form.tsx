import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'بحث...', className }: SearchInputProps) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mi-input pr-10"
      />
    </div>
  );
}

interface FilterBarProps {
  children: ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="mi-card mb-4 flex flex-wrap items-end gap-3 p-4">{children}</div>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, children, className }: FieldProps) {
  return (
    <div className={className}>
      <label className="mi-label">{label}</label>
      {children}
    </div>
  );
}
