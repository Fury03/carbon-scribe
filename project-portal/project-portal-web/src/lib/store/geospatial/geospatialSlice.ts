import { StateCreator } from 'zustand';
import type { GeospatialSlice, ProjectGeometry, Geofence, MapTile, Geometry, SatelliteImage, NDVIDataPoint } from './geospatial.types';
import {
  fetchProjectGeometryApi,
  fetchAllProjectGeometriesApi,
  updateProjectGeometryApi,
  fetchGeofencesApi,
  createGeofenceApi,
  updateGeofenceApi,
  deleteGeofenceApi,
  fetchMapTilesApi,
} from './geospatial.api';
import { geospatialApi } from '@/lib/geospatial/satellite';
import { getErrorMessage } from '@/lib/utils/errorMessage';
import { showSuccessToast, showErrorToast } from '@/lib/utils/toast';

// Initial state for time-lapse feature
const initialTimeLapseState = {
  projectId: null,
  images: [],
  currentFrameIndex: 0,
  isPlaying: false,
  speed: 2, // Default: 2 frames per second
  showNDVI: false,
  startDate: null,
  endDate: null,
  isLoading: false,
  error: null,
  exportInProgress: false,
};

const initialState: Pick<
  GeospatialSlice,
  | 'projectGeometries'
  | 'geofences'
  | 'mapTiles'
  | 'selectedGeometry'
  | 'selectedGeofence'
  | 'geospatialLoading'
  | 'geospatialErrors'
  | 'timeLapse'
  | 'satelliteImages'
  | 'ndviData'
  | 'selectedSatelliteImage'
> = {
  projectGeometries: [],
  geofences: [],
  mapTiles: [],
  selectedGeometry: null,
  selectedGeofence: null,
  geospatialLoading: {
    isFetchingGeometry: false,
    isFetchingGeofences: false,
    isFetchingTiles: false,
    isUpdating: false,
  },
  geospatialErrors: {
    fetchGeometry: null,
    fetchGeofences: null,
    fetchTiles: null,
    update: null,
  },
  // Satellite state
  timeLapse: initialTimeLapseState,
  satelliteImages: [],
  ndviData: [],
  selectedSatelliteImage: null,
};

