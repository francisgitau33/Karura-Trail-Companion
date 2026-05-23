import { isDatabaseConfigured, query } from './db';

export type PlaceSuggestionType = 'landmark' | 'facility';
export type PlaceSuggestionStatus = 'pending' | 'approved' | 'rejected' | 'merged' | 'archived';

export interface PublicPlaceSuggestion {
  id: string;
  type: PlaceSuggestionType;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
}

export interface PlaceSuggestion extends PublicPlaceSuggestion {
  contactEmail: string;
  status: PlaceSuggestionStatus;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string;
  nearbyCount: number;
}

export interface PlaceSuggestionInput {
  type: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  contactEmail?: string;
  website?: string;
}

export interface PlaceSuggestionReviewInput {
  id: string;
  action: 'approve' | 'reject' | 'merge' | 'archive';
  type?: string;
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  adminNotes?: string;
}

const KARURA_BOUNDS = {
  minLat: -1.275,
  maxLat: -1.215,
  minLng: 36.785,
  maxLng: 36.855,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value: string, maxLength: number) {
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function isValidType(type: string): type is PlaceSuggestionType {
  return type === 'landmark' || type === 'facility';
}

function isInKaruraBounds(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= KARURA_BOUNDS.minLat &&
    latitude <= KARURA_BOUNDS.maxLat &&
    longitude >= KARURA_BOUNDS.minLng &&
    longitude <= KARURA_BOUNDS.maxLng
  );
}

export function validatePlaceSuggestionInput(input: PlaceSuggestionInput) {
  if (input.website) {
    return 'Submission could not be accepted.';
  }

  if (!isValidType(input.type)) {
    return 'Choose either Landmark or Facility.';
  }

  const name = cleanText(input.name, 80);
  const description = cleanText(input.description, 500);
  const contactEmail = cleanText(input.contactEmail ?? '', 120);

  if (!name) {
    return 'Name of place is required.';
  }

  if (!description) {
    return 'Short description is required.';
  }

  if (!isInKaruraBounds(input.latitude, input.longitude)) {
    return 'Choose a location within the Karura Forest map area.';
  }

  if (contactEmail && !EMAIL_PATTERN.test(contactEmail)) {
    return 'Optional contact email must be a valid email address.';
  }

  return null;
}

function normalizePlaceSuggestionInput(input: PlaceSuggestionInput) {
  return {
    type: input.type as PlaceSuggestionType,
    name: cleanText(input.name, 80),
    description: cleanText(input.description, 500),
    latitude: input.latitude,
    longitude: input.longitude,
    contactEmail: cleanText(input.contactEmail ?? '', 120),
  };
}

function rowToPublicSuggestion(row: {
  id: string;
  type: PlaceSuggestionType;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
}): PublicPlaceSuggestion {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    description: row.description,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  };
}

function rowToAdminSuggestion(row: {
  id: string;
  type: PlaceSuggestionType;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  contact_email: string | null;
  status: PlaceSuggestionStatus;
  admin_notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  reviewed_at: Date | string | null;
  nearby_count: string | number | null;
}): PlaceSuggestion {
  return {
    ...rowToPublicSuggestion(row),
    contactEmail: row.contact_email ?? '',
    status: row.status,
    adminNotes: row.admin_notes ?? '',
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : '',
    nearbyCount: Number(row.nearby_count ?? 0),
  };
}

export async function getApprovedPlaceSuggestions(): Promise<PublicPlaceSuggestion[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const result = await query<{
      id: string;
      type: PlaceSuggestionType;
      name: string;
      description: string;
      latitude: number;
      longitude: number;
    }>(
      `
        select id, type, name, description, latitude, longitude
        from place_suggestions
        where status = 'approved'
        order by approved_at desc nulls last, created_at desc
      `,
    );
    return result.rows.map(rowToPublicSuggestion);
  } catch (error) {
    console.error('Approved place suggestions unavailable.', error);
    return [];
  }
}

export async function getPlaceSuggestionsForAdmin(): Promise<PlaceSuggestion[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const result = await query<{
      id: string;
      type: PlaceSuggestionType;
      name: string;
      description: string;
      latitude: number;
      longitude: number;
      contact_email: string | null;
      status: PlaceSuggestionStatus;
      admin_notes: string | null;
      created_at: Date;
      updated_at: Date;
      reviewed_at: Date | null;
      nearby_count: string | number | null;
    }>(
      `
        select ps.*,
          (
            select count(*)
            from place_suggestions other
            where other.id <> ps.id
              and other.status in ('pending', 'approved')
              and ps.status in ('pending', 'approved')
              and (
                6371000 * acos(
                  least(
                    1,
                    greatest(
                      -1,
                      cos(radians(ps.latitude)) * cos(radians(other.latitude)) *
                      cos(radians(other.longitude) - radians(ps.longitude)) +
                      sin(radians(ps.latitude)) * sin(radians(other.latitude))
                    )
                  )
                )
              ) <= 50
          ) as nearby_count
        from place_suggestions ps
        order by
          case ps.status when 'pending' then 0 else 1 end,
          coalesce(ps.reviewed_at, ps.updated_at, ps.created_at) desc
        limit 50
      `,
    );
    return result.rows.map(rowToAdminSuggestion);
  } catch (error) {
    console.error('Place suggestions unavailable for admin.', error);
    return [];
  }
}

