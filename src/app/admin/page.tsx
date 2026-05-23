import Link from 'next/link';
import type { ReactNode } from 'react';
import { reviewPlaceSuggestionAction, saveSettingsAction } from './actions';
import { getRecentAuditEvents } from '../../lib/audit';
import { getCmsSetupStatus, requirePlatformOwner } from '../../lib/auth';
import { getSiteSettings, SiteSettings } from '../../lib/siteSettings';
import { getPlaceSuggestionsForAdmin, PlaceSuggestion } from '../../lib/placeSuggestions';

export const dynamic = 'force-dynamic';

function Field({
  label,
  name,
  value,
  type = 'text',
}: {
  label: string;
  name: keyof SiteSettings;
  value: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        defaultValue={value}
        type={type}
        className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
      />
    </label>
  );
}

function TextArea({ label, name, value }: { label: string; name: keyof SiteSettings; value: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <textarea
        name={name}
        defaultValue={value}
        rows={5}
        className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-[var(--sage-border)] pt-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function suggestionStatusLabel(status: PlaceSuggestion['status']) {
  const labels: Record<PlaceSuggestion['status'], string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    merged: 'Duplicate / Merged',
    archived: 'Removed from map',
  };
  return labels[status];
}

function suggestionDate(suggestion: PlaceSuggestion) {
  return suggestion.reviewedAt || suggestion.updatedAt || suggestion.createdAt;
}

function PendingSuggestionCard({ suggestion }: { suggestion: PlaceSuggestion }) {
  return (
    <form
      action={reviewPlaceSuggestionAction}
      className="space-y-3 rounded border border-[var(--sage-border)] bg-white p-4 text-sm"
    >
      <input type="hidden" name="id" value={suggestion.id} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{suggestion.name}</p>
          <p className="text-xs uppercase tracking-wide text-[var(--charcoal-green)]">
            Status: Pending - {new Date(suggestion.createdAt).toLocaleString()}
          </p>
        </div>
        {suggestion.nearbyCount > 0 ? (
          <span className="rounded bg-[var(--sand-yellow)] px-2 py-1 text-xs text-[var(--brown-olive)]">
            Nearby possible duplicate
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="font-medium">Type</span>
          <select
            name="type"
            defaultValue={suggestion.type}
            className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
          >
            <option value="landmark">Landmark</option>
            <option value="facility">Facility</option>
          </select>
        </label>
        <label className="block">
          <span className="font-medium">Name</span>
          <input
            name="name"
            defaultValue={suggestion.name}
            maxLength={80}
            className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="font-medium">Latitude</span>
          <input
            name="latitude"
            defaultValue={suggestion.latitude}
            type="number"
            step="0.000001"
            className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="font-medium">Longitude</span>
          <input
            name="longitude"
            defaultValue={suggestion.longitude}
            type="number"
            step="0.000001"
            className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
          />
        </label>
      </div>
      <label className="block">
        <span className="font-medium">Description</span>
        <textarea
          name="description"
          defaultValue={suggestion.description}
          maxLength={500}
          rows={3}
          className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
        />
      </label>
      {suggestion.contactEmail ? (
        <p className="text-xs text-[var(--charcoal-green)]">Optional contact: {suggestion.contactEmail}</p>
      ) : null}
      <label className="block">
        <span className="font-medium">Admin notes</span>
        <textarea
          name="adminNotes"
          defaultValue={suggestion.adminNotes}
          maxLength={500}
          rows={2}
          className="mt-1 w-full rounded border border-[var(--sage-border)] px-3 py-2"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="reviewAction"
          value="approve"
          className="rounded bg-[var(--trail-green)] px-3 py-2 text-xs font-semibold text-white"
        >
          Approve
        </button>
        <button
          type="submit"
          name="reviewAction"
          value="reject"
          className="rounded bg-[var(--safety-red)] px-3 py-2 text-xs font-semibold text-white"
        >
          Reject
        </button>
        <button
          type="submit"
          name="reviewAction"
          value="merge"
          className="rounded bg-[var(--soft-stone)] px-3 py-2 text-xs font-semibold text-[var(--charcoal-green)]"
        >
          Mark duplicate
        </button>
      </div>
    </form>
  );
}

function ReviewedSuggestionRow({ suggestion }: { suggestion: PlaceSuggestion }) {
  return (
    <div className="rounded border border-[var(--sage-border)] bg-white p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{suggestion.name}</p>
          <p className="text-xs text-[var(--charcoal-green)]">
            {suggestion.type === 'landmark' ? 'Landmark' : 'Facility'} -{' '}
            {new Date(suggestionDate(suggestion)).toLocaleString()}
          </p>
        </div>
        <span className={`status-pill status-${suggestion.status}`}>
          {suggestionStatusLabel(suggestion.status)}
        </span>
      </div>
      <p className="mt-2 truncate text-xs text-[var(--charcoal-green)]">{suggestion.description}</p>
      <details className="mt-3 text-xs text-[var(--charcoal-green)]">
        <summary className="cursor-pointer font-semibold text-[var(--main-text)]">View details</summary>
        <div className="mt-2 space-y-1">
          <p>Coordinates: {suggestion.latitude}, {suggestion.longitude}</p>
          {suggestion.adminNotes ? <p>Admin notes: {suggestion.adminNotes}</p> : null}
          {suggestion.contactEmail ? <p>Submitter contact: {suggestion.contactEmail}</p> : null}
          <p>Submitted: {new Date(suggestion.createdAt).toLocaleString()}</p>
          {suggestion.reviewedAt ? <p>Reviewed: {new Date(suggestion.reviewedAt).toLocaleString()}</p> : null}
        </div>
      </details>
      {suggestion.status === 'approved' ? (
        <details className="mt-3 rounded border border-[var(--sage-border)] bg-[var(--mist-cream)] p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-[var(--safety-red)]">
            Remove from public map
          </summary>
          <p className="mt-2 text-[var(--main-text)]">
            Remove this approved suggestion from the public map? It will no longer appear to visitors,
            but the record will remain in Admin history.
          </p>
          <form action={reviewPlaceSuggestionAction} className="mt-3">
            <input type="hidden" name="id" value={suggestion.id} />
            <button
              type="submit"
              name="reviewAction"
              value="archive"
              className="rounded bg-[var(--safety-red)] px-3 py-2 text-xs font-semibold text-white"
            >
              Confirm remove from public map
            </button>
          </form>
        </details>
      ) : null}
    </div>
  );
}

function AdminPlaceSuggestions({ suggestions }: { suggestions: PlaceSuggestion[] }) {
  const pending = suggestions.filter((suggestion) => suggestion.status === 'pending');
  const reviewed = suggestions.filter((suggestion) => suggestion.status !== 'pending');

  return (
    <section className="rounded border border-[var(--sage-border)] bg-[var(--card-bg)] p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold">Landmark / Facility Suggestions</h2>
      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--charcoal-green)]">
            Pending Review
          </h3>
          {pending.length ? (
            <div className="space-y-4">
              {pending.map((suggestion) => (
                <PendingSuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          ) : (
            <p className="text-sm">No pending suggestions.</p>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--charcoal-green)]">
            Reviewed Suggestions
          </h3>
          {reviewed.length ? (
            <div className="space-y-3">
              {reviewed.map((suggestion) => (
                <ReviewedSuggestionRow key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          ) : (
            <p className="text-sm">No reviewed suggestions yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; logoSaved?: string; error?: string }>;
}) {
  const setupStatus = getCmsSetupStatus();
  if (!setupStatus.isConfigured) {
    return (
      <main className="min-h-screen bg-[var(--mist-cream)] px-4 py-6 text-[var(--main-text)]">
        <section className="mx-auto max-w-2xl rounded border border-[var(--sage-border)] bg-[var(--card-bg)] p-6 shadow">
          <h1 className="mb-2 text-2xl font-semibold">Karura CMS Setup Required</h1>
          <p className="text-sm text-[var(--charcoal-green)]">{setupStatus.message}</p>
          <p className="mt-4 text-sm">
            The public map will continue using fallback content until the CMS database and session
            secret are configured.
          </p>
          <Link className="mt-4 inline-block rounded bg-[var(--soft-stone)] px-4 py-2 text-sm" href="/">
            Back to map
          </Link>
        </section>
      </main>
    );
  }

  const session = await requirePlatformOwner();
  const params = await searchParams;
  const [settings, auditEvents, placeSuggestions] = await Promise.all([
    getSiteSettings(),
    getRecentAuditEvents(8),
    getPlaceSuggestionsForAdmin(),
  ]);

  return (
    <main className="min-h-screen bg-[var(--mist-cream)] px-4 py-6 text-[var(--main-text)]">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Karura CMS</h1>
            <p className="text-sm text-[var(--charcoal-green)]">
              Signed in as {session.email} - PLATFORM_OWNER
            </p>
          </div>
          <a className="rounded bg-[var(--soft-stone)] px-4 py-2 text-sm" href="/admin/logout">
            Logout
          </a>
        </header>

        {params?.saved ? (
          <p className="rounded border border-[var(--sage-border)] bg-[var(--card-bg)] px-4 py-3 text-sm">
            Settings saved.
          </p>
        ) : null}
        {params?.logoSaved ? (
          <p className="rounded border border-[var(--sage-border)] bg-[var(--card-bg)] px-4 py-3 text-sm">
            Logo uploaded.
          </p>
        ) : null}
        {params?.error ? (
          <p className="rounded border border-[var(--safety-red)] bg-[var(--card-bg)] px-4 py-3 text-sm text-[var(--safety-red)]">
            {params.error}
          </p>
        ) : null}

        <form
          action={saveSettingsAction}
          encType="multipart/form-data"
          className="space-y-8 rounded border border-[var(--sage-border)] bg-[var(--card-bg)] p-6 shadow"
        >
          <Section title="General">
            <Field label="App name" name="appName" value={settings.appName} />
            <Field label="Tagline" name="tagline" value={settings.tagline} />
            <label className="flex items-center gap-2 text-sm">
              <input
                name="showPrototypeBanner"
                type="checkbox"
                defaultChecked={settings.showPrototypeBanner}
              />
              Show prototype banner
            </label>
            <Field
              label="Prototype banner text"
              name="prototypeBannerText"
              value={settings.prototypeBannerText}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                name="enablePlaceSuggestions"
                type="checkbox"
                defaultChecked={settings.enablePlaceSuggestions}
              />
              Enable public landmark/facility suggestions
            </label>
          </Section>

          <Section title="About">
            <Field label="About title" name="aboutTitle" value={settings.aboutTitle} />
            <Field
              label="Call to action text"
              name="aboutCallToActionText"
              value={settings.aboutCallToActionText}
            />
            <div className="md:col-span-2">
              <div className="block text-sm">
                <label className="font-medium" htmlFor="officialLogoFile">
                  Official KCH Logo
                </label>
                <span className="mt-1 block text-xs text-[var(--charcoal-green)]">
                  Choose a logo file, then click Upload logo. PNG, JPG, JPEG, or WebP only. Maximum 1 MB.
                </span>
                {settings.officialLogoSrc ? (
                  <div className="mt-3 rounded border border-[var(--sage-border)] bg-white p-3">
                    <img
                      src={settings.officialLogoSrc}
                      alt="Current Kenya Children's Home logo"
                      className="max-h-20 w-auto max-w-[160px] object-contain"
                    />
                    {settings.officialLogoFilename ? (
                      <p className="mt-2 text-xs text-[var(--charcoal-green)]">{settings.officialLogoFilename}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 rounded border border-[var(--sage-border)] bg-white px-3 py-2 text-sm text-[var(--charcoal-green)]">
                    No official logo uploaded yet.
                  </p>
                )}
                <input
                  id="officialLogoFile"
                  name="officialLogoFile"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  className="mt-3 block w-full text-sm"
                />
                <button
                  type="submit"
                  name="intent"
                  value="upload-logo"
                  className="mt-3 rounded bg-[var(--trail-green)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Upload logo
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <TextArea label="About body" name="aboutBody" value={settings.aboutBody} />
            </div>
          </Section>

          <Section title="Donate">
            <Field label="Donate title" name="donateTitle" value={settings.donateTitle} />
            <Field label="M-Pesa PayBill" name="mpesaPaybill" value={settings.mpesaPaybill} />
            <Field
              label="M-Pesa account reference"
              name="mpesaAccountReference"
              value={settings.mpesaAccountReference}
            />
            <Field label="Website URL" name="websiteUrl" value={settings.websiteUrl} type="url" />
            <Field
              label="Website button text"
              name="websiteButtonText"
              value={settings.websiteButtonText}
            />
            <div className="md:col-span-2">
              <TextArea label="Donate body" name="donateBody" value={settings.donateBody} />
            </div>
            <div className="md:col-span-2">
              <TextArea label="Donation note" name="donationNote" value={settings.donationNote} />
            </div>
          </Section>

          <Section title="Safety / Visitor Guidance">
            <Field label="Safety title" name="safetyTitle" value={settings.safetyTitle} />
            <div />
            <div className="md:col-span-2">
              <TextArea label="Safety body" name="safetyBody" value={settings.safetyBody} />
            </div>
            <div className="md:col-span-2">
              <TextArea
                label="Boundary disclaimer"
                name="boundaryDisclaimer"
                value={settings.boundaryDisclaimer}
              />
            </div>
            <div className="md:col-span-2">
              <TextArea
                label="Visitor guidance note"
                name="visitorGuidanceNote"
                value={settings.visitorGuidanceNote}
              />
            </div>
          </Section>

          <Section title="Footer / Contact">
            <Field label="Footer contact email" name="contactEmail" value={settings.contactEmail} type="email" />
          </Section>

          <input type="hidden" name="linkedinUrl" value={settings.linkedinUrl} />
          <input type="hidden" name="mediumUrl" value={settings.mediumUrl} />

          <button
            type="submit"
            name="intent"
            value="save-settings"
            className="rounded bg-[var(--trail-green)] px-4 py-2 text-sm font-semibold text-white"
          >
            Save settings
          </button>
        </form>

        <AdminPlaceSuggestions suggestions={placeSuggestions} />

        <section className="rounded border border-[var(--sage-border)] bg-[var(--card-bg)] p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">Recent Audit Events</h2>
          {auditEvents.length ? (
            <ul className="space-y-2 text-sm">
              {auditEvents.map((event) => (
                <li key={event.id} className="border-b border-[var(--sage-border)] pb-2">
                  <span className="font-medium">{event.action}</span>
                  {' - '}
                  {event.actor_email ?? 'system'}
                  {' - '}
                  {new Date(event.created_at).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">No audit events available yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
