import type {
  CommandResult,
  RobotAlert,
  RobotStatus,
  RobotTelemetry,
  UnsubscribeFunction,
} from '../../models/robot';
import type { FieldBoundary, Mission, MissionConfig, MissionResult, PlannedRoute } from '../../models/mission';
import type { SimulationProfile } from './mockData';

export interface RobotService {
  getRobotStatus(robotId: string): Promise<RobotStatus>;
  getTelemetry(robotId: string): Promise<RobotTelemetry>;
  getFields(): Promise<FieldBoundary[]>;
  getPlannedRoute(fieldId: string, operationType: string): Promise<PlannedRoute>;
  createMission(config: MissionConfig): Promise<Mission>;
  startMission(missionId: string): Promise<CommandResult>;
  pauseMission(missionId: string): Promise<CommandResult>;
  resumeMission(missionId: string): Promise<CommandResult>;
  stopMission(missionId: string): Promise<CommandResult>;
  returnToBase(robotId: string): Promise<CommandResult>;
  requestOperator(robotId: string): Promise<CommandResult>;
  getMissionStatus(missionId: string): Promise<Mission>;
  getMissionResults(missionId: string): Promise<MissionResult>;
  acknowledgeAlert(alertId: string): Promise<void>;
  setAttachedModule?(moduleId: string): Promise<void>;
  subscribeToTelemetry(
    robotId: string,
    callback: (telemetry: RobotTelemetry) => void,
  ): UnsubscribeFunction;
  subscribeToAlerts(
    robotId: string,
    callback: (alert: RobotAlert) => void,
  ): UnsubscribeFunction;
  subscribeToStatus(
    robotId: string,
    callback: (status: RobotStatus) => void,
  ): UnsubscribeFunction;
}

export interface DemoControls {
  resetSimulation(): Promise<void>;
  completeMissionImmediately(): Promise<void>;
  setMissionProgress(percent: number): Promise<void>;
  triggerAlert(type: RobotAlert['type']): Promise<void>;
  triggerConnectionLoss(): Promise<void>;
  triggerCommandFailure(): Promise<void>;
  setBatteryLevel(percent: number): Promise<void>;
  setRobotState(state: RobotStatus['operatingState']): Promise<void>;
  selectSimulationProfile(profile: SimulationProfile): Promise<void>;
}

export type RobotServiceWithDemo = RobotService & { demo?: DemoControls };
