import { isDatabaseConfigured, query } from './db';
import {
  FOREST_BOUNDARY_TOLERANCE_METERS,
  haversineDistanceMeters,
  isPointWithinForestBoundaryTolerance,
} from './karuraBoundary';

export const MANAGED_GATE_STATUSES = ['active', 'archived'] as const;
export const MANAGED_GATE_SOURCES = ['migration', 'admin', 'public_suggestion'] as const;
export const DUPLICATE_GATE_DISTANCE_METERS = 50;

export type ManagedGateStatus = (typeof MANAGED_GATE_STATUSES)[number];
export type ManagedGateSource = (typeof MANAGED_GATE_SOURCES)[number];

export interface ManagedGate {
  id: string;
  stableId: string;
  name: string;
  shortName: string;
  latitude: number;
  longitude: number;
  access: string;
  description: string;
  visitorNote: string;
  status: ManagedGateStatus;
  confidence: string;
  source: ManagedGateSource;
  sourceSuggestionId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  archivedBy: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  restoredAt: string | null;
}

export interface ManagedGateInput {
  stableId: string;
  name: string;
  shortName: string;
  latitude: number;
  longitude: number;
  access?: string | null;
  description?: string | null;
  visitorNote?: string | null;
  status?: string;
  confidence?: string | null;
  source: string;
  sourceSuggestionId?: string | null;
}

export interface ManagedGateRow {
  id: string;
  stable_id: string;
  name: string;
  short_name: string;
  latitude: number | string;
  longitude: number | string;
  access: string | null;
  description: string | null;
  visitor_note: string | null;
  status: ManagedGateStatus;
  confidence: string | null;
  source: ManagedGateSource;
  source_suggestion_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  archived_by: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
  restored_at: Date | string | null;
}

export interface GateGeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: string;
    name: string;
    short_name: string;
    category: 'Gate';
    access: string;
    description: string;
    visitor_note: string;
    status: string;
    confidence: string;
  };
}

export interface GateValidationResult {
  ok: boolean;
  errors: string[];
}

function toIsoString(value: Date | string | null) {
  return value ? new Date(value).toISOString() : null;
}

function isAllowedStatus(status: string): status is ManagedGateStatus {
  return MANAGED_GATE_STATUSES.includes(status as ManagedGateStatus);
}

function isAllowedSource(source: string): source is ManagedGateSource {
  return MANAGED_GATE_SOURCES.includes(source as ManagedGateSource);
}

export function mapManagedGateRow(row: ManagedGateRow): ManagedGate {
  return {
    id: row.id,
    stableId: row.stable_id,
    name: row.name,
    shortName: row.short_name,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    access: row.access ?? '',
    description: row.description ?? '',
    visitorNote: row.visitor_note ?? '',
    status: row.status,
    confidence: row.confidence ?? '',
    source: row.source,
    sourceSuggestionId: row.source_suggestion_id,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    archivedBy: row.archived_by,
    createdAt: toIsoString(row.created_at) ?? '',
    updatedAt: toIsoString(row.updated_at) ?? '',
    archivedAt: toIsoString(row.archived_at),
    restoredAt: toIsoString(row.restored_at),
  };
}

export function validateGateCoordinates(latitude: number, longitude: number): GateValidationResult {
  const errors: string[] = [];

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    errors.push('Latitude and longitude must be finite numbers.');
  }

  if (Number.isFinite(latitude) && (latitude < -90 || latitude > 90)) {
    errors.push('Latitude must be between -90 and 90.');
  }

  if (Number.isFinite(longitude) && (longitude < -180 || longitude > 180)) {
    errors.push('Longitude must be between -180 and 180.');
  }

  return { ok: errors.length === 0, errors };
}

export function validateGateWithinForestBoundary(latitude: number, longitude: number): GateValidationResult {
  const coordinateResult = validateGateCoordinates(latitude, longitude);
  if (!coordinateResult.ok) return coordinateResult;

  if (!isPointWithinForestBoundaryTolerance(latitude, longitude, FOREST_BOUNDARY_TOLERANCE_METERS)) {
    return {
      ok: false,
      errors: ['Gate must be inside Karura Forest or Sigiria Forest, allowing the configured boundary tolerance.'],
    };
  }

  return { ok: true, errors: [] };
}

export function validateManagedGateInput(input: ManagedGateInput): GateValidationResult {
  const errors: string[] = [];
  const requiredTextFields: Array<[string, string]> = [
    ['stable identifier', input.stableId],
    ['name', input.name],
    ['short name', input.shortName],
  ];

  for (const [label, value] of requiredTextFields) {
    if (!value?.trim()) errors.push(`Gate ${label} is required.`);
  }

  const status = input.status ?? 'active';
  if (!isAllowedStatus(status)) {
    errors.push('Gate status must be active or archived.');
  }

  if (!isAllowedSource(input.source)) {
    errors.push('Gate source must be migration, admin, or public_suggestion.');
  }

  errors.push(...validateGateWithinForestBoundary(input.latitude, input.longitude).errors);

  return { ok: errors.length === 0, errors };
}

export async function getActiveManagedGates(): Promise<ManagedGate[]> {
  if (!isDatabaseConfigured()) return [];

  const result = await query<ManagedGateRow>(
    `
      select *
      from managed_gates
      where status = 'active'
      order by short_name asc, name asc
    `,
  );

  return result.rows.map(mapManagedGateRow);
}

export async function getManagedGatesForAdmin(): Promise<ManagedGate[]> {
  if (!isDatabaseConfigured()) return [];

  const result = await query<ManagedGateRow>(
    `
      select *
      from managed_gates
      where status in ('active', 'archived')
      order by
        case status when 'active' then 0 else 1 end,
        short_name asc,
        name asc
    `,
  );

  return result.rows.map(mapManagedGateRow);
}

export function findDuplicateGates(
  candidate: { latitude: number; longitude: number; id?: string | null },
  gates: Array<{ id?: string | null; latitude: number; longitude: number }>,
  radiusMeters = DUPLICATE_GATE_DISTANCE_METERS,
) {
  return gates
    .map((gate) => ({
      gate,
      distanceMeters: haversineDistanceMeters(candidate, gate),
    }))
    .filter(({ gate, distanceMeters }) => gate.id !== candidate.id && distanceMeters <= radiusMeters)
    .sort((left, right) => left.distanceMeters - right.distanceMeters);
}

export function toGateGeoJsonFeature(gate: ManagedGate): GateGeoJsonFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [gate.longitude, gate.latitude],
    },
    properties: {
      id: gate.stableId,
      name: gate.name,
      short_name: gate.shortName,
      category: 'Gate',
      access: gate.access,
      description: gate.description,
      visitor_note: gate.visitorNote,
      status: gate.status,
      confidence: gate.confidence,
    },
  };
}

export function toGateGeoJsonFeatureCollection(gates: ManagedGate[]) {
  return {
    type: 'FeatureCollection' as const,
    features: gates.map(toGateGeoJsonFeature),
  };
}
