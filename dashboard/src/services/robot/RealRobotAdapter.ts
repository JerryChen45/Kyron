import type {
  CommandResult,
  RobotAlert,
  RobotStatus,
  RobotTelemetry,
  UnsubscribeFunction,
} from '../../models/robot';
import type { FieldBoundary, Mission, MissionConfig, MissionResult, PlannedRoute } from '../../models/mission';
import type { RobotService } from './RobotService';

/**
 * Stub adapter for future real robot integration.
 *
 * Future implementation will:
 * - Connect to a secure backend robot gateway
 * - Receive telemetry via WebSocket or SSE
 * - Send commands via authenticated REST/WebSocket API
 * - Handle connection interruptions and reconnection
 * - Translate robot messages into shared application data models
 */
export class RealRobotAdapter implements RobotService {
  private baseUrl = import.meta.env.VITE_ROBOT_API_URL ?? 'https://api.kyron.example';

  private notImplemented(method: string): never {
    throw new Error(
      `RealRobotAdapter.${method} is not implemented. ` +
        `Configure VITE_ROBOT_PROVIDER=mock for the MVP demo. ` +
        `Backend endpoint: ${this.baseUrl}`,
    );
  }

  async getRobotStatus(_robotId: string): Promise<RobotStatus> {
    // TODO: GET ${this.baseUrl}/robots/${robotId}/status
    this.notImplemented('getRobotStatus');
  }

  async getTelemetry(_robotId: string): Promise<RobotTelemetry> {
    // TODO: GET ${this.baseUrl}/robots/${robotId}/telemetry
    this.notImplemented('getTelemetry');
  }

  async getFields(): Promise<FieldBoundary[]> {
    // TODO: GET ${this.baseUrl}/fields
    this.notImplemented('getFields');
  }

  async getPlannedRoute(_fieldId: string, _operationType: string): Promise<PlannedRoute> {
    // TODO: GET ${this.baseUrl}/fields/${fieldId}/routes?operation=${operationType}
    this.notImplemented('getPlannedRoute');
  }

  async createMission(_config: MissionConfig): Promise<Mission> {
    // TODO: POST ${this.baseUrl}/missions
    this.notImplemented('createMission');
  }

  async startMission(_missionId: string): Promise<CommandResult> {
    // TODO: POST ${this.baseUrl}/missions/${missionId}/start
    this.notImplemented('startMission');
  }

  async pauseMission(_missionId: string): Promise<CommandResult> {
    // TODO: POST ${this.baseUrl}/missions/${missionId}/pause
    this.notImplemented('pauseMission');
  }

  async resumeMission(_missionId: string): Promise<CommandResult> {
    // TODO: POST ${this.baseUrl}/missions/${missionId}/resume
    this.notImplemented('resumeMission');
  }

  async stopMission(_missionId: string): Promise<CommandResult> {
    // TODO: POST ${this.baseUrl}/missions/${missionId}/stop
    this.notImplemented('stopMission');
  }

  async returnToBase(_robotId: string): Promise<CommandResult> {
    // TODO: POST ${this.baseUrl}/robots/${robotId}/return-to-base
    this.notImplemented('returnToBase');
  }

  async requestOperator(_robotId: string): Promise<CommandResult> {
    // TODO: POST ${this.baseUrl}/robots/${robotId}/request-operator
    this.notImplemented('requestOperator');
  }

  async getMissionStatus(_missionId: string): Promise<Mission> {
    // TODO: GET ${this.baseUrl}/missions/${missionId}
    this.notImplemented('getMissionStatus');
  }

  async getMissionResults(_missionId: string): Promise<MissionResult> {
    // TODO: GET ${this.baseUrl}/missions/${missionId}/results
    this.notImplemented('getMissionResults');
  }

  async acknowledgeAlert(_alertId: string): Promise<void> {
    // TODO: POST ${this.baseUrl}/alerts/${alertId}/acknowledge
    this.notImplemented('acknowledgeAlert');
  }

  subscribeToTelemetry(
    _robotId: string,
    _callback: (telemetry: RobotTelemetry) => void,
  ): UnsubscribeFunction {
    // TODO: WebSocket ${this.baseUrl}/ws/telemetry/${robotId}
    this.notImplemented('subscribeToTelemetry');
  }

  subscribeToAlerts(
    _robotId: string,
    _callback: (alert: RobotAlert) => void,
  ): UnsubscribeFunction {
    // TODO: WebSocket ${this.baseUrl}/ws/alerts/${robotId}
    this.notImplemented('subscribeToAlerts');
  }

  subscribeToStatus(
    _robotId: string,
    _callback: (status: RobotStatus) => void,
  ): UnsubscribeFunction {
    // TODO: WebSocket ${this.baseUrl}/ws/status/${robotId}
    this.notImplemented('subscribeToStatus');
  }
}
