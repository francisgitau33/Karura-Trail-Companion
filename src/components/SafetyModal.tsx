"use client";

import React from 'react';

interface SafetyModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal displaying a visitor safety note for the Karura map.
 */
export default function SafetyModal({ open, onClose }: SafetyModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-labelledby="safetyModalTitle"
      aria-modal="true"
    >
      <div className="bg-white p-6 max-w-md rounded shadow overflow-y-auto max-h-[90vh]">
        <h2 id="safetyModalTitle" className="text-xl font-semibold mb-2">
          Visitor Safety Note
        </h2>
        <p className="mb-4 text-sm">
          This digital map is provided as a visitor aid only. Visitors should follow official Karura Forest signage, stay on permitted trails, observe forest rules, and follow guidance from forest staff and rangers. Trail conditions may change due to weather, maintenance, closures, or conservation requirements.
        </p>
        <button
          onClick={onClose}
          className="bg-gray-300 px-4 py-2 rounded text-sm"
          aria-label="Close safety modal"
        >
          Close
        </button>
      </div>
    </div>
  );
}
