export const KARURA_BOUNDS = {
  minLat: -1.275,
  maxLat: -1.215,
  minLng: 36.785,
  maxLng: 36.86,
};

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
