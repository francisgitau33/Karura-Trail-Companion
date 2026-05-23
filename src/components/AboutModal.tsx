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
      <div className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded border border-[var(--sage-border)] bg-[var(--card-bg)] p-5 text-[var(--main-text)] shadow sm:p-6">
        {settings.officialLogoSrc ? (
          <img
            src={settings.officialLogoSrc}
            alt="Kenya Children's Home logo"
            className="mx-auto mb-4 h-auto max-h-16 max-w-[160px] object-contain"
            loading="lazy"
          />
        ) : null}
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
          className="min-h-10 bg-[var(--donate-amber)] text-white px-3 py-2 rounded mb-4 text-sm"
        >
          {settings.aboutCallToActionText}
        </button>
        <button
          onClick={onClose}
          className="min-h-10 bg-[var(--soft-stone)] text-[var(--charcoal-green)] px-4 py-2 rounded text-sm"
          aria-label="Close about modal"
        >
          Close
        </button>
      </div>
    </div>
  );
}
