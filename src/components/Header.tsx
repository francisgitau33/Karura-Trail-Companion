"use client";

import React from 'react';
import { mapConfig } from '@/data/mapConfig';

interface HeaderProps {
  onAbout: () => void;
  onDonate: () => void;
  onSafety: () => void;
}

/**
 * Top navigation bar displaying the application name and modal buttons.
 */
export default function Header({ onAbout, onDonate, onSafety }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 bg-green-800 text-white shadow">
      <h1 className="text-lg font-semibold">
        {mapConfig.appName}
      </h1>
      <nav className="space-x-4 text-sm">
        <button
          onClick={onAbout}
          className="hover:underline focus:outline-none"
          aria-label="About"
        >
          About
        </button>
        <button
          onClick={onDonate}
          className="hover:underline focus:outline-none"
          aria-label="Donate"
        >
          Donate
        </button>
        <button
          onClick={onSafety}
          className="hover:underline focus:outline-none"
          aria-label="Safety"
        >
          Safety
        </button>
      </nav>
    </header>
  );
}
