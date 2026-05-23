import Link from 'next/link';
import type { ReactNode } from 'react';
import { saveSettingsAction } from './actions';
import { getRecentAuditEvents } from '../../lib/audit';
import { getCmsSetupStatus, requirePlatformOwner } from '../../lib/auth';
import { getSiteSettings, SiteSettings } from '../../lib/siteSettings';

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
  const [settings, auditEvents] = await Promise.all([getSiteSettings(), getRecentAuditEvents(8)]);

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
            <Field label="Contact email" name="contactEmail" value={settings.contactEmail} type="email" />
            <Field label="LinkedIn URL" name="linkedinUrl" value={settings.linkedinUrl} type="url" />
            <Field label="Medium URL" name="mediumUrl" value={settings.mediumUrl} type="url" />
          </Section>

          <button
            type="submit"
            name="intent"
            value="save-settings"
            className="rounded bg-[var(--trail-green)] px-4 py-2 text-sm font-semibold text-white"
          >
            Save settings
          </button>
        </form>

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
