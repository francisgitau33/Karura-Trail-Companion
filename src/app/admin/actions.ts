"use server";

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePlatformOwner } from '../../lib/auth';
import { logAuditEvent } from '../../lib/audit';
import {
  saveOfficialLogo,
  saveSiteSettings,
  SiteSettings,
  validateSiteSettings,
} from '../../lib/siteSettings';
import { reviewPlaceSuggestion } from '../../lib/placeSuggestions';

const MAX_LOGO_SIZE_BYTES = 1024 * 1024;
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function text(formData: FormData, key: keyof SiteSettings) {
  return String(formData.get(key) ?? '').trim();
}

async function readLogoUpload(formData: FormData, requireFile = false) {
  const file = formData.get('officialLogoFile');
  if (!(file instanceof File) || file.size === 0) {
    if (requireFile) {
      return { logo: null, error: 'Choose a logo image before clicking Upload logo.' };
    }
    return { logo: null, error: null };
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return { logo: null, error: 'Official logo must be 1 MB or smaller.' };
  }

  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return { logo: null, error: 'Official logo must be a PNG, JPG, JPEG, or WebP image.' };
  }

  const filename = file.name.replace(/[^a-zA-Z0-9._ -]/g, '').slice(0, 120) || 'kch-logo';
  const data = Buffer.from(await file.arrayBuffer()).toString('base64');

  return {
    logo: {
      data,
      mimeType: file.type,
      filename,
    },
    error: null,
  };
}

export async function saveSettingsAction(formData: FormData) {
  const session = await requirePlatformOwner();
  const intent = formData.get('intent');
  const isLogoUpload = intent === 'upload-logo';
  const settings: SiteSettings = {
    appName: text(formData, 'appName'),
    tagline: text(formData, 'tagline'),
    prototypeBannerText: text(formData, 'prototypeBannerText'),
    showPrototypeBanner: formData.get('showPrototypeBanner') === 'on',
    aboutTitle: text(formData, 'aboutTitle'),
    aboutBody: text(formData, 'aboutBody'),
    aboutCallToActionText: text(formData, 'aboutCallToActionText'),
    officialLogoSrc: '',
    officialLogoFilename: '',
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
    enablePlaceSuggestions: formData.get('enablePlaceSuggestions') === 'on',
  };

  const validationError = validateSiteSettings(settings);
  if (validationError) {
    redirect(`/admin?error=${encodeURIComponent(validationError)}`);
  }

  const { logo, error: logoError } = await readLogoUpload(formData, isLogoUpload);
  if (logoError) {
    redirect(`/admin?error=${encodeURIComponent(logoError)}`);
  }

  let id: string;
  try {
    id = await saveSiteSettings(settings, session.userId);
    if (logo) {
      await saveOfficialLogo(id, logo);
    }
    await logAuditEvent({
      actorUserId: session.userId,
      actorEmail: session.email,
      action: 'SITE_SETTINGS_UPDATED',
      entityType: 'site_settings',
      entityId: id,
    });
  } catch (error) {
    console.error('CMS settings save failed.', error);
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Official logo upload columns are missing')) {
      redirect('/admin?error=Logo%20upload%20setup%20is%20not%20complete.%20Run%20migration%20003_site_settings_logo_upload.sql.');
    }
    redirect('/admin?error=CMS%20database%20is%20not%20ready.%20Check%20Neon%20setup%20and%20migration.');
  }

  revalidatePath('/');
  revalidatePath('/admin');
  if (logo) {
    redirect('/admin?logoSaved=1');
  }
  redirect('/admin?saved=1');
}

export async function reviewPlaceSuggestionAction(formData: FormData) {
  const session = await requirePlatformOwner();
  const action = String(formData.get('reviewAction') ?? '');
  const id = String(formData.get('id') ?? '');

  try {
    const result = await reviewPlaceSuggestion(
      {
        id,
        action: action === 'approve' || action === 'reject' || action === 'merge' ? action : 'reject',
        type: String(formData.get('type') ?? ''),
        name: String(formData.get('name') ?? ''),
        description: String(formData.get('description') ?? ''),
        latitude: Number(formData.get('latitude')),
        longitude: Number(formData.get('longitude')),
        adminNotes: String(formData.get('adminNotes') ?? ''),
      },
      session.userId,
    );

    await logAuditEvent({
      actorUserId: session.userId,
      actorEmail: session.email,
      action: 'PLACE_SUGGESTION_REVIEWED',
      entityType: 'place_suggestions',
      entityId: result.id,
      metadata: { status: result.status },
    });
  } catch (error) {
    console.error('Place suggestion review failed.', error);
    const message = error instanceof Error ? error.message : 'Place suggestion could not be reviewed.';
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }

  revalidatePath('/');
  revalidatePath('/admin');
  redirect('/admin?saved=1');
}
