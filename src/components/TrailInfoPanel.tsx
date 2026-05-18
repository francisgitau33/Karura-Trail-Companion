"use client";

import React from 'react';

export interface TrailProperties {
  id: string;
  name: string;
  distance_km?: number;
  estimated_time?: string;
  difficulty?: string;
  type?: string;
  surface?: string;
  starts_from?: string;
  description?: string;
  status?: string;
}

interface TrailInfoPanelProps {
  trail: TrailProperties | null;
  onClose: () => void;
}

/**
 * Panel that appears at the bottom of the screen to show trail details when a trail is selected.
 */
export default function TrailInfoPanel({ trail, onClose }: TrailInfoPanelProps) {
  if (!trail) return null;
  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)] text-[var(--main-text)] shadow-lg p-4 max-h-64 overflow-y-auto border-t border-[var(--sage-border)] z-30"
      role="region"
      aria-label="Trail information"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold mb-2">{trail.name}</h3>
        <button
          onClick={onClose}
          aria-label="Close trail information"
          className="text-sm text-[var(--charcoal-green)] hover:text-[var(--safety-red)]"
        >
          x
        </button>
      </div>
      <ul className="text-sm space-y-1">
        <li>
          <strong>Distance:</strong> {trail.distance_km ? `${trail.distance_km} km` : 'To be verified'}
        </li>
        <li>
          <strong>Estimated time:</strong> {trail.estimated_time || 'To be verified'}
        </li>
        <li>
          <strong>Difficulty:</strong> {trail.difficulty || 'To be verified'}
        </li>
        <li>
          <strong>Type:</strong> {trail.type || 'To be verified'}
        </li>
        <li>
          <strong>Surface:</strong> {trail.surface || 'To be verified'}
        </li>
        <li>
          <strong>Starts from:</strong> {trail.starts_from || 'To be verified'}
        </li>
      </ul>
      {trail.description && (
        <p className="mt-2 text-sm">{trail.description}</p>
      )}
      {trail.status && (
        <p className="mt-2 text-xs text-[var(--brown-olive)] italic">{trail.status}</p>
      )}
    </div>
  );
}