export async function countNearbySuggestions(latitude: number, longitude: number) {
  const result = await query<{ count: string }>(
    `
      select count(*)::text as count
      from place_suggestions
      where status in ('pending', 'approved')
        and (
          6371000 * acos(
            least(
              1,
              greatest(
                -1,
                cos(radians($1)) * cos(radians(latitude)) *
                cos(radians(longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(latitude))
              )
            )
          )
        ) <= 50
    `,
    [latitude, longitude],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function createPlaceSuggestion(input: PlaceSuggestionInput) {
  const validationError = validatePlaceSuggestionInput(input);
  if (validationError) {
    return { ok: false as const, message: validationError, nearbyWarning: false };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false as const,
      message: 'Suggestions are not available yet. Please try again later.',
      nearbyWarning: false,
    };
  }

  const normalized = normalizePlaceSuggestionInput(input);
  const nearbyCount = await countNearbySuggestions(normalized.latitude, normalized.longitude);

  await query(
    `
      insert into place_suggestions (
        type, name, description, latitude, longitude, contact_email, status
      )
      values ($1, $2, $3, $4, $5, $6, 'pending')
    `,
    [
      normalized.type,
      normalized.name,
      normalized.description,
      normalized.latitude,
      normalized.longitude,
      normalized.contactEmail || null,
    ],
  );

  return {
    ok: true as const,
    message: 'Thank you. Your suggestion has been submitted for review.',
    nearbyWarning: nearbyCount > 0,
  };
}

export function validatePlaceSuggestionReviewInput(input: PlaceSuggestionReviewInput) {
  if (!['approve', 'reject', 'merge', 'archive'].includes(input.action)) {
    return 'Choose a valid review action.';
  }

  if (!input.id) {
    return 'Suggestion ID is missing.';
  }

  if (input.action === 'archive') {
    return null;
  }

  const publicValidation = validatePlaceSuggestionInput({
    type: input.type ?? '',
    name: input.name ?? '',
    description: input.description ?? '',
    latitude: input.latitude ?? Number.NaN,
    longitude: input.longitude ?? Number.NaN,
  });

  if (input.action === 'approve' && publicValidation) {
    return publicValidation;
  }

  return null;
}

export async function reviewPlaceSuggestion(input: PlaceSuggestionReviewInput, reviewerId: string) {
  const validationError = validatePlaceSuggestionReviewInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const current = await query<{ status: PlaceSuggestionStatus }>(
    'select status from place_suggestions where id = $1',
    [input.id],
  );
  const currentStatus = current.rows[0]?.status;

  if (!currentStatus) {
    throw new Error('Suggestion could not be found.');
  }

  if (input.action === 'archive') {
    if (currentStatus !== 'approved') {
      throw new Error('Only approved suggestions can be removed from the public map.');
    }

    await query(
      `
        update place_suggestions
        set status = 'archived',
          reviewed_at = coalesce(reviewed_at, now()),
          archived_at = now(),
          updated_at = now()
        where id = $1 and status = 'approved'
      `,
      [input.id],
    );

    return {
      id: input.id,
      status: 'archived' as PlaceSuggestionStatus,
      reviewerId,
    };
  }

  if (currentStatus !== 'pending') {
    throw new Error('Only pending suggestions can be reviewed.');
  }

  const status: PlaceSuggestionStatus =
    input.action === 'approve' ? 'approved' : input.action === 'merge' ? 'merged' : 'rejected';
  const reviewedTimestampColumn =
    status === 'approved'
      ? 'approved_at = now(), rejected_at = null, archived_at = null'
      : 'rejected_at = now(), approved_at = null, archived_at = null';

  await query(
    `
      update place_suggestions
      set type = $1,
        name = $2,
        description = $3,
        latitude = $4,
        longitude = $5,
        status = $6,
        admin_notes = $7,
        reviewed_at = now(),
        ${reviewedTimestampColumn},
        updated_at = now()
      where id = $8
    `,
    [
      input.type ?? '',
      cleanText(input.name ?? '', 80),
      cleanText(input.description ?? '', 500),
      input.latitude ?? 0,
      input.longitude ?? 0,
      status,
      cleanText(input.adminNotes ?? '', 500) || null,
      input.id,
    ],
  );

  return {
    id: input.id,
    status,
    reviewerId,
  };
}
