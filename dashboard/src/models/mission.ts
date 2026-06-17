import type { RobotModule } from './robot';

export type OperationType = 'laser_weeding' | 'precision_spraying';

export type RoutePoint = {
  latitude: number;
  longitude: number;
  order: number;
};

export type FieldArea = {
  areaSquareMeters: number;
  label: string;
};

export type WeedingParameters = {
  weedDensityLevel: 'low' | 'medium' | 'high';
  estimatedWeedCount: number;
  treatmentSensitivity: 'conservative' | 'balanced' | 'aggressive';
  cropExclusionDistanceMeters: number;
  targetAreaSquareMeters: number;
  estimatedDurationMinutes: number;
};

export type SprayingParameters = {
  productName: string;
  applicationRateLitersPerHectare: number;
  tankLevelLiters: number;
  requiredVolumeLiters: number;
  targetRows: string;
  estimatedDurationMinutes: number;
};

export type FieldBoundary = {
  fieldId: string;
  name: string;
  areaHectares: number;
  boundary: RoutePoint[];
  entryPoint: RoutePoint;
  restrictedZones: RoutePoint[][];
  cropType: string;
};

export type PlannedRoute = {
  routeId: string;
  fieldId: string;
  operationType: OperationType;
  points: RoutePoint[];
  treatmentZones: RoutePoint[][];
  estimatedDistanceMeters: number;
  estimatedDurationMinutes: number;
};

export type MissionConfig = {
  robotId: string;
  fieldId: string;
  operationType: OperationType;
  moduleId: string;
  targetArea: FieldArea;
  plannedRoute: RoutePoint[];
  parameters: WeedingParameters | SprayingParameters;
  operatingMode: 'autonomous' | 'supervised';
  estimatedDurationMinutes: number;
  estimatedBatteryUsagePercent: number;
};

export type MissionStatus =
  | 'draft'
  | 'planned'
  | 'starting'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'completed'
  | 'aborted'
  | 'failed';

export type Mission = {
  missionId: string;
  config: MissionConfig;
  status: MissionStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  progressPercent: number;
  estimatedTimeRemainingSeconds?: number;
};

export type MissionCompletionStatus =
  | 'completed'
  | 'partially_completed'
  | 'aborted'
  | 'failed';

export type WeedingResult = {
  weedsDetected: number;
  weedsTreated: number;
  treatmentSuccessRatePercent: number;
  missedTargets: number;
  cropSafetyIncidents: number;
  areaTreatedSquareMeters: number;
  energyUsedKwh: number;
};

export type SprayingResult = {
  areaTreatedSquareMeters: number;
  productUsedLiters: number;
  liquidVolumeUsedLiters: number;
  applicationRateLitersPerHectare: number;
  coveragePercent: number;
  skippedZones: number;
  tankRemainingLiters: number;
};

export type MissionResult = {
  missionId: string;
  robotId: string;
  robotName: string;
  module: RobotModule;
  operationType: OperationType;
  fieldName: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  completionStatus: MissionCompletionStatus;
  areaCoveredSquareMeters: number;
  distanceTraveledMeters: number;
  batteryUsedPercent: number;
  alertCount: number;
  weedingResult?: WeedingResult;
  sprayingResult?: SprayingResult;
  completedRoute: RoutePoint[];
  skippedZones: RoutePoint[][];
};

export type SafetyChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  required: boolean;
};
