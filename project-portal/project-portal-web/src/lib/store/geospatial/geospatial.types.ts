// TypeScript interfaces for the Geospatial domain

export interface Geometry {
  type: string;
  coordinates: number[] | number[][] | number[][][];
}

export interface ProjectGeometry {
  id: string;
  projectId: string;
  geometry: Geometry;
  createdAt: string;
  updatedAt: string;
}

export interface Geofence {
  id: string;
  projectId: string;
  name: string;
  geometry: Geometry;
  type: 'active' | 'historical' | 'breached';
  createdAt: string;
  updatedAt: string;
}

export interface MapTile {
  id: string;
  projectId: string;
  type: 'raster' | 'ndvi' | 'satellite';
  url: string;
  bounds: [number, number, number, number];
  createdAt: string;
}

// ===================== SATELLITE TYPES =====================

export interface SatelliteImage {
  id: string;
  projectId: string;
  date: string; // ISO date string
  timestamp: number; // Unix timestamp for sorting
  tileUrl: string;
  thumbnailUrl?: string;
  cloudCoverage?: number;
  source: 'sentinel-2' | 'landsat-8' | 'planet';
  resolution?: number;
  ndvi?: number;
  geometry?: Geometry;
}

export interface SatelliteTimeSeries {
  projectId: string;
  images: SatelliteImage[];
  startDate: string;
  endDate: string;
  totalImages: number;
}

export interface NDVIDataPoint {
  date: string;
  value: number;
  min?: number;
  max?: number;
  mean?: number;
}

export interface TimeLapseState {
  projectId: string | null;
  images: SatelliteImage[];
  currentFrameIndex: number;
  isPlaying: boolean;
  speed: number; // frames per second
  showNDVI: boolean;
  startDate: string | null;
  endDate: string | null;
  isLoading: boolean;
  error: string | null;
  exportInProgress: boolean;
}

export interface SatelliteFilters {
  minCloudCoverage?: number;
  maxCloudCoverage?: number;
  sources?: Array<'sentinel-2' | 'landsat-8' | 'planet'>;
  minResolution?: number;
}

export interface ExportOptions {
  format: 'video' | 'gif';
  fps?: number;
  quality?: number;
  duration?: number;
  includeNDVI?: boolean;
}

export interface GeospatialLoadingState {
  isFetchingGeometry: boolean;
  isFetchingGeofences: boolean;
  isFetchingTiles: boolean;
  isUpdating: boolean;
  isFetchingSatellite?: boolean; // Added for satellite loading
  isExporting?: boolean; // Added for export loading
}

export interface GeospatialErrorState {
  fetchGeometry: string | null;
  fetchGeofences: string | null;
  fetchTiles: string | null;
  update: string | null;
  fetchSatellite?: string | null; // Added for satellite errors
  exportTimeLapse?: string | null; // Added for export errors
}

export interface GeospatialSlice {
  // State
  projectGeometries: ProjectGeometry[];
  geofences: Geofence[];
  mapTiles: MapTile[];
  selectedGeometry: ProjectGeometry | null;
  selectedGeofence: Geofence | null;
  geospatialLoading: GeospatialLoadingState;
  geospatialErrors: GeospatialErrorState;

  // Satellite State
  timeLapse: TimeLapseState;
  satelliteImages: SatelliteImage[];
  ndviData: NDVIDataPoint[];
  selectedSatelliteImage: SatelliteImage | null;

  // Existing Actions
  fetchProjectGeometry: (projectId: string) => Promise<void>;
  fetchAllProjectGeometries: () => Promise<void>;
  updateProjectGeometry: (projectId: string, geometry: Geometry) => Promise<ProjectGeometry | null>;
  fetchGeofences: (projectId: string) => Promise<void>;
  createGeofence: (projectId: string, data: Omit<Geofence, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Geofence | null>;
  updateGeofence: (id: string, data: Partial<Omit<Geofence, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Geofence | null>;
  deleteGeofence: (id: string) => Promise<boolean>;
  fetchMapTiles: (projectId: string, type?: string) => Promise<void>;
  setSelectedGeometry: (geometry: ProjectGeometry | null) => void;
  setSelectedGeofence: (geofence: Geofence | null) => void;
  clearGeospatialErrors: () => void;
  resetGeospatialState: () => void;

  // New Satellite Actions
  fetchSatelliteTimeSeries: (
    projectId: string,
    startDate: string,
    endDate: string,
    filters?: SatelliteFilters
  ) => Promise<void>;
  setTimeLapseFrame: (index: number) => void;
  playTimeLapse: () => void;
  pauseTimeLapse: () => void;
  setTimeLapseSpeed: (speed: number) => void;
  toggleNDVI: () => void;
  setDateRange: (startDate: string, endDate: string) => void;
  exportTimeLapse: (
    projectId: string,
    startDate: string,
    endDate: string,
    format: 'video' | 'gif',
    options?: ExportOptions
  ) => Promise<Blob | null>;
  clearTimeLapse: () => void;
  fetchNDVIData: (
    projectId: string,
    startDate: string,
    endDate: string
  ) => Promise<void>;
  fetchSatelliteImage: (imageId: string) => Promise<SatelliteImage | null>;
  checkDataAvailability: (projectId: string) => Promise<{
    available: boolean;
    imageCount: number;
    earliestDate: string | null;
    latestDate: string | null;
  } | null>;
}