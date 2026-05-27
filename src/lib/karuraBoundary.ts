import boundaryData from '../../public/data/karura-boundary.geojson';

export const KARURA_BOUNDS = {
  minLat: -1.275,
  maxLat: -1.215,
  minLng: 36.785,
  maxLng: 36.86,
};

export const FOREST_BOUNDARY_TOLERANCE_METERS = 50;
export const MAX_LOCATION_ACCURACY_METERS = 100;

type Coordinate = [number, number];
type Ring = Coordinate[];
type PolygonCoordinates = Ring[];
type MultiPolygonCoordinates = PolygonCoordinates[];

type BoundaryFeature = {
  geometry?: {
    type?: string;
    coordinates?: PolygonCoordinates | MultiPolygonCoordinates;
  };
};

const FOREST_POLYGONS: PolygonCoordinates[] = ((boundaryData as { features?: BoundaryFeature[] }).features ?? [])
  .flatMap((feature) => {
    if (feature.geometry?.type === 'Polygon') {
      return [feature.geometry.coordinates as PolygonCoordinates];
    }
    if (feature.geometry?.type === 'MultiPolygon') {
      return feature.geometry.coordinates as MultiPolygonCoordinates;
    }
    return [];
  })
  .filter((polygon) => polygon.length > 0);

export function isCoordinateInKaruraBounds(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= KARURA_BOUNDS.minLat &&
    latitude <= KARURA_BOUNDS.maxLat &&
    longitude >= KARURA_BOUNDS.minLng &&
    longitude <= KARURA_BOUNDS.maxLng
  );
}

export function haversineDistanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isPointInRing(latitude: number, longitude: number, ring: Ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [lngI, latI] = ring[i];
    const [lngJ, latJ] = ring[j];
    const intersects =
      latI > latitude !== latJ > latitude &&
      longitude < ((lngJ - lngI) * (latitude - latI)) / (latJ - latI || Number.EPSILON) + lngI;

    if (intersects) inside = !inside;
  }

  return inside;
}

function isPointInPolygon(latitude: number, longitude: number, polygon: PolygonCoordinates) {
  const [outerRing, ...holes] = polygon;
  if (!outerRing || !isPointInRing(latitude, longitude, outerRing)) {
    return false;
  }

  return !holes.some((hole) => isPointInRing(latitude, longitude, hole));
}

function projectToMeters(latitude: number, longitude: number, referenceLatitude: number) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;

  return {
    x: earthRadiusMeters * toRadians(longitude) * Math.cos(toRadians(referenceLatitude)),
    y: earthRadiusMeters * toRadians(latitude),
  };
}

function distanceToSegmentMeters(
  point: { latitude: number; longitude: number },
  start: Coordinate,
  end: Coordinate,
) {
  const referenceLatitude = point.latitude;
  const p = projectToMeters(point.latitude, point.longitude, referenceLatitude);
  const a = projectToMeters(start[1], start[0], referenceLatitude);
  const b = projectToMeters(end[1], end[0], referenceLatitude);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }

  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));
  const closest = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };

  return Math.hypot(p.x - closest.x, p.y - closest.y);
}

function distanceToRingMeters(latitude: number, longitude: number, ring: Ring) {
  if (ring.length < 2) return Number.POSITIVE_INFINITY;

  let shortestDistance = Number.POSITIVE_INFINITY;
  for (let index = 1; index < ring.length; index += 1) {
    shortestDistance = Math.min(
      shortestDistance,
      distanceToSegmentMeters({ latitude, longitude }, ring[index - 1], ring[index]),
    );
  }

  return shortestDistance;
}

export function isPointInsideForestBoundary(latitude: number, longitude: number) {
  if (!isCoordinateInKaruraBounds(latitude, longitude)) {
    return false;
  }

  return FOREST_POLYGONS.some((polygon) => isPointInPolygon(latitude, longitude, polygon));
}

export function isPointWithinForestBoundaryTolerance(
  latitude: number,
  longitude: number,
  toleranceMeters = FOREST_BOUNDARY_TOLERANCE_METERS,
) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }

  if (isPointInsideForestBoundary(latitude, longitude)) {
    return true;
  }

  return FOREST_POLYGONS.some((polygon) =>
    polygon.some((ring) => distanceToRingMeters(latitude, longitude, ring) <= toleranceMeters),
  );
}

export function filterPointsWithinForestBoundary<T extends { latitude: number; longitude: number }>(
  points: T[],
  toleranceMeters = FOREST_BOUNDARY_TOLERANCE_METERS,
) {
  return points.filter((point) =>
    isPointWithinForestBoundaryTolerance(point.latitude, point.longitude, toleranceMeters),
  );
}

export function validateTrailWithinForestBoundary(
  points: Array<{ latitude: number; longitude: number }>,
  toleranceMeters = FOREST_BOUNDARY_TOLERANCE_METERS,
) {
  const acceptedPoints = filterPointsWithinForestBoundary(points, toleranceMeters);
  const outsidePointCount = points.length - acceptedPoints.length;

  return {
    ok: points.length > 0 && outsidePointCount === 0,
    acceptedPoints,
    outsidePointCount,
  };
}
