"use client";

import React, { useEffect } from 'react';
import type { SiteSettings } from '../lib/siteSettings';

interface AboutModalProps {
  open: boolean;
  settings: SiteSettings;
  onClose: () => void;
  onSupport: () => void;
}

/**
 * Modal displaying the About information. Includes a support button that triggers the Donate modal.
 */
export default function AboutModal({ open, settings, onClose, onSupport }: AboutModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-labelledby="aboutModalTitle"
      aria-modal="true"
    >
      <div className="bg-[var(--card-bg)] text-[var(--main-text)] border border-[var(--sage-border)] p-6 max-w-md rounded shadow overflow-y-auto max-h-[90vh]">
        <h2 id="aboutModalTitle" className="text-xl font-semibold mb-2">
          {settings.aboutTitle}
        </h2>
        <p className="mb-4 text-sm">
          {settings.aboutBody}
        </p>
        <button
          onClick={() => {
            onClose();
            onSupport();
          }}
          className="bg-[var(--donate-amber)] text-white py-1 px-2 rounded mb-4 text-sm"
        >
          {settings.aboutCallToActionText}
        </button>
        <button
          onClick={onClose}
          className="bg-[var(--soft-stone)] text-[var(--charcoal-green)] px-4 py-2 rounded text-sm"
          aria-label="Close about modal"
        >
          Close
        </button>
      </div>
    </div>
  );
}
