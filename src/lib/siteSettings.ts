import { isDatabaseConfigured, query } from './db';

export interface SiteSettings {
  appName: string;
  tagline: string;
  prototypeBannerText: string;
  showPrototypeBanner: boolean;
  aboutTitle: string;
  aboutBody: string;
  aboutMapBody: string;
  aboutKchBody: string;
  aboutFinalComment: string;
  aboutCallToActionText: string;
  officialLogoSrc: string;
  officialLogoFilename: string;
  donateTitle: string;
  donateBody: string;
  mpesaPaybill: string;
  mpesaAccountReference: string;
  donationNote: string;
  websiteUrl: string;
  websiteButtonText: string;
  safetyTitle: string;
  safetyBody: string;
  boundaryDisclaimer: string;
  visitorGuidanceNote: string;
  contactEmail: string;
  linkedinUrl: string;
  mediumUrl: string;
  enablePlaceSuggestions: boolean;
  enablePublicTrailRecording: boolean;
  showApprovedTrails: boolean;
}

export const fallbackSiteSettings: SiteSettings = {
  appName: 'Karura Forest Trail Companion',
  tagline:
    "A free digital trail companion for Karura Forest visitors, developed as a public resource by Kenya Children's Home.",
  prototypeBannerText: 'Prototype map: trail and point locations require verification before public launch.',
  showPrototypeBanner: true,
  aboutTitle: 'About this Map',
  aboutBody:
    "This free Karura Forest digital trail companion has been developed by Kenya Children's Home as a public resource for visitors, families, runners, cyclists, and nature lovers. The map helps users explore Karura more confidently by showing trails, gates, landmarks, facilities, and points of interest. Kenya Children's Home supports vulnerable children and young people through care, education, and community-based programmes.",
  aboutMapBody:
    'Karura Trail Companion is a free digital map designed to help visitors explore Karura Forest more confidently.',
  aboutKchBody:
    "Kenya Children's Homes supports vulnerable children and young people through care, education, and community-based programmes.",
  aboutFinalComment:
    'Enjoy your visit to Karura Forest, follow official forest guidance, and thank you for supporting safer futures for children.',
  aboutCallToActionText: "Support Kenya Children's Home",
  officialLogoSrc: '',
  officialLogoFilename: '',
  donateTitle: "Support Kenya Children's Home",
  donateBody: "If this free map is useful to you, please consider supporting Kenya Children's Home.",
  mpesaPaybill: '[Insert PayBill Number]',
  mpesaAccountReference: 'Karura Map',
  donationNote:
    'Your support helps provide care, education, and community-based programmes for vulnerable children and young people.',
  websiteUrl: "[Insert Kenya Children's Home Website]",
  websiteButtonText: "Visit Kenya Children's Home Website",
  safetyTitle: 'Visitor Safety Note',
  safetyBody:
    'This digital map is provided as a visitor aid only. Visitors should follow official Karura Forest signage, stay on permitted trails, observe forest rules, and follow guidance from forest staff and rangers. Trail conditions may change due to weather, maintenance, closures, or conservation requirements.',
  boundaryDisclaimer: 'Boundary data is a working draft and is not an official, legal, or gazetted boundary.',
  visitorGuidanceNote: 'Follow official Karura Forest signage and staff guidance.',
  contactEmail: '',
  linkedinUrl: '',
  mediumUrl: '',
  enablePlaceSuggestions: false,
  enablePublicTrailRecording: false,
  showApprovedTrails: false,
};

interface SiteSettingsRow {
  app_name: string;
  tagline: string | null;
  prototype_banner_text: string | null;
  show_prototype_banner: boolean;
  about_title: string;
  about_body: string;
  about_map_body: string | null;
  about_kch_body: string | null;
  about_final_comment: string | null;
  about_call_to_action_text: string | null;
  official_logo_data: string | null;
  official_logo_mime_type: string | null;
  official_logo_filename: string | null;
  donate_title: string;
  donate_body: string;
  mpesa_paybill: string | null;
  mpesa_account_reference: string | null;
  donation_note: string | null;
  website_url: string | null;
  website_button_text: string | null;
  safety_title: string;
  safety_body: string;
  boundary_disclaimer: string | null;
  visitor_guidance_note: string | null;
  contact_email: string | null;
  linkedin_url: string | null;
  medium_url: string | null;
  enable_place_suggestions: boolean | null;
  enable_public_trail_recording: boolean | null;
  show_approved_trails: boolean | null;
}

function rowToSettings(row: SiteSettingsRow): SiteSettings {
  const officialLogoSrc =
    row.official_logo_data && row.official_logo_mime_type
      ? `data:${row.official_logo_mime_type};base64,${row.official_logo_data}`
      : '';

  return {
    appName: row.app_name,
    tagline: row.tagline ?? '',
    prototypeBannerText: row.prototype_banner_text ?? '',
    showPrototypeBanner: row.show_prototype_banner,
    aboutTitle: row.about_title,
    aboutBody: row.about_body,
    aboutMapBody: row.about_map_body ?? '',
    aboutKchBody: row.about_kch_body ?? '',
    aboutFinalComment: row.about_final_comment ?? '',
    aboutCallToActionText: row.about_call_to_action_text ?? '',
    officialLogoSrc,
    officialLogoFilename: row.official_logo_filename ?? '',
    donateTitle: row.donate_title,
    donateBody: row.donate_body,
    mpesaPaybill: row.mpesa_paybill ?? '',
    mpesaAccountReference: row.mpesa_account_reference ?? '',
    donationNote: row.donation_note ?? '',
    websiteUrl: row.website_url ?? '',
    websiteButtonText: row.website_button_text ?? '',
    safetyTitle: row.safety_title,
    safetyBody: row.safety_body,
    boundaryDisclaimer: row.boundary_disclaimer ?? '',
    visitorGuidanceNote: row.visitor_guidance_note ?? '',
    contactEmail: row.contact_email ?? '',
    linkedinUrl: row.linkedin_url ?? '',
    mediumUrl: row.medium_url ?? '',
    enablePlaceSuggestions: Boolean(row.enable_place_suggestions),
    enablePublicTrailRecording: Boolean(row.enable_public_trail_recording),
    showApprovedTrails: Boolean(row.show_approved_trails),
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isDatabaseConfigured()) {
    return fallbackSiteSettings;
  }

  try {
    const result = await query<SiteSettingsRow>(
      `
        select app_name, tagline, prototype_banner_text, show_prototype_banner,
          about_title, about_body,
          to_jsonb(site_settings)->>'about_map_body' as about_map_body,
          to_jsonb(site_settings)->>'about_kch_body' as about_kch_body,
          to_jsonb(site_settings)->>'about_final_comment' as about_final_comment,
          about_call_to_action_text,
          to_jsonb(site_settings)->>'official_logo_data' as official_logo_data,
          to_jsonb(site_settings)->>'official_logo_mime_type' as official_logo_mime_type,
          to_jsonb(site_settings)->>'official_logo_filename' as official_logo_filename,
          donate_title, donate_body, mpesa_paybill, mpesa_account_reference,
          donation_note, website_url, website_button_text,
          safety_title, safety_body, boundary_disclaimer, visitor_guidance_note,
          contact_email, linkedin_url, medium_url,
          (to_jsonb(site_settings)->>'enable_place_suggestions')::boolean as enable_place_suggestions,
          (to_jsonb(site_settings)->>'enable_public_trail_recording')::boolean as enable_public_trail_recording,
          (to_jsonb(site_settings)->>'show_approved_trails')::boolean as show_approved_trails
        from site_settings
        order by created_at asc
        limit 1
      `,
    );

    return result.rows[0] ? rowToSettings(result.rows[0]) : fallbackSiteSettings;
  } catch (error) {
    console.error('CMS settings unavailable; using fallback content.', error);
    return fallbackSiteSettings;
  }
}

export function validateSiteSettings(input: SiteSettings) {
  const requiredStringFields = [
    'appName',
    'aboutTitle',
    'aboutBody',
    'donateTitle',
    'donateBody',
    'safetyTitle',
    'safetyBody',
  ] as const;
  const missing = requiredStringFields.filter((key) => {
    const value = input[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length) {
    return `${missing.join(', ')} must not be empty.`;
  }

  if (input.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail)) {
    return 'Contact email must be a valid email address.';
  }

  const urls = ['websiteUrl', 'linkedinUrl', 'mediumUrl'] as const;
  for (const key of urls) {
    const value = input[key];
    if (!value) continue;
    try {
      const parsed = new URL(value);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return `${key} must use http or https.`;
      }
    } catch {
      return `${key} must be a valid URL.`;
    }
  }

  return null;
}

