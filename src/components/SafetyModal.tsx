"use client";

import React, { useEffect } from 'react';

interface SafetyModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal displaying a visitor safety note for the Karura map.
 */
export default function SafetyModal({ open, onClose }: SafetyModalProps) {
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
      aria-labelledby="safetyModalTitle"
      aria-modal="true"
    >
      <div className="bg-[var(--card-bg)] text-[var(--main-text)] border border-[var(--sage-border)] p-6 max-w-md rounded shadow overflow-y-auto max-h-[90vh]">
        <h2 id="safetyModalTitle" className="text-xl font-semibold mb-2 text-[var(--safety-red)]">
          Visitor Safety Note
        </h2>
        <p className="mb-4 text-sm">
          This digital map is provided as a visitor aid only. Visitors should follow official Karura Forest signage, stay on permitted trails, observe forest rules, and follow guidance from forest staff and rangers. Trail conditions may change due to weather, maintenance, closures, or conservation requirements.
        </p>
        <button
          onClick={onClose}
          className="bg-[var(--soft-stone)] text-[var(--charcoal-green)] px-4 py-2 rounded text-sm"
          aria-label="Close safety modal"
        >
          Close
        </button>
      </div>
    </div>
  );
}
