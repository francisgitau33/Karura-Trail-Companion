import { isDatabaseConfigured, query } from './db';
import { haversineDistanceMeters, isCoordinateInKaruraBounds } from './karuraBoundary';

export type TrailSuggestionType = 'walk_jog' | 'cycling' | 'family_walk';
export type TrailSuggestionStatus = 'pending' | 'approved' | 'rejected' | 'merged' | 'archived';

export interface TrailPoint {
  latitude: number;
  longitude: number;
}

export interface PublicTrailSuggestion {
  id: string;
  type: TrailSuggestionType;
  name: string;
  description: string;
  pathGeojson: {
    type: 'LineString';
    coordinates: number[][];
  };
  distanceMeters: number;
  durationSeconds: number;
}

export interface TrailSuggestion extends PublicTrailSuggestion {
  source: 'admin' | 'public_gps';
  contactEmail: string;
  status: TrailSuggestionStatus;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string;
  approvedAt: string;
  rejectedAt: string;
  archivedAt: string;
  pointCount: number;
  startCoordinate: number[] | null;
  endCoordinate: number[] | null;
}

export interface TrailSuggestionInput {
  type: string;
  name: string;
  description: string;
  points: TrailPoint[];
  durationSeconds?: number;
  contactEmail?: string;
  website?: string;
}

export interface TrailSuggestionReviewInput {
  id: string;
  action: 'approve' | 'reject' | 'merge' | 'archive';
  type?: string;
  name?: string;
  description?: string;
  adminNotes?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TRAIL_POINTS = 1000;
const MIN_TRAIL_POINTS = 3;

function cleanText(value: string, maxLength: number) {
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function isValidType(type: string): type is TrailSuggestionType {
  return type === 'walk_jog' || type === 'cycling' || type === 'family_walk';
}

export function trailTypeLabel(type: TrailSuggestionType) {
  const labels: Record<TrailSuggestionType, string> = {
    walk_jog: 'Walk & Jog',
    cycling: 'Cycling',
    family_walk: 'Family Walk',
  };
  return labels[type];
}

function validateLineString(points: TrailPoint[]) {
  if (!Array.isArray(points) || points.length < MIN_TRAIL_POINTS) {
    return 'Please record a longer trail before submitting.';
  }

  if (points.length > MAX_TRAIL_POINTS) {
    return 'Trail recording has too many points. Please finish and submit a shorter trail.';
  }

  if (!points.every((point) => isCoordinateInKaruraBounds(point.latitude, point.longitude))) {
    return 'This trail includes points outside the Karura / Thigiria Forest boundary area. Please review the recording before submitting.';
  }

  return null;
}

export function calculateTrailDistanceMeters(points: TrailPoint[]) {
  return points.reduce((total, point, index) => {
    if (index === 0) return total;
    return total + haversineDistanceMeters(points[index - 1], point);
  }, 0);
}

export function validateTrailSuggestionInput(input: TrailSuggestionInput) {
  if (input.website) {
    return 'Submission could not be accepted.';
  }

  if (!isValidType(input.type)) {
    return 'Choose a valid trail type.';
  }

  const name = cleanText(input.name, 80);
  const description = cleanText(input.description, 500);
  const contactEmail = cleanText(input.contactEmail ?? '', 120);

  if (!name) {
    return 'Trail name is required.';
  }

  if (!description) {
    return 'Short description is required.';
  }

  const pathError = validateLineString(input.points);
  if (pathError) {
    return pathError;
  }

  if (contactEmail && !EMAIL_PATTERN.test(contactEmail)) {
    return 'Optional contact email must be a valid email address.';
  }

  return null;
}

function normalizeTrailSuggestionInput(input: TrailSuggestionInput) {
  const points = input.points.map((point) => ({
    latitude: Number(point.latitude),
    longitude: Number(point.longitude),
  }));

  return {
    type: input.type as TrailSuggestionType,
    name: cleanText(input.name, 80),
    description: cleanText(input.description, 500),
    points,
    durationSeconds: Math.max(0, Math.round(Number(input.durationSeconds ?? 0))),
    contactEmail: cleanText(input.contactEmail ?? '', 120),
  };
}

function rowToPublicTrail(row: {
  id: string;
  type: TrailSuggestionType;
  name: string;
  description: string;
  path_geojson: PublicTrailSuggestion['pathGeojson'];
  distance_meters: number | null;
  duration_seconds: number | null;
}): PublicTrailSuggestion {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    description: row.description,
    pathGeojson: row.path_geojson,
    distanceMeters: Number(row.distance_meters ?? 0),
    durationSeconds: Number(row.duration_seconds ?? 0),
  };
}

function rowToAdminTrail(row: {
  id: string;
  source: 'admin' | 'public_gps';
  type: TrailSuggestionType;
  name: string;
  description: string;
  path_geojson: PublicTrailSuggestion['pathGeojson'];
  distance_meters: number | null;
  duration_seconds: number | null;
  contact_email: string | null;
  status: TrailSuggestionStatus;
  admin_notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  reviewed_at: Date | string | null;
  approved_at: Date | string | null;
  rejected_at: Date | string | null;
  archived_at: Date | string | null;
}): TrailSuggestion {
  const coordinates = row.path_geojson?.coordinates ?? [];
  return {
    ...rowToPublicTrail(row),
    source: row.source,
    contactEmail: row.contact_email ?? '',
    status: row.status,
    adminNotes: row.admin_notes ?? '',
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : '',
    approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : '',
    rejectedAt: row.rejected_at ? new Date(row.rejected_at).toISOString() : '',
    archivedAt: row.archived_at ? new Date(row.archived_at).toISOString() : '',
    pointCount: coordinates.length,
    startCoordinate: coordinates[0] ?? null,
    endCoordinate: coordinates[coordinates.length - 1] ?? null,
  };
}

export async function getApprovedTrailSuggestions(): Promise<PublicTrailSuggestion[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const result = await query<{
      id: string;
      type: TrailSuggestionType;
      name: string;
      description: string;
      path_geojson: PublicTrailSuggestion['pathGeojson'];
      distance_meters: number | null;
      duration_seconds: number | null;
    }>(
      `
        select id, type, name, description, path_geojson, distance_meters, duration_seconds
        from trail_suggestions
        where status = 'approved'
        order by approved_at desc nulls last, created_at desc
      `,
    );
    return result.rows.map(rowToPublicTrail);
  } catch (error) {
    console.error('Approved trail suggestions unavailable.', error);
    return [];
  }
}

