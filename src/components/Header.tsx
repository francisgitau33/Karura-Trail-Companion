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
    <header className="flex items-center justify-between p-4 shadow bg-[var(--forest-header)] text-[var(--warm-ivory)]">
      <h1 className="text-lg font-semibold">
        {appName}
      </h1>
      <nav className="space-x-4 text-sm">
        <button
          onClick={onAbout}
          className="focus:outline-none hover:underline"
          aria-label="About"
        >
          About
        </button>
        <button
          onClick={onDonate}
          className="focus:outline-none hover:text-[var(--donate-amber)] hover:underline"
          aria-label="Donate"
        >
          Donate
        </button>
        <button
          onClick={onSafety}
          className="focus:outline-none hover:text-[var(--safety-red)] hover:underline"
          aria-label="Safety"
        >
          Safety
        </button>
      </nav>
    </header>
  );
}
