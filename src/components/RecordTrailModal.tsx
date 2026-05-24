"use client";

import React, { useEffect, useRef, useState } from 'react';
import { haversineDistanceMeters } from '../lib/karuraBoundary';

type TrailType = 'walk_jog' | 'cycling' | 'family_walk';

interface TrailPoint {
  latitude: number;
  longitude: number;
}

interface RecordTrailModalProps {
  open: boolean;
  onClose: () => void;
  onPointsChange: (points: TrailPoint[]) => void;
}

const MIN_DISTANCE_METERS = 8;
const MAX_POINTS = 1000;

function formatDistance(points: TrailPoint[]) {
  const meters = calculateDistance(points);
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)} min ${seconds % 60}s`;
}

function calculateDistance(points: TrailPoint[]) {
  return points.reduce((total, point, index) => {
    if (index === 0) return total;
    return total + haversineDistanceMeters(points[index - 1], point);
  }, 0);
}

export default function RecordTrailModal({ open, onClose, onPointsChange }: RecordTrailModalProps) {
  const [trailType, setTrailType] = useState<TrailType>('walk_jog');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [points, setPoints] = useState<TrailPoint[]>([]);
  const [recording, setRecording] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const pointCountRef = useRef(0);

  const stopRecording = () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setRecording(false);
  };

  useEffect(() => {
    if (!open) {
      stopRecording();
      onPointsChange([]);
    }
  }, [open]);

  useEffect(() => {
    onPointsChange(points);
    pointCountRef.current = points.length;
  }, [points, onPointsChange]);

  useEffect(() => {
    if (!recording || !startedAt) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [recording, startedAt]);

  useEffect(() => {
    return () => {
      stopRecording();
      onPointsChange([]);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        stopRecording();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, onClose]);

  if (!open) return null;

  const resetForAnother = () => {
    stopRecording();
    setName('');
    setDescription('');
    setContactEmail('');
    setWebsite('');
    setPoints([]);
    setStartedAt(null);
    setElapsedSeconds(0);
    setMessage('');
    setSuccess(false);
    setSubmitting(false);
  };

  const addPoint = (position: GeolocationPosition) => {
    if (pointCountRef.current >= MAX_POINTS) {
      stopRecording();
      setMessage('Trail recording has reached the maximum point limit. Please finish and submit this trail.');
      return;
    }

    const nextPoint = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    setPoints((current) => {
      const previousPoint = current[current.length - 1];
      if (!previousPoint) {
        return [nextPoint];
      }

      if (haversineDistanceMeters(previousPoint, nextPoint) < MIN_DISTANCE_METERS) {
        return current;
      }

      return [...current, nextPoint];
    });
  };

  const geolocationErrorMessage = (error: GeolocationPositionError) => {
    if (error.code === error.PERMISSION_DENIED) {
      return 'Location permission was denied. Please allow location access and try again.';
    }
    if (error.code === error.TIMEOUT) {
      return 'GPS request timed out. Please try again outdoors or check your location settings.';
    }
    return 'GPS location is unavailable. Please check your phone settings and try again.';
  };

  const startRecording = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setMessage('Geolocation is not supported by this browser.');
      return;
    }

    if (!name.trim() || !description.trim()) {
      setMessage('Trail name and short description are required before recording.');
      return;
    }

    setMessage('');
    setSuccess(false);
    setPoints([]);
    setElapsedSeconds(0);
    setStartedAt(Date.now());
    setRecording(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      addPoint,
      (error) => {
        stopRecording();
        setMessage(geolocationErrorMessage(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    );
  };

  const submitTrail = async () => {
    if (points.length < 3) {
      setMessage('Please record a longer trail before submitting.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/trail-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: trailType,
          name,
          description,
          contactEmail,
          website,
          points,
          durationSeconds: elapsedSeconds,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setMessage(result.message ?? 'Trail could not be submitted. Please try again.');
        return;
      }
      setSuccess(true);
      setMessage(result.message ?? 'Thank you. Your trail has been submitted for review.');
    } catch (error) {
      console.error('Trail submission failed.', error);
      setMessage('Trail could not be submitted. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-labelledby="recordTrailModalTitle"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded border border-[var(--sage-border)] bg-[var(--card-bg)] p-5 text-[var(--main-text)] shadow sm:p-6">
        <h2 id="recordTrailModalTitle" className="mb-2 text-xl font-semibold text-[var(--forest-header)]">
          Record Trail
        </h2>
        <p className="mb-3 text-sm">
          Record a walking, jogging, cycling, or family trail. Trails are reviewed before they appear on
          the public map. Please follow official Karura Forest signage and forest rules.
        </p>
        <p className="mb-4 rounded bg-[var(--sand-yellow)] px-3 py-2 text-xs text-[var(--brown-olive)]">
          For best results, keep this page open while recording. Some phones may pause recording if
          the browser is closed or the screen is locked.
        </p>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="font-medium">Trail type</span>
            <select
              value={trailType}
              onChange={(event) => setTrailType(event.target.value as TrailType)}
              disabled={recording || success}
              className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
            >
              <option value="walk_jog">Walk & Jog</option>
              <option value="cycling">Cycling</option>
              <option value="family_walk">Family Walk</option>
            </select>
          </label>
          <label className="block">
            <span className="font-medium">Trail name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={recording || success}
              maxLength={80}
              className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-medium">Short description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={recording || success}
              maxLength={500}
              rows={3}
              className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-medium">Optional contact email</span>
            <input
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              disabled={recording || success}
              type="email"
              className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
            />
          </label>
          <label className="hidden">
            Website
            <input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} />
          </label>
        </div>
        <div className="mt-4 rounded border border-[var(--sage-border)] bg-white p-3 text-sm">
          <p>Distance: {formatDistance(points)}</p>
          <p>Duration: {formatDuration(elapsedSeconds)}</p>
          <p>Points recorded: {points.length}</p>
          {recording ? <p className="mt-2 font-semibold text-[var(--trail-green)]">Recording...</p> : null}
        </div>
        <p className="mt-3 text-xs text-[var(--charcoal-green)]">
          Your trail is submitted for review and is not shown publicly unless approved. Trail recording
          uses your browser location while recording. Your contact email is optional and is not shown publicly.
        </p>
        {message ? (
          <p className={`mt-3 rounded px-3 py-2 text-sm ${success ? 'bg-[var(--soft-stone)] text-[var(--trail-green)]' : 'bg-[var(--sand-yellow)] text-[var(--brown-olive)]'}`}>
            {message}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {!recording && !success ? (
            <button
              type="button"
              onClick={startRecording}
              className="rounded bg-[var(--trail-green)] px-4 py-2 text-sm font-semibold text-white"
            >
              Start recording
            </button>
          ) : null}
          {recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="rounded bg-[var(--safety-red)] px-4 py-2 text-sm font-semibold text-white"
            >
              Finish recording
            </button>
          ) : null}
          {!recording && !success && points.length ? (
            <button
              type="button"
              onClick={submitTrail}
              disabled={submitting}
              className="rounded bg-[var(--donate-amber)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit trail for review'}
            </button>
          ) : null}
          {success ? (
            <button
              type="button"
              onClick={resetForAnother}
              className="rounded bg-[var(--trail-green)] px-4 py-2 text-sm font-semibold text-white"
            >
              Record another trail
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              stopRecording();
              onClose();
            }}
            className="rounded bg-[var(--soft-stone)] px-4 py-2 text-sm text-[var(--charcoal-green)]"
            aria-label="Close record trail modal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
