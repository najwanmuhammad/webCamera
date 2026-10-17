export interface Address {
  shortAddress: string;
  city: string;
  province: string;
  country: string;
}
export interface PhotoMetadata extends Address {
  localTimestamp: string;
  latitude: string;
  longitude: string;
}
export interface GpsFix {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}
export interface LocationEvidence {
  fix: GpsFix | null;
  source: 'none' | 'gps' | 'manual';
  addressSource: 'none' | 'provider' | 'manual';
}
export interface GeocodingProvider {
  name: string;
  reverse: (fix: GpsFix, signal: AbortSignal) => Promise<Address>;
}