export async function getTrailSuggestionsForAdmin(): Promise<TrailSuggestion[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const result = await query<{
      id: string;
      source: 'admin' | 'public_gps';
      type: TrailSuggestionType;
      name: string;
      description: string;
      path_geojson: PublicTrailSuggestion['pathGeojson'];
      distance_meters: number | null;
      duration_seconds: number | null;
      contact_email: string | null;
      status: TrailSuggestionStatus;
      admin_notes: string | null;
      created_at: Date;
      updated_at: Date;
      reviewed_at: Date | null;
      approved_at: Date | null;
      rejected_at: Date | null;
      archived_at: Date | null;
    }>(
      `
        select *
        from trail_suggestions
        order by
          case status when 'pending' then 0 else 1 end,
          coalesce(reviewed_at, updated_at, created_at) desc
        limit 50
      `,
    );
    return result.rows.map(rowToAdminTrail);
  } catch (error) {
    console.error('Trail suggestions unavailable for admin.', error);
    return [];
  }
}

export async function createTrailSuggestion(input: TrailSuggestionInput) {
  const validationError = validateTrailSuggestionInput(input);
  if (validationError) {
    return { ok: false as const, message: validationError };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false as const,
      message: 'Trail recording is not available yet. Please try again later.',
    };
  }

  const normalized = normalizeTrailSuggestionInput(input);
  const pathGeojson = {
    type: 'LineString',
    coordinates: normalized.points.map((point) => [point.longitude, point.latitude]),
  };
  const distanceMeters = calculateTrailDistanceMeters(normalized.points);

  await query(
    `
      insert into trail_suggestions (
        source, type, name, description, path_geojson, distance_meters,
        duration_seconds, contact_email, status
      )
      values ('public_gps', $1, $2, $3, $4::jsonb, $5, $6, $7, 'pending')
    `,
    [
      normalized.type,
      normalized.name,
      normalized.description,
      JSON.stringify(pathGeojson),
      distanceMeters,
      normalized.durationSeconds,
      normalized.contactEmail || null,
    ],
  );

  return {
    ok: true as const,
    message: 'Thank you. Your trail has been submitted for review.',
  };
}

export function validateTrailSuggestionReviewInput(input: TrailSuggestionReviewInput) {
  if (!['approve', 'reject', 'merge', 'archive'].includes(input.action)) {
    return 'Choose a valid review action.';
  }

  if (!input.id) {
    return 'Trail suggestion ID is missing.';
  }

  if (input.action !== 'archive' && input.type && !isValidType(input.type)) {
    return 'Choose a valid trail type.';
  }

  return null;
}

export async function reviewTrailSuggestion(input: TrailSuggestionReviewInput, reviewerId: string) {
  const validationError = validateTrailSuggestionReviewInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const current = await query<{ status: TrailSuggestionStatus }>(
    'select status from trail_suggestions where id = $1',
    [input.id],
  );
  const currentStatus = current.rows[0]?.status;

  if (!currentStatus) {
    throw new Error('Trail suggestion could not be found.');
  }

  if (input.action === 'archive') {
    if (currentStatus !== 'approved') {
      throw new Error('Only approved trails can be removed from the public map.');
    }

    await query(
      `
        update trail_suggestions
        set status = 'archived',
          reviewed_at = coalesce(reviewed_at, now()),
          archived_at = now(),
          updated_at = now()
        where id = $1 and status = 'approved'
      `,
      [input.id],
    );

    return { id: input.id, status: 'archived' as TrailSuggestionStatus, reviewerId };
  }

  if (currentStatus !== 'pending') {
    throw new Error('Only pending trail suggestions can be reviewed.');
  }

  const status: TrailSuggestionStatus =
    input.action === 'approve' ? 'approved' : input.action === 'merge' ? 'merged' : 'rejected';
  const reviewedTimestampColumn =
    status === 'approved'
      ? 'approved_at = now(), rejected_at = null, archived_at = null'
      : 'rejected_at = now(), approved_at = null, archived_at = null';

  await query(
    `
      update trail_suggestions
      set type = coalesce($1, type),
        name = coalesce(nullif($2, ''), name),
        description = coalesce(nullif($3, ''), description),
        status = $4,
        admin_notes = $5,
        reviewed_at = now(),
        ${reviewedTimestampColumn},
        updated_at = now()
      where id = $6
    `,
    [
      input.type && isValidType(input.type) ? input.type : null,
      cleanText(input.name ?? '', 80),
      cleanText(input.description ?? '', 500),
      status,
      cleanText(input.adminNotes ?? '', 500) || null,
      input.id,
    ],
  );

  return { id: input.id, status, reviewerId };
}
