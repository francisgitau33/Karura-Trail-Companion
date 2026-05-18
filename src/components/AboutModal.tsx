"use client";

import React, { useEffect } from 'react';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
  onSupport: () => void;
}

/**
 * Modal displaying the About information. Includes a support button that triggers the Donate modal.
 */
export default function AboutModal({ open, onClose, onSupport }: AboutModalProps) {
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
          About this Map
        </h2>
        <p className="mb-4 text-sm">
          This free Karura Forest digital trail companion has been developed by Kenya Children's Home as a public resource for visitors, families, runners, cyclists, and nature lovers. The map helps users explore Karura more confidently by showing trails, gates, landmarks, facilities, and points of interest. Kenya Children's Home supports vulnerable children and young people through care, education, and community-based programmes.
        </p>
        <button
          onClick={() => {
            onClose();
            onSupport();
          }}
          className="bg-[var(--donate-amber)] text-white py-1 px-2 rounded mb-4 text-sm"
        >
          Support Kenya Children's Home
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
