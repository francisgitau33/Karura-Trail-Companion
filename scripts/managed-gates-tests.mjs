import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { parseManagedGateSeedSource } from './seed-managed-gates.mjs';

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);

function haversineDistanceMeters(from, to) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadGatesModule() {
  const gatesPath = path.join(repoRoot, 'src', 'lib', 'gates.ts');
  const source = fs.readFileSync(gatesPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const module = { exports: {} };
  const sandbox = {
    exports: module.exports,
    module,
    require(specifier) {
      if (specifier === './db') {
        return {
          isDatabaseConfigured: () => false,
          query: async () => ({ rows: [] }),
        };
      }
      if (specifier === './karuraBoundary') {
        return {
          FOREST_BOUNDARY_TOLERANCE_METERS: 50,
          haversineDistanceMeters,
          isPointWithinForestBoundaryTolerance: (latitude, longitude) =>
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            latitude >= -1.25 &&
            latitude <= -1.23 &&
            longitude >= 36.79 &&
            longitude <= 36.85,
        };
      }
      throw new Error(`Unexpected import in gates test: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, sandbox, { filename: gatesPath });
  return module.exports;
}

const gates = loadGatesModule();

assert.equal(gates.validateGateCoordinates(-1.247203, 36.817198).ok, true, 'valid coordinates should pass');
assert.equal(gates.validateGateCoordinates(Number.NaN, 36.817198).ok, false, 'non-finite latitude should fail');
assert.equal(gates.validateGateCoordinates(-91, 36.817198).ok, false, 'out-of-range latitude should fail');
assert.equal(gates.validateGateCoordinates(-1.247203, 181).ok, false, 'out-of-range longitude should fail');

assert.equal(
  gates.validateGateWithinForestBoundary(-1.247203, 36.817198).ok,
  true,
  'gate inside mocked forest boundary should pass',
);
assert.equal(
  gates.validateGateWithinForestBoundary(-1.1, 36.817198).ok,
  false,
  'gate outside mocked forest boundary should fail',
);

const gate = gates.mapManagedGateRow({
  id: '11111111-1111-1111-1111-111111111111',
  stable_id: 'gate_a_main_gate',
  name: 'Karura Forest Gate A / Main Gate',
  short_name: 'Gate A',
  latitude: '-1.247203',
  longitude: '36.817198',
  access: 'Main entry / parking area',
  description: 'Main entry / parking area.',
  visitor_note: 'Follow official signage.',
  status: 'active',
  confidence: 'User cross-checked',
  source: 'migration',
  source_suggestion_id: null,
  created_by: null,
  updated_by: null,
  archived_by: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  archived_at: null,
  restored_at: null,
});
const feature = gates.toGateGeoJsonFeature(gate);
assert.equal(JSON.stringify(feature.geometry.coordinates), JSON.stringify([36.817198, -1.247203]), 'GeoJSON uses longitude, latitude order');
assert.equal(feature.properties.category, 'Gate', 'GeoJSON conversion preserves Gate category');
assert.equal(feature.properties.short_name, 'Gate A', 'GeoJSON conversion emits current map property names');

const duplicates = gates.findDuplicateGates(
  { id: 'candidate', latitude: -1.247203, longitude: 36.817198 },
  [
    { id: 'near', latitude: -1.247204, longitude: 36.817199 },
    { id: 'far', latitude: -1.24, longitude: 36.84 },
    { id: 'candidate', latitude: -1.247203, longitude: 36.817198 },
  ],
);
assert.equal(duplicates.length, 1, 'duplicate detection should include only other gates within 50 metres');
assert.equal(duplicates[0].gate.id, 'near', 'duplicate detection should identify nearby gate');

const source = JSON.parse(fs.readFileSync(path.join(repoRoot, 'public', 'data', 'gates.geojson'), 'utf8'));
const seedGates = parseManagedGateSeedSource(source);
assert.equal(seedGates.length, 5, 'seed parser should recognise exactly five gates');
assert.deepEqual(
  seedGates.map((parsedGate) => parsedGate.shortName),
  ['Gate A', 'Gate C', 'Gate D', 'Gate E', 'Gate F'],
  'seed parser should return the expected existing gates',
);
assert.throws(
  () => parseManagedGateSeedSource({ ...source, features: source.features.slice(0, 4) }),
  /missing Gate F/,
  'seed parser should reject incomplete source data',
);

console.log('[PASS] Managed gates tests completed successfully.');
