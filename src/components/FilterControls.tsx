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
    <div className="bg-white p-2 rounded shadow flex flex-wrap gap-2 text-xs">
      {categories.map((cat) => {
        const isSelected = cat === selected;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`px-2 py-1 rounded focus:outline-none ${
              isSelected ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
