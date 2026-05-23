"use client";

import React, { useEffect } from 'react';
import type { SiteSettings } from '../lib/siteSettings';

interface DonateModalProps {
  open: boolean;
  settings: SiteSettings;
  onClose: () => void;
}

/**
 * Modal displaying donation details and a button to visit the sponsor's website.
 */
export default function DonateModal({ open, settings, onClose }: DonateModalProps) {
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
  const visitWebsite = () => {
    const url = settings.websiteUrl;
    if (url && url.startsWith('http')) {
      window.open(url, '_blank');
    }
  };
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-labelledby="donateModalTitle"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded border border-[var(--sage-border)] bg-[var(--card-bg)] p-5 text-[var(--main-text)] shadow sm:p-6">
        {settings.officialLogoUrl ? (
          <img
            src={settings.officialLogoUrl}
            alt="Kenya Children's Home logo"
            className="mb-4 max-h-16 w-auto max-w-full object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <h2 id="donateModalTitle" className="text-xl font-semibold mb-2 text-[var(--donate-amber)]">
          {settings.donateTitle}
        </h2>
        <p className="mb-2 text-sm">
          {settings.donateBody}
        </p>
        <p className="mb-2 text-sm font-semibold">M-Pesa Donation Details</p>
        <p className="mb-2 text-sm">
          PayBill: {settings.mpesaPaybill || '[Insert PayBill Number]'}<br />
          Account Name/Reference: {settings.mpesaAccountReference || 'Karura Map'}<br />
          Amount: Any amount welcome
        </p>
        <p className="mb-4 text-sm">
          {settings.donationNote}
        </p>
        <button
          onClick={visitWebsite}
          className="min-h-10 bg-[var(--donate-amber)] text-white px-3 py-2 rounded mb-4 text-sm"
        >
          {settings.websiteButtonText}
        </button>
        <button
          onClick={onClose}
          className="min-h-10 bg-[var(--soft-stone)] text-[var(--charcoal-green)] px-4 py-2 rounded text-sm"
          aria-label="Close donate modal"
        >
          Close
        </button>
      </div>
    </div>
  );
}
