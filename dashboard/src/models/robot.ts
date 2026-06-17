export type RobotConnectionState =
  | 'online'
  | 'connecting'
  | 'reconnecting'
  | 'offline'
  | 'communication_error';

export type RobotOperatingState =
  | 'offline'
  | 'initializing'
  | 'ready'
  | 'preparing'
  | 'operating'
  | 'paused'
  | 'operator_required'
  | 'returning_to_base'
  | 'charging'
  | 'completed'
  | 'error'
  | 'emergency_stopped';

export type ModuleConnectionStatus = 'connected' | 'disconnected' | 'fault';
export type ModuleReadinessState = 'ready' | 'warming_up' | 'fault' | 'not_attached';

export type RobotModule = {
  moduleId: string;
  name: string;
  type: 'laser_weeding' | 'precision_spraying';
  connectionStatus: ModuleConnectionStatus;
  readinessState: ModuleReadinessState;
  consumableLevelPercent?: number;
  faultStatus?: string;
};

export type MotorStatus = 'ok' | 'warning' | 'fault';

export type RobotHealth = {
  batteryPercent: number;
  batteryTemperatureCelsius: number;
  computeTemperatureCelsius: number;
  motorStatus: MotorStatus;
  moduleStatus: ModuleReadinessState;
  connectionStrengthPercent: number;
  emergencyStopActive: boolean;
};

export type Robot = {
  robotId: string;
  name: string;
  model: string;
  location: string;
};

export type RobotStatus = {
  robotId: string;
  name: string;
  model: string;
  location: string;
  connectionState: RobotConnectionState;
  operatingState: RobotOperatingState;
  attachedModule?: RobotModule;
  health: RobotHealth;
  batteryPercent: number;
  lastUpdatedAt: string;
};

export type ModuleTelemetry = {
  moduleId: string;
  status: ModuleReadinessState;
  targetsDetected: number;
  targetsTreated: number;
  consumableLevelPercent?: number;
  tankLevelLiters?: number;
};

export type RobotTelemetry = {
  robotId: string;
  missionId?: string;
  timestamp: string;
  position: {
    latitude: number;
    longitude: number;
    headingDegrees: number;
  };
  speedMetersPerSecond: number;
  batteryPercent: number;
  connectionQualityPercent: number;
  runtimeSeconds: number;
  distanceTraveledMeters: number;
  areaCompletedSquareMeters: number;
  moduleTelemetry: ModuleTelemetry;
};

export type RobotCommandType =
  | 'start'
  | 'pause'
  | 'resume'
  | 'stop'
  | 'return_to_base'
  | 'request_operator';

export type CommandStatus =
  | 'pending'
  | 'acknowledged'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'failed'
  | 'timed_out';

export type CommandResult = {
  commandId: string;
  commandType: RobotCommandType;
  status: CommandStatus;
  submittedAt: string;
  completedAt?: string;
  errorCode?: string;
  errorMessage?: string;
};

export type AlertSeverity = 'informational' | 'warning' | 'critical';

export type AlertType =
  | 'low_battery'
  | 'obstacle_detected'
  | 'module_fault'
  | 'connection_interrupted'
  | 'tank_level_low'
  | 'overheating'
  | 'route_blocked'
  | 'operator_assistance_required'
  | 'mission_stopped'
  | 'emergency_stop_activated';

export type RobotAlert = {
  alertId: string;
  robotId: string;
  missionId?: string;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  recommendedAction: string;
};

export type CameraStreamStatus = 'available' | 'unavailable' | 'connecting' | 'delayed';

export type UnsubscribeFunction = () => void;