async function hasSiteSettingsColumn(columnName: string) {
  const result = await query<{ exists: boolean }>(
    `
      select exists (
        select 1
        from information_schema.columns
        where table_name = 'site_settings'
          and column_name = $1
      ) as exists
    `,
    [columnName],
  );
  return Boolean(result.rows[0]?.exists);
}

export interface OfficialLogoUpload {
  data: string;
  mimeType: string;
  filename: string;
}

export async function saveSiteSettings(settings: SiteSettings, updatedBy: string) {
  const existing = await query<{ id: string }>('select id from site_settings order by created_at asc limit 1');

  const values = [
    settings.appName,
    settings.tagline,
    settings.prototypeBannerText,
    settings.showPrototypeBanner,
    settings.aboutTitle,
    settings.aboutBody,
    settings.aboutMapBody,
    settings.aboutKchBody,
    settings.aboutFinalComment,
    settings.aboutCallToActionText,
    settings.donateTitle,
    settings.donateBody,
    settings.mpesaPaybill,
    settings.mpesaAccountReference,
    settings.donationNote,
    settings.websiteUrl,
    settings.websiteButtonText,
    settings.safetyTitle,
    settings.safetyBody,
    settings.boundaryDisclaimer,
    settings.visitorGuidanceNote,
    settings.contactEmail,
    settings.linkedinUrl,
    settings.mediumUrl,
    settings.enablePlaceSuggestions,
    settings.enablePublicTrailRecording,
    settings.showApprovedTrails,
    updatedBy,
  ];

  if (existing.rows[0]) {
    await query(
      `
        update site_settings
        set app_name = $1, tagline = $2, prototype_banner_text = $3,
          show_prototype_banner = $4, about_title = $5, about_body = $6,
          about_map_body = $7, about_kch_body = $8, about_final_comment = $9,
          about_call_to_action_text = $10, donate_title = $11, donate_body = $12,
          mpesa_paybill = $13, mpesa_account_reference = $14, donation_note = $15,
          website_url = $16, website_button_text = $17, safety_title = $18,
          safety_body = $19, boundary_disclaimer = $20, visitor_guidance_note = $21,
          contact_email = $22, linkedin_url = $23, medium_url = $24,
          enable_place_suggestions = $25,
          enable_public_trail_recording = $26,
          show_approved_trails = $27,
          updated_by = $28, updated_at = now()
        where id = $29
      `,
      [...values, existing.rows[0].id],
    );
    return existing.rows[0].id;
  }

  const inserted = await query<{ id: string }>(
    `
      insert into site_settings (
        app_name, tagline, prototype_banner_text, show_prototype_banner,
        about_title, about_body, about_map_body, about_kch_body, about_final_comment,
        about_call_to_action_text,
        donate_title, donate_body, mpesa_paybill, mpesa_account_reference,
        donation_note, website_url, website_button_text,
        safety_title, safety_body, boundary_disclaimer, visitor_guidance_note,
        contact_email, linkedin_url, medium_url, enable_place_suggestions,
        enable_public_trail_recording, show_approved_trails, updated_by
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
        $26, $27, $28
      )
      returning id
    `,
    values,
  );

  return inserted.rows[0].id;
}

export async function saveOfficialLogo(settingsId: string, logo: OfficialLogoUpload) {
  const hasUploadColumns = await Promise.all([
    hasSiteSettingsColumn('official_logo_data'),
    hasSiteSettingsColumn('official_logo_mime_type'),
    hasSiteSettingsColumn('official_logo_filename'),
  ]);

  if (hasUploadColumns.some((exists) => !exists)) {
    throw new Error('Official logo upload columns are missing. Run migration 003_site_settings_logo_upload.sql.');
  }

  await query(
    `
      update site_settings
      set official_logo_data = $1,
        official_logo_mime_type = $2,
        official_logo_filename = $3,
        updated_at = now()
      where id = $4
    `,
    [logo.data, logo.mimeType, logo.filename, settingsId],
  );
}
