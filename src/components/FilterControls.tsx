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
    <div className="bg-[var(--card-bg)] border border-[var(--sage-border)] p-2 rounded shadow flex flex-wrap gap-2 text-xs">
      {categories.map((cat) => {
        const isSelected = cat === selected;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`px-2 py-1 rounded focus:outline-none ${
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
  );
}
