"use client";

import React, { useEffect, useState } from 'react';

interface SuggestPlaceModalProps {
  open: boolean;
  coordinates: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onStartChoosingLocation: () => void;
  onSubmitted: () => void;
}

export default function SuggestPlaceModal({
  open,
  coordinates,
  onClose,
  onStartChoosingLocation,
  onSubmitted,
}: SuggestPlaceModalProps) {
  const [type, setType] = useState('landmark');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [nearbyWarning, setNearbyWarning] = useState(false);

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

  const submitSuggestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!coordinates) {
      setMessage('Choose a location on the map before submitting.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    setNearbyWarning(false);

    try {
      const response = await fetch('/api/place-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name,
          description,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          contactEmail,
          website,
        }),
      });
      const result = await response.json();
      setMessage(result.message ?? 'Suggestion could not be submitted. Please try again.');
      setNearbyWarning(Boolean(result.nearbyWarning));
      if (response.ok && result.ok) {
        setName('');
        setDescription('');
        setContactEmail('');
        setWebsite('');
        onSubmitted();
      }
    } catch (error) {
      console.error('Suggestion submission failed.', error);
      setMessage('Suggestion could not be submitted. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-labelledby="suggestPlaceTitle"
      aria-modal="true"
    >
      <form
        onSubmit={submitSuggestion}
        className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-md space-y-4 overflow-y-auto rounded border border-[var(--sage-border)] bg-[var(--card-bg)] p-5 text-[var(--main-text)] shadow sm:p-6"
      >
        <div>
          <h2 id="suggestPlaceTitle" className="text-xl font-semibold">
            Suggest Landmark / Facility
          </h2>
          <p className="mt-2 text-sm text-[var(--charcoal-green)]">
            Help improve the Karura Trail Companion by suggesting a landmark or facility.
            Suggestions are reviewed before they appear on the public map.
          </p>
        </div>

        <label className="block text-sm">
          <span className="font-medium">What are you suggesting?</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
          >
            <option value="landmark">Landmark</option>
            <option value="facility">Facility</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Name of place</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            required
            className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Short description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            required
            rows={4}
            className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Optional contact email</span>
          <input
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            type="email"
            className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
          />
        </label>

        <label className="hidden" aria-hidden="true">
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </label>

        <div className="rounded border border-[var(--sage-border)] bg-white p-3 text-sm">
          {coordinates ? (
            <p>
              Selected location: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
            </p>
          ) : (
            <p>No location selected yet.</p>
          )}
          <button
            type="button"
            onClick={onStartChoosingLocation}
            className="mt-2 rounded bg-[var(--soft-stone)] px-3 py-2 text-xs font-semibold text-[var(--charcoal-green)]"
          >
            Choose location on map
          </button>
        </div>

        {nearbyWarning ? (
          <p className="rounded bg-[var(--sand-yellow)] px-3 py-2 text-sm text-[var(--brown-olive)]">
            A similar place may already exist near this location. Your suggestion was still submitted for review.
          </p>
        ) : null}

        {message ? (
          <p className="rounded border border-[var(--sage-border)] bg-white px-3 py-2 text-sm">
            {message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="min-h-10 rounded bg-[var(--trail-green)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit suggestion'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded bg-[var(--soft-stone)] px-4 py-2 text-sm text-[var(--charcoal-green)]"
            aria-label="Close suggestion form"
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );
}
