"use client";

import React from 'react';

interface HeaderProps {
  appName: string;
  onAbout: () => void;
  onDonate: () => void;
  onSafety: () => void;
  onBoundary?: () => void;
}

/**
 * Top navigation bar displaying the application name and modal buttons.
 */
export default function Header({ appName, onAbout, onDonate, onSafety, onBoundary }: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 p-3 shadow bg-[var(--forest-header)] text-[var(--warm-ivory)] sm:p-4">
      <h1 className="text-base font-semibold leading-tight sm:text-lg">
        {appName}
      </h1>
      <nav className="flex flex-wrap justify-end gap-1 text-[11px] sm:gap-2 sm:text-sm">
        <button
          onClick={onAbout}
          className="min-h-9 rounded px-1.5 transition-colors focus:outline-none hover:underline sm:min-h-10 sm:px-2"
          aria-label="About"
        >
          About
        </button>
        <button
          onClick={onDonate}
          className="min-h-9 rounded px-1.5 transition-colors focus:outline-none hover:text-[var(--donate-amber)] hover:underline sm:min-h-10 sm:px-2"
          aria-label="Donate"
        >
          Donate
        </button>
        <button
          onClick={onSafety}
          className="min-h-9 rounded px-1.5 transition-colors focus:outline-none hover:text-[var(--safety-red)] hover:underline sm:min-h-10 sm:px-2"
          aria-label="Safety"
        >
          Safety
        </button>
        {onBoundary ? (
          <button
            onClick={onBoundary}
            className="min-h-9 rounded px-1.5 transition-colors focus:outline-none hover:text-[var(--sand-yellow)] hover:underline sm:min-h-10 sm:px-2"
            aria-label="Map boundary"
          >
            Map Boundary
          </button>
        ) : null}
      </nav>
    </header>
  );
}
