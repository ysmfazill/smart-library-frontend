import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  onSearch, 
  placeholder = "Search books, authors, genres or ask AI..." 
}) => {
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-primary">
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          auto_awesome
        </span>
      </div>
      <input 
        className="w-full bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl py-6 pl-14 pr-20 font-body-md text-body-md focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-xl placeholder:text-on-surface-variant/50" 
        placeholder={placeholder} 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
      />
      <div className="absolute inset-y-0 right-4 flex items-center">
        <button 
          onClick={onSearch}
          className="bg-primary text-white p-3 rounded-xl hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>
    </div>
  );
};
