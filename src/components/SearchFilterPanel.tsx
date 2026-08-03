import React from 'react';

interface SearchFilterPanelProps {
  onFilterChange: (filters: any) => void;
  onReset: () => void;
  className?: string;
}

export const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({ onFilterChange, onReset, className = '' }) => {
  return (
    <div className={`glass-card rounded-2xl p-6 ${className}`}>
      <h4 className="font-headline-md text-body-lg mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">filter_list</span>
        Refine Search
      </h4>
      <div className="space-y-6">
        <div>
          <label className="font-label-md text-label-md text-on-surface-variant mb-3 block">Genre</label>
          <select 
            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 font-body-md text-body-md focus:ring-2 focus:ring-primary/20"
            onChange={(e) => onFilterChange({ category: e.target.value })}
          >
            <option value="">All Categories</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Philosophy">Philosophy</option>
            <option value="Science">Science</option>
            <option value="Business">Business</option>
            <option value="Machine Learning">Machine Learning</option>
          </select>
        </div>
        <div>
          <label className="font-label-md text-label-md text-on-surface-variant mb-3 block">Publication Year</label>
          <div className="flex items-center gap-2">
            <input 
              className="w-1/2 bg-surface-container-low border-none rounded-xl py-2.5 px-4 font-body-md text-body-md text-center" 
              placeholder="From" 
              type="text"
              onChange={(e) => onFilterChange({ yearFrom: e.target.value })}
            />
            <span className="text-on-surface-variant opacity-40">—</span>
            <input 
              className="w-1/2 bg-surface-container-low border-none rounded-xl py-2.5 px-4 font-body-md text-body-md text-center" 
              placeholder="To" 
              type="text"
              onChange={(e) => onFilterChange({ yearTo: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="font-label-md text-label-md text-on-surface-variant mb-3 block">Rating</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20" 
                type="radio" 
                name="rating"
                value="4.5"
                onChange={() => onFilterChange({ minRating: 4.5 })}
              />
              <span className="text-label-md font-medium text-on-surface-variant">4.5 & Above</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20" 
                type="radio" 
                name="rating"
                value="4.0"
                onChange={() => onFilterChange({ minRating: 4.0 })}
              />
              <span className="text-label-md font-medium text-on-surface-variant">4.0 & Above</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20" 
                type="radio" 
                name="rating"
                value="3.5"
                onChange={() => onFilterChange({ minRating: 3.5 })}
              />
              <span className="text-label-md font-medium text-on-surface-variant">3.5 & Above</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20" 
                type="radio" 
                name="rating"
                value="0"
                onChange={() => onFilterChange({ minRating: 0 })}
              />
              <span className="text-label-md font-medium text-on-surface-variant">Any Rating</span>
            </label>
          </div>
        </div>
        <button 
          className="w-full py-3 rounded-xl border-1.5 border-primary/30 text-primary font-bold hover:bg-primary/5 transition-all mt-4"
          onClick={onReset}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};
