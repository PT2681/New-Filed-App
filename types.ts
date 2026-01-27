
export interface Feature {
  id: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
}

export enum RoutePath {
  HOME = '/',
  PROFILE = '/profile',
  PROJECTS = '/projects',
  PROJECT_DETAILS = '/projects/:id',
  TRAINING = '/training',
  TRAINING_DETAILS = '/training/:id',
  TOURS = '/tours',
  ACTIVE_TOUR = '/tours/:id/active',
  NOTIFICATIONS = '/notifications',
  SETTINGS = '/settings',
  LOGIN = '/login',
  FORGOT_PASSWORD = '/forgot-password',
  NOT_FOUND = '*'
}

export interface AttendanceState {
  status: 'IN' | 'OUT';
  punchInTime: string | null;
  punchOutTime: string | null;
  location: string | null;
  weather: string | null;
  photoUrl: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface AttendanceLog {
  date: string;
  start: string;
  end: string;
  weather: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Holiday';
}

export type ProjectStatus = 'Active' | 'Completed' | 'Cancelled' | 'Hold';

export interface Project {
  id: string;
  name: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  visitsCompleted: number;
}

export type TrainingRole = 'TRAINEE' | 'TRAINER';
export type TrainingStatus = 'Due' | 'In Progress' | 'Completed' | 'Cancelled';

export interface TrainingSession {
  id: string;
  projectName: string;
  topic: string;
  description: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  locationName: string;
  locationCoords: { lat: number; lng: number };
  role: TrainingRole;
  status: TrainingStatus;
  photoUrl?: string; // Start photo
  actualStartTime?: string;
  actualEndTime?: string;
  completionPhotoUrl?: string; // End photo
  remarks?: string;
}

export type TourStatus = 'Upcoming' | 'In Progress' | 'Completed' | 'Claimed';
export type ClaimStatus = 'Paid' | 'Due';
export type TransportMode = 'Bike' | 'Car' | 'Bus';
export type TravelType = 'Individual' | 'Pool';
export type PoolRole = 'Driver' | 'Passenger';
export type TourPhase = 'OUTWARD' | 'ON_SITE' | 'RETURN';

export interface Tour {
  id: string;
  projectId: string;
  projectName: string;
  taskName: string; // "Training", "Site Visit", "Other"
  taskDescription?: string;
  fromLocation: string;
  toLocation: string;
  toCoordinates: { lat: number; lng: number };
  startDate: string; // Scheduled start
  endDate: string; // Scheduled end
  status: TourStatus;
  advanceAmount?: number;
  
  // Execution Details
  tourPhase?: TourPhase; // New field
  actualStartDate?: string; // Start of Outward
  siteArrivalTime?: string; // Start of On-Site
  returnStartTime?: string; // Start of Return
  actualEndDate?: string; // End of Return (Complete)
  
  transportMode?: TransportMode;
  travelType?: TravelType;
  poolRole?: PoolRole;
  vehiclePlateUrl?: string;
  
  startSelfieUrl?: string;
  siteArrivalSelfieUrl?: string; // New field
  returnStartSelfieUrl?: string; // New field
  endSelfieUrl?: string;
  
  surroundingVideoUrl?: string; 
  distanceCovered?: number; // km
  weatherData?: string;
  
  // Claim Details
  claimStatus?: ClaimStatus;
  claimAmount?: number;
}

export type NotificationType = 'PROJECT_ASSIGNED' | 'TRAINING_ASSIGNED' | 'CLAIM_PAID' | 'GENERAL';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  referenceId?: string;
  route?: string;
}