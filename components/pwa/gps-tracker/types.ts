export interface SyncManager {
  register(tag: string): Promise<void>;
}

export interface ExtendedServiceWorkerRegistration {
  readonly sync?: SyncManager;
  readonly active: ServiceWorker | null;
  readonly installing: ServiceWorker | null;
  readonly waiting: ServiceWorker | null;
  readonly scope: string;
  getNotifications(options?: GetNotificationOptions): Promise<Notification[]>;
  showNotification(title: string, options?: NotificationOptions): Promise<void>;
  update(): Promise<void>;
  unregister(): Promise<boolean>;
}

export interface OfflineData {
  routeId?: string;
  positions?: [number, number][];
  username?: string;
  mapImage?: string | null;
  elapsedTime?: number;
  maxSpeed?: number | string;
  totalAscent?: number | string;
  totalDescent?: number | string;
  avgSpeed?: number | string;
  distance?: string;
  timestamp: number | string;
  [key: string]: unknown;
}

export interface Calculations {
  distance: () => string;
  avgSpeed: () => string;
  maxSpeed?: number;
  totalAscent?: number;
  totalDescent?: number;
}

export interface TrackData {
  season: number;
  image: string | null;
  distance: string;
  elapsedTime: number;
  averageSpeed: string;
  fullName: string;
  maxSpeed: string;
  totalAscent: string;
  totalDescent: string;
  timestamp: number;
  positions: [number, number][];
}

export interface PathSegment {
  positions: [number, number][];
  color: string;
  weight: number;
  opacity: number;
}

export interface GPSTrackerProps {
  username: string;
  className?: string;
}

export interface MapComponentProps {
  mapCenter: [number, number] | null;
  positions: [number, number][];
  mapType: 'standard' | 'satellite';
  recenterTrigger: number;
  mapContainerRef: React.RefObject<HTMLDivElement>;
  loading: boolean;
  className?: string;
}

export interface ControlsComponentProps {
  tracking: boolean;
  paused: boolean;
  isOffline: boolean;
  loading: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onPauseTracking: () => void;
  onResumeTracking: () => void;
  onRecenterMap: () => void;
  onToggleMapType: () => void;
  onResetTracking: () => void;
  onShowPath: () => void;
  className?: string;
}

export interface StatsComponentProps {
  distance: string;
  elapsedTime: number;
  speed: number;
  className?: string;
}

export interface ResultsModalProps {
  showResults: boolean;
  mapImage: string | null;
  distance: string;
  elapsedTime: number;
  avgSpeed: string;
  maxSpeed: number;
  isSaving: boolean;
  saveSuccess: boolean | null;
  onClose: () => void;
  onFinish: () => void;
  onReset: () => void;
  className?: string;
}

export interface LogEntry {
  timestamp: number;
  distance: string;
  speed: number;
  position: [number, number];
} 