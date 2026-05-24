"use client";

import React, { useEffect } from 'react';
import type { SiteSettings } from '../lib/siteSettings';

interface AboutModalProps {
  open: boolean;
  settings: SiteSettings;
  onClose: () => void;
  onSupport: () => void;
}

function hasStructuredAbout(settings: SiteSettings) {
  return Boolean(
    settings.aboutMapBody.trim() ||
      settings.aboutKchBody.trim() ||
      settings.aboutFinalComment.trim(),
  );
}

function TextBlock({ children }: { children: string }) {
  const paragraphs = children
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

function AboutSection({ title, body }: { title: string; body: string }) {
  if (!body.trim()) return null;

  return (
    <section className="mb-4">
      <h3 className="mb-1 text-sm font-semibold text-[var(--charcoal-green)]">{title}</h3>
      <TextBlock>{body}</TextBlock>
    </section>
  );
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
        {hasStructuredAbout(settings) ? (
          <div className="mb-4">
            <AboutSection title="About this Map" body={settings.aboutMapBody} />
            <AboutSection title="About Kenya Children's Homes" body={settings.aboutKchBody} />
            <AboutSection title="A final note" body={settings.aboutFinalComment} />
          </div>
        ) : (
          <div className="mb-4">
            <TextBlock>{settings.aboutBody}</TextBlock>
          </div>
        )}
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
