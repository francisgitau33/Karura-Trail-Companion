"use client";

import React from 'react';

interface HeaderProps {
  appName: string;
  onAbout: () => void;
  onDonate: () => void;
  onSafety: () => void;
}

/**
 * Top navigation bar displaying the application name and modal buttons.
 */
export default function Header({ appName, onAbout, onDonate, onSafety }: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 p-3 shadow bg-[var(--forest-header)] text-[var(--warm-ivory)] sm:p-4">
      <h1 className="text-base font-semibold leading-tight sm:text-lg">
        {appName}
      </h1>
      <nav className="flex flex-wrap justify-end gap-1 text-xs sm:gap-2 sm:text-sm">
        <button
          onClick={onAbout}
          className="min-h-10 rounded px-2 focus:outline-none hover:underline"
          aria-label="About"
        >
          About
        </button>
        <button
          onClick={onDonate}
          className="min-h-10 rounded px-2 focus:outline-none hover:text-[var(--donate-amber)] hover:underline"
          aria-label="Donate"
        >
          Donate
        </button>
        <button
          onClick={onSafety}
          className="min-h-10 rounded px-2 focus:outline-none hover:text-[var(--safety-red)] hover:underline"
          aria-label="Safety"
        >
          Safety
        </button>
      </nav>
    </header>
  );
}
