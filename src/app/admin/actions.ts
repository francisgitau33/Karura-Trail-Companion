"use server";

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePlatformOwner } from '../../lib/auth';
import { logAuditEvent } from '../../lib/audit';
import { saveSiteSettings, SiteSettings, validateSiteSettings } from '../../lib/siteSettings';

function text(formData: FormData, key: keyof SiteSettings) {
  return String(formData.get(key) ?? '').trim();
}

export async function saveSettingsAction(formData: FormData) {
  const session = await requirePlatformOwner();
  const settings: SiteSettings = {
    appName: text(formData, 'appName'),
    tagline: text(formData, 'tagline'),
    prototypeBannerText: text(formData, 'prototypeBannerText'),
    showPrototypeBanner: formData.get('showPrototypeBanner') === 'on',
    aboutTitle: text(formData, 'aboutTitle'),
    aboutBody: text(formData, 'aboutBody'),
    aboutCallToActionText: text(formData, 'aboutCallToActionText'),
    donateTitle: text(formData, 'donateTitle'),
    donateBody: text(formData, 'donateBody'),
    mpesaPaybill: text(formData, 'mpesaPaybill'),
    mpesaAccountReference: text(formData, 'mpesaAccountReference'),
    donationNote: text(formData, 'donationNote'),
    websiteUrl: text(formData, 'websiteUrl'),
    websiteButtonText: text(formData, 'websiteButtonText'),
    safetyTitle: text(formData, 'safetyTitle'),
    safetyBody: text(formData, 'safetyBody'),
    boundaryDisclaimer: text(formData, 'boundaryDisclaimer'),
    visitorGuidanceNote: text(formData, 'visitorGuidanceNote'),
    contactEmail: text(formData, 'contactEmail'),
    linkedinUrl: text(formData, 'linkedinUrl'),
    mediumUrl: text(formData, 'mediumUrl'),
  };

  const validationError = validateSiteSettings(settings);
  if (validationError) {
    redirect(`/admin?error=${encodeURIComponent(validationError)}`);
  }

  const id = await saveSiteSettings(settings, session.userId);
  await logAuditEvent({
    actorUserId: session.userId,
    actorEmail: session.email,
    action: 'SITE_SETTINGS_UPDATED',
    entityType: 'site_settings',
    entityId: id,
  });

  revalidatePath('/');
  revalidatePath('/admin');
  redirect('/admin?saved=1');
}
