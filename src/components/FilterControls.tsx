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
    <div className="max-w-[calc(100vw-1rem)] overflow-x-auto rounded border border-[var(--sage-border)] bg-[var(--card-bg)] p-2 text-xs shadow">
      <div className="flex flex-nowrap gap-2">
        {categories.map((cat) => {
          const isSelected = cat === selected;
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              aria-pressed={isSelected}
              className={`min-h-10 whitespace-nowrap rounded px-3 py-2 focus:outline-none ${
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
