"use client";

import React, { useEffect } from 'react';

interface BoundaryInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BoundaryInfoModal({ open, onClose }: BoundaryInfoModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-labelledby="boundaryInfoModalTitle"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded border border-[var(--sage-border)] bg-[var(--card-bg)] p-5 text-[var(--main-text)] shadow sm:p-6">
        <h2 id="boundaryInfoModalTitle" className="mb-3 text-xl font-semibold text-[var(--forest-header)]">
          Karura Forest Boundary
        </h2>
        <p className="mb-4 text-sm">
          This boundary is derived from OpenStreetMap and is provided for visitor orientation only.
          It is not an official, legal, gazetted, or government-approved boundary. Visitors should
          follow official gates, marked trails, signage, and guidance from forest staff or rangers.
        </p>
        <p className="mb-4 text-xs text-[var(--charcoal-green)]">
          Boundary data © OpenStreetMap contributors, ODbL.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="min-h-10 rounded bg-[var(--soft-stone)] px-4 py-2 text-sm text-[var(--charcoal-green)]"
          aria-label="Close boundary information"
        >
          Close
        </button>
      </div>
    </div>
  );
}