export const createGeospatialSlice: StateCreator<GeospatialSlice> = (set, get) => ({
  ...initialState,

  fetchProjectGeometry: async (projectId: string) => {
    set((state) => ({
      geospatialLoading: { ...state.geospatialLoading, isFetchingGeometry: true },
      geospatialErrors: { ...state.geospatialErrors, fetchGeometry: null },
    }));

    try {
      const geometry = await fetchProjectGeometryApi(projectId);
      set((state) => ({
        projectGeometries: state.projectGeometries
          .filter((g) => g.projectId !== projectId)
          .concat([geometry]),
        geospatialLoading: { ...get().geospatialLoading, isFetchingGeometry: false },
      }));
    } catch (error: unknown) {
      set((state) => ({
        geospatialLoading: { ...state.geospatialLoading, isFetchingGeometry: false },
        geospatialErrors: { ...state.geospatialErrors, fetchGeometry: getErrorMessage(error) },
      }));
    }
  },

  fetchAllProjectGeometries: async () => {
    set((state) => ({
      geospatialLoading: { ...state.geospatialLoading, isFetchingGeometry: true },
      geospatialErrors: { ...state.geospatialErrors, fetchGeometry: null },
    }));

    try {
      const geometries = await fetchAllProjectGeometriesApi();
      set({
        projectGeometries: geometries,
        geospatialLoading: { ...get().geospatialLoading, isFetchingGeometry: false },
      });
    } catch (error: unknown) {
      set((state) => ({
        geospatialLoading: { ...state.geospatialLoading, isFetchingGeometry: false },
        geospatialErrors: { ...state.geospatialErrors, fetchGeometry: getErrorMessage(error) },
      }));
    }
  },

  updateProjectGeometry: async (projectId: string, geometry: Geometry) => {
    set((state) => ({
      geospatialLoading: { ...state.geospatialLoading, isUpdating: true },
      geospatialErrors: { ...state.geospatialErrors, update: null },
    }));

    try {
      const updatedGeometry = await updateProjectGeometryApi(projectId, geometry);
      set((state) => ({
        projectGeometries: state.projectGeometries
          .map((g) => (g.projectId === projectId ? updatedGeometry : g)),
        selectedGeometry: state.selectedGeometry?.projectId === projectId ? updatedGeometry : state.selectedGeometry,
        geospatialLoading: { ...get().geospatialLoading, isUpdating: false },
      }));
      showSuccessToast('Geometry updated successfully');
      return updatedGeometry;
    } catch (error: unknown) {
      set((state) => ({
        geospatialLoading: { ...state.geospatialLoading, isUpdating: false },
        geospatialErrors: { ...state.geospatialErrors, update: getErrorMessage(error) },
      }));
      showErrorToast('Failed to update geometry');
      return null;
    }
  },

  fetchGeofences: async (projectId: string) => {
    set((state) => ({
      geospatialLoading: { ...state.geospatialLoading, isFetchingGeofences: true },
      geospatialErrors: { ...state.geospatialErrors, fetchGeofences: null },
    }));

    try {
      const geofences = await fetchGeofencesApi(projectId);
      set((state) => ({
        geofences: state.geofences
          .filter((g) => g.projectId !== projectId)
          .concat(geofences),
        geospatialLoading: { ...get().geospatialLoading, isFetchingGeofences: false },
      }));
    } catch (error: unknown) {
      set((state) => ({
        geospatialLoading: { ...state.geospatialLoading, isFetchingGeofences: false },
        geospatialErrors: { ...state.geospatialErrors, fetchGeofences: getErrorMessage(error) },
      }));
    }
  },

  createGeofence: async (projectId: string, data: Omit<Geofence, 'id' | 'createdAt' | 'updatedAt'>) => {
    set((state) => ({
      geospatialLoading: { ...state.geospatialLoading, isUpdating: true },
      geospatialErrors: { ...state.geospatialErrors, update: null },
    }));

    try {
      const newGeofence = await createGeofenceApi(projectId, data);
      set((state) => ({
        geofences: [...state.geofences, newGeofence],
        geospatialLoading: { ...get().geospatialLoading, isUpdating: false },
      }));
      showSuccessToast('Geofence created successfully');
      return newGeofence;
    } catch (error: unknown) {
      set((state) => ({
        geospatialLoading: { ...state.geospatialLoading, isUpdating: false },
        geospatialErrors: { ...state.geospatialErrors, update: getErrorMessage(error) },
      }));
      showErrorToast('Failed to create geofence');
      return null;
    }
  },

  updateGeofence: async (id: string, data: Partial<Omit<Geofence, 'id' | 'createdAt' | 'updatedAt'>>) => {
    set((state) => ({
      geospatialLoading: { ...state.geospatialLoading, isUpdating: true },
      geospatialErrors: { ...state.geospatialErrors, update: null },
    }));

    try {
      const updatedGeofence = await updateGeofenceApi(id, data);
      set((state) => ({
        geofences: state.geofences.map((g) => (g.id === id ? updatedGeofence : g)),
        selectedGeofence: state.selectedGeofence?.id === id ? updatedGeofence : state.selectedGeofence,
        geospatialLoading: { ...get().geospatialLoading, isUpdating: false },
      }));
      showSuccessToast('Geofence updated successfully');
      return updatedGeofence;
    } catch (error: unknown) {
      set((state) => ({
        geospatialLoading: { ...state.geospatialLoading, isUpdating: false },
        geospatialErrors: { ...state.geospatialErrors, update: getErrorMessage(error) },
      }));
      showErrorToast('Failed to update geofence');
      return null;
    }
  },

  deleteGeofence: async (id: string) => {
    set((state) => ({
      geospatialLoading: { ...state.geospatialLoading, isUpdating: true },
      geospatialErrors: { ...state.geospatialErrors, update: null },
    }));

    try {
      await deleteGeofenceApi(id);
      set((state) => ({
        geofences: state.geofences.filter((g) => g.id !== id),
        selectedGeofence: state.selectedGeofence?.id === id ? null : state.selectedGeofence,
        geospatialLoading: { ...get().geospatialLoading, isUpdating: false },
      }));
      showSuccessToast('Geofence deleted successfully');
      return true;
    } catch (error: unknown) {
      set((state) => ({
        geospatialLoading: { ...state.geospatialLoading, isUpdating: false },
        geospatialErrors: { ...state.geospatialErrors, update: getErrorMessage(error) },
      }));
      showErrorToast('Failed to delete geofence');
      return false;
    }
  },

  fetchMapTiles: async (projectId: string, type?: string) => {
    set((state) => ({
      geospatialLoading: { ...state.geospatialLoading, isFetchingTiles: true },
      geospatialErrors: { ...state.geospatialErrors, fetchTiles: null },
    }));

    try {
      const tiles = await fetchMapTilesApi(projectId, type);
      set((state) => ({
        mapTiles: state.mapTiles
          .filter((t) => t.projectId !== projectId || (type && t.type !== type))
          .concat(tiles),
        geospatialLoading: { ...get().geospatialLoading, isFetchingTiles: false },
      }));
    } catch (error: unknown) {
      set((state) => ({
        geospatialLoading: { ...state.geospatialLoading, isFetchingTiles: false },
        geospatialErrors: { ...state.geospatialErrors, fetchTiles: getErrorMessage(error) },
      }));
    }
  },

  setSelectedGeometry: (geometry) => set({ selectedGeometry: geometry }),
  setSelectedGeofence: (geofence) => set({ selectedGeofence: geofence }),

  clearGeospatialErrors: () =>
    set({
      geospatialErrors: {
        fetchGeometry: null,
        fetchGeofences: null,
        fetchTiles: null,
        update: null,
      },
    }),

  resetGeospatialState: () => set({ ...initialState }),

  // ===================== SATELLITE TIME-LAPSE METHODS =====================

  /**
   * Fetch historical satellite imagery for a project within a date range
   */
  fetchSatelliteTimeSeries: async (
    projectId: string,
    startDate: string,
    endDate: string
  ) => {
    set((state) => ({
      timeLapse: {
        ...state.timeLapse,
        isLoading: true,
        error: null,
        projectId,
        startDate,
        endDate,
      },
    }));

    try {
      const timeSeries = await geospatialApi.fetchHistoricalImagery(
        projectId,
        startDate,
        endDate
      );

      set((state) => ({
        timeLapse: {
          ...state.timeLapse,
          images: timeSeries.images,
          currentFrameIndex: 0,
          isLoading: false,
        },
        satelliteImages: timeSeries.images,
      }));

      // Also fetch NDVI data if available
      try {
        const ndviData = await geospatialApi.fetchNDVIData(
          projectId,
          startDate,
          endDate
        );
        set({ ndviData });
      } catch (ndviError) {
        // NDVI fetch failure is non-critical - log but don't fail the main operation
        console.warn('Failed to fetch NDVI data:', ndviError);
      }
    } catch (error: unknown) {
      set((state) => ({
        timeLapse: {
          ...state.timeLapse,
          isLoading: false,
          error: getErrorMessage(error),
        },
      }));
      showErrorToast('Failed to load satellite imagery');
    }
  },

  /**
   * Set the current frame index for the time-lapse
   */
  setTimeLapseFrame: (index: number) => {
    set((state) => ({
      timeLapse: {
        ...state.timeLapse,
        currentFrameIndex: Math.max(
          0,
          Math.min(index, state.timeLapse.images.length - 1)
        ),
      },
    }));
  },

  /**
   * Start playing the time-lapse
   */
  playTimeLapse: () => {
    set((state) => ({
      timeLapse: {
        ...state.timeLapse,
        isPlaying: true,
      },
    }));
  },

  /**
   * Pause the time-lapse playback
   */
  pauseTimeLapse: () => {
    set((state) => ({
      timeLapse: {
        ...state.timeLapse,
        isPlaying: false,
      },
    }));
  },

  /**
   * Set the playback speed (frames per second)
   */
  setTimeLapseSpeed: (speed: number) => {
    set((state) => ({
      timeLapse: {
        ...state.timeLapse,
        speed: Math.max(0.5, Math.min(10, speed)), // Clamp between 0.5 and 10
      },
    }));
  },

  /**
   * Toggle NDVI overlay visibility
   */
  toggleNDVI: () => {
    set((state) => ({
      timeLapse: {
        ...state.timeLapse,
        showNDVI: !state.timeLapse.showNDVI,
      },
    }));
  },

  /**
   * Set the date range for the time-lapse
   */
  setDateRange: (startDate: string, endDate: string) => {
    set((state) => ({
      timeLapse: {
        ...state.timeLapse,
        startDate,
        endDate,
        currentFrameIndex: 0,
      },
    }));
  },

  /**
   * Export the time-lapse as video or GIF
   */
  exportTimeLapse: async (
    projectId: string,
    startDate: string,
    endDate: string,
    format: 'video' | 'gif'
  ) => {
    set((state) => ({
      timeLapse: {
        ...state.timeLapse,
        exportInProgress: true,
      },
    }));

    try {
      const blob = await geospatialApi.exportTimeLapse(
        projectId,
        startDate,
        endDate,
        {
          format,
          fps: get().timeLapse.speed,
          includeNDVI: get().timeLapse.showNDVI,
        }
      );

      showSuccessToast(`Time-lapse ${format} exported successfully`);
      return blob;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showErrorToast(`Failed to export time-lapse: ${errorMessage}`);
      return null;
    } finally {
      set((state) => ({
        timeLapse: {
          ...state.timeLapse,
          exportInProgress: false,
        },
      }));
    }
  },

  /**
   * Clear all time-lapse data from state
   */
  clearTimeLapse: () => {
    set((state) => ({
      timeLapse: initialTimeLapseState,
      satelliteImages: [],
      ndviData: [],
      selectedSatelliteImage: null,
    }));
  },

  /**
   * Fetch NDVI data for a project within a date range
   */
  fetchNDVIData: async (projectId: string, startDate: string, endDate: string) => {
    try {
      const ndviData = await geospatialApi.fetchNDVIData(
        projectId,
        startDate,
        endDate
      );
      set({ ndviData });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showErrorToast(`Failed to fetch NDVI data: ${errorMessage}`);
    }
  },

  /**
   * Fetch a single satellite image by ID
   */
  fetchSatelliteImage: async (imageId: string) => {
    try {
      const image = await geospatialApi.fetchSatelliteImage(imageId);
      set({ selectedSatelliteImage: image });
      return image;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showErrorToast(`Failed to fetch satellite image: ${errorMessage}`);
      return null;
    }
  },

  /**
   * Check if satellite data is available for a project
   */
  checkDataAvailability: async (projectId: string) => {
    try {
      const availability = await geospatialApi.checkDataAvailability(projectId);
      return availability;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.warn('Failed to check data availability:', errorMessage);
      return null;
    }
  },
});