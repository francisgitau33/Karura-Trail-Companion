"use client";

import React, { useEffect } from 'react';
import type { SiteSettings } from '../lib/siteSettings';

interface SafetyModalProps {
  open: boolean;
  settings: SiteSettings;
  onClose: () => void;
}

/**
 * Modal displaying a visitor safety note for the Karura map.
 */
export default function SafetyModal({ open, settings, onClose }: SafetyModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
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
      aria-labelledby="safetyModalTitle"
      aria-modal="true"
    >
      <div className="bg-[var(--card-bg)] text-[var(--main-text)] border border-[var(--sage-border)] p-6 max-w-md rounded shadow overflow-y-auto max-h-[90vh]">
        <h2 id="safetyModalTitle" className="text-xl font-semibold mb-2 text-[var(--safety-red)]">
          {settings.safetyTitle}
        </h2>
        <p className="mb-4 text-sm">
          {settings.safetyBody}
        </p>
        {settings.boundaryDisclaimer ? (
          <p className="mb-4 text-sm text-[var(--safety-red)]">{settings.boundaryDisclaimer}</p>
        ) : null}
        {settings.visitorGuidanceNote ? (
          <p className="mb-4 text-sm">{settings.visitorGuidanceNote}</p>
        ) : null}
        <button
          onClick={onClose}
          className="min-h-10 bg-[var(--soft-stone)] text-[var(--charcoal-green)] px-4 py-2 rounded text-sm"
          aria-label="Close safety modal"
        >
          Close
        </button>
      </div>
    </div>
  );
}
