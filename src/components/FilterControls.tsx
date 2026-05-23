"use client";

import React from 'react';

interface FilterControlsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

/**
 * Renders a set of filter chips for toggling map layers and categories.
 */
export default function FilterControls({ categories, selected, onSelect }: FilterControlsProps) {
  return (
    <div className="map-filter-row max-w-[calc(100vw-1.5rem)] overflow-x-auto rounded-md border border-[var(--sage-border)] bg-[var(--card-bg)]/95 p-1.5 text-[11px] shadow">
      <div className="flex flex-nowrap gap-1.5">
        {categories.map((cat) => {
          const isSelected = cat === selected;
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              aria-pressed={isSelected}
              className={`min-h-9 whitespace-nowrap rounded px-2.5 py-1.5 font-medium transition-colors focus:outline-none sm:px-3 ${
                isSelected
                  ? 'bg-[var(--leaf-green)] text-white'
                  : 'bg-[var(--soft-stone)] text-[var(--charcoal-green)] hover:bg-[var(--sage-border)]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
