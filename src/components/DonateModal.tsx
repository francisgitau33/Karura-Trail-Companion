"use client";

import React, { useEffect } from 'react';
import { mapConfig } from '../data/mapConfig';

interface DonateModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal displaying donation details and a button to visit the sponsor's website.
 */
export default function DonateModal({ open, onClose }: DonateModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  const { donation } = mapConfig;
  const visitWebsite = () => {
    const url = donation.websiteUrl;
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
      <div className="bg-[var(--card-bg)] text-[var(--main-text)] border border-[var(--sage-border)] p-6 max-w-md rounded shadow overflow-y-auto max-h-[90vh]">
        <h2 id="donateModalTitle" className="text-xl font-semibold mb-2 text-[var(--donate-amber)]">
          Support Kenya Children's Home
        </h2>
        <p className="mb-2 text-sm">
          If this free map is useful to you, please consider supporting Kenya Children's Home.
        </p>
        <p className="mb-2 text-sm font-semibold">M-Pesa Donation Details</p>
        <p className="mb-2 text-sm">
          PayBill: {donation.paybill || '[Insert PayBill Number]'}<br />
          Account Name/Reference: {donation.accountReference || 'Karura Map'}<br />
          Amount: Any amount welcome
        </p>
        <p className="mb-4 text-sm">
          Your support helps provide care, education, and community-based programmes for vulnerable children and young people.
        </p>
        <button
          onClick={visitWebsite}
          className="bg-[var(--donate-amber)] text-white py-1 px-2 rounded mb-4 text-sm"
        >
          Visit Kenya Children's Home Website
        </button>
        <button
          onClick={onClose}
          className="bg-[var(--soft-stone)] text-[var(--charcoal-green)] px-4 py-2 rounded text-sm"
          aria-label="Close donate modal"
        >
          Close
        </button>
      </div>
    </div>
  );
}
