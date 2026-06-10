import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const GATES_GEOJSON_PATH = path.join(REPO_ROOT, 'public', 'data', 'gates.geojson');
const EXPECTED_SHORT_NAMES = new Set(['Gate A', 'Gate C', 'Gate D', 'Gate E', 'Gate F']);

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read valid JSON from ${path.relative(REPO_ROOT, filePath)}: ${error.message}`);
  }
}

function assertText(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid gate source data: ${label} is required.`);
  }
  return value.trim();
}

function assertCoordinate(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid gate source data: ${label} must be a finite number.`);
  }
  return value;
}

export function parseManagedGateSeedSource(source) {
  if (!source || source.type !== 'FeatureCollection' || !Array.isArray(source.features)) {
    throw new Error('Invalid gate source data: expected a GeoJSON FeatureCollection.');
  }

  const gates = source.features
    .filter((feature) => EXPECTED_SHORT_NAMES.has(feature?.properties?.short_name))
    .map((feature) => {
      if (feature?.type !== 'Feature' || feature.geometry?.type !== 'Point') {
        throw new Error('Invalid gate source data: every seeded gate must be a Point feature.');
      }

      const coordinates = feature.geometry.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) {
        throw new Error('Invalid gate source data: every seeded gate must include [longitude, latitude].');
      }

      const longitude = assertCoordinate(coordinates[0], `${feature.properties?.short_name ?? 'gate'} longitude`);
      const latitude = assertCoordinate(coordinates[1], `${feature.properties?.short_name ?? 'gate'} latitude`);

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error(`Invalid gate source data: ${feature.properties?.short_name ?? 'gate'} coordinates are out of range.`);
      }

      return {
        stableId: assertText(feature.properties.id, `${feature.properties?.short_name ?? 'gate'} id`),
        name: assertText(feature.properties.name, `${feature.properties?.short_name ?? 'gate'} name`),
        shortName: assertText(feature.properties.short_name, 'short_name'),
        latitude,
        longitude,
        access: typeof feature.properties.access === 'string' ? feature.properties.access.trim() : null,
        description: typeof feature.properties.description === 'string' ? feature.properties.description.trim() : null,
        visitorNote: typeof feature.properties.visitor_note === 'string' ? feature.properties.visitor_note.trim() : null,
        confidence: typeof feature.properties.confidence === 'string' ? feature.properties.confidence.trim() : null,
      };
    });

  const foundShortNames = new Set(gates.map((gate) => gate.shortName));
  for (const shortName of EXPECTED_SHORT_NAMES) {
    if (!foundShortNames.has(shortName)) {
      throw new Error(`Invalid gate source data: missing ${shortName}.`);
    }
  }

  if (gates.length !== EXPECTED_SHORT_NAMES.size) {
    throw new Error(`Invalid gate source data: expected ${EXPECTED_SHORT_NAMES.size} gates, found ${gates.length}.`);
  }

  const stableIds = new Set(gates.map((gate) => gate.stableId));
  if (stableIds.size !== gates.length) {
    throw new Error('Invalid gate source data: duplicate stable identifiers found.');
  }

  return gates.sort((left, right) => left.shortName.localeCompare(right.shortName));
}

async function seedManagedGates() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to seed managed gates.');
  }

  const gates = parseManagedGateSeedSource(readJsonFile(GATES_GEOJSON_PATH));
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  let inserted = 0;
  let skipped = 0;

  try {
    for (const gate of gates) {
      const result = await pool.query(
        `
          insert into managed_gates (
            stable_id,
            name,
            short_name,
            latitude,
            longitude,
            access,
            description,
            visitor_note,
            status,
            confidence,
            source
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, 'migration')
          ON CONFLICT (stable_id) DO NOTHING
        `,
        [
          gate.stableId,
          gate.name,
          gate.shortName,
          gate.latitude,
          gate.longitude,
          gate.access,
          gate.description,
          gate.visitorNote,
          gate.confidence,
        ],
      );

      if (result.rowCount === 1) inserted += 1;
      else skipped += 1;
    }
  } finally {
    await pool.end();
  }

  console.log(`Managed gates seed complete. Inserted: ${inserted}. Skipped: ${skipped}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedManagedGates().catch((error) => {
    console.error(`Managed gates seed failed: ${error.message}`);
    process.exit(1);
  });
}
