import { appConfig } from '../../config/appConfig';
import type {
  CommandResult,
  RobotAlert,
  RobotCommandType,
  RobotStatus,
  RobotTelemetry,
  UnsubscribeFunction,
} from '../../models/robot';
import type {
  FieldBoundary,
  Mission,
  MissionConfig,
  MissionResult,
  PlannedRoute,
} from '../../models/mission';
import type { DemoControls, RobotService } from './RobotService';
import {
  MOCK_FIELDS,
  MOCK_MODULES,
  MOCK_ROBOT,
  MOCK_ROUTES,
  type SimulationProfile,
} from './mockData';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function log(event: string, detail?: unknown) {
  if (import.meta.env.DEV) {
    console.log(`[MockRobot] ${event}`, detail ?? '');
  }
}

export class MockRobotAdapter implements RobotService, DemoControls {
  demo: DemoControls = this;

  private robotStatus: RobotStatus;
  private telemetry: RobotTelemetry;
  private missions = new Map<string, Mission>();
  private alerts: RobotAlert[] = [];
  private activeMissionId: string | null = null;
  private telemetryInterval: ReturnType<typeof setInterval> | null = null;
  private telemetrySubscribers = new Set<(t: RobotTelemetry) => void>();
  private alertSubscribers = new Set<(a: RobotAlert) => void>();
  private statusSubscribers = new Set<(s: RobotStatus) => void>();
  private profile: SimulationProfile = 'successful_mission';
  private forceCommandFailure = false;
  private connectionLost = false;
  private missionStartBattery = 87;
  private deterministicStep = 0;

  constructor() {
    this.robotStatus = this.buildInitialStatus();
    this.telemetry = this.buildInitialTelemetry();
    log('Robot connected', MOCK_ROBOT.robotId);
  }

  private buildInitialStatus(): RobotStatus {
    return {
      ...MOCK_ROBOT,
      connectionState: 'online',
      operatingState: 'ready',
      attachedModule: MOCK_MODULES['module-laser-01'],
      batteryPercent: 87,
      health: {
        batteryPercent: 87,
        batteryTemperatureCelsius: 28,
        computeTemperatureCelsius: 42,
        motorStatus: 'ok',
        moduleStatus: 'ready',
        connectionStrengthPercent: 94,
        emergencyStopActive: false,
      },
      lastUpdatedAt: now(),
    };
  }

  private buildInitialTelemetry(): RobotTelemetry {
    const entry = MOCK_FIELDS[0].entryPoint;
    return {
      robotId: MOCK_ROBOT.robotId,
      timestamp: now(),
      position: {
        latitude: entry.latitude,
        longitude: entry.longitude,
        headingDegrees: 90,
      },
      speedMetersPerSecond: 0,
      batteryPercent: 87,
      connectionQualityPercent: 94,
      runtimeSeconds: 0,
      distanceTraveledMeters: 0,
      areaCompletedSquareMeters: 0,
      moduleTelemetry: {
        moduleId: MOCK_MODULES['module-laser-01'].moduleId,
        status: 'ready',
        targetsDetected: 0,
        targetsTreated: 0,
        consumableLevelPercent: 100,
      },
    };
  }

  private notifyStatus() {
    this.statusSubscribers.forEach((cb) => cb({ ...this.robotStatus }));
  }

  private notifyTelemetry() {
    if (this.connectionLost) return;
    this.telemetrySubscribers.forEach((cb) => cb({ ...this.telemetry }));
  }

  private emitAlert(alert: RobotAlert) {
    this.alerts.push(alert);
    log('Alert received', alert.type);
    this.alertSubscribers.forEach((cb) => cb(alert));
  }

  private updateStatus(patch: Partial<RobotStatus>) {
    this.robotStatus = { ...this.robotStatus, ...patch, lastUpdatedAt: now() };
    this.notifyStatus();
  }

  async getRobotStatus(_robotId: string): Promise<RobotStatus> {
    await delay(150);
    return { ...this.robotStatus };
  }

  async getTelemetry(_robotId: string): Promise<RobotTelemetry> {
    await delay(100);
    return { ...this.telemetry };
  }

  async getFields(): Promise<FieldBoundary[]> {
    await delay(200);
    return [...MOCK_FIELDS];
  }

  async getPlannedRoute(fieldId: string, operationType: string): Promise<PlannedRoute> {
    await delay(250);
    const route = Object.values(MOCK_ROUTES).find(
      (r) => r.fieldId === fieldId && r.operationType === operationType,
    );
    if (!route) {
      throw new Error(`No route found for field ${fieldId} and operation ${operationType}`);
    }
    return { ...route, points: [...route.points] };
  }

  async createMission(config: MissionConfig): Promise<Mission> {
    await delay(400);
    const mission: Mission = {
      missionId: uid(),
      config,
      status: 'planned',
      createdAt: now(),
      progressPercent: 0,
      estimatedTimeRemainingSeconds: config.estimatedDurationMinutes * 60,
    };
    this.missions.set(mission.missionId, mission);
    log('Mission created', mission.missionId);
    return { ...mission };
  }

  private async executeCommand(
    commandType: RobotCommandType,
    missionId?: string,
    validate?: () => string | null,
  ): Promise<CommandResult> {
    const commandId = uid();
    const submittedAt = now();
    log('Command submitted', commandType);

    const result: CommandResult = {
      commandId,
      commandType,
      status: 'pending',
      submittedAt,
    };

    await delay(300);
    result.status = 'acknowledged';

    if (this.forceCommandFailure) {
      this.forceCommandFailure = false;
      result.status = 'rejected';
      result.completedAt = now();
      result.errorCode = 'SIMULATED_FAILURE';
      result.errorMessage = 'Simulated command failure (demo control)';
      log('Command rejected', result.errorMessage);
      return result;
    }

    const validationError = validate?.();
    if (validationError) {
      result.status = 'rejected';
      result.completedAt = now();
      result.errorCode = 'VALIDATION_FAILED';
      result.errorMessage = validationError;
      log('Command rejected', validationError);
      return result;
    }

    if (this.robotStatus.connectionState === 'offline') {
      result.status = 'rejected';
      result.completedAt = now();
      result.errorCode = 'ROBOT_OFFLINE';
      result.errorMessage = 'Robot is offline';
      return result;
    }

    await delay(500);
    result.status = 'accepted';
    result.completedAt = now();
    log('Command acknowledged', commandType);

    if (commandType === 'start' && missionId) {
      this.startMissionSimulation(missionId);
    } else if (commandType === 'pause' && missionId) {
      this.pauseMissionSimulation(missionId);
    } else if (commandType === 'resume' && missionId) {
      this.resumeMissionSimulation(missionId);
    } else if (commandType === 'stop' && missionId) {
      this.stopMissionSimulation(missionId);
    } else if (commandType === 'return_to_base') {
      this.returnToBaseSimulation();
    }

    return result;
  }

  async startMission(missionId: string): Promise<CommandResult> {
    return this.executeCommand('start', missionId, () => {
      const mission = this.missions.get(missionId);
      if (!mission) return 'Mission not found';
      if (this.robotStatus.operatingState !== 'ready' && this.robotStatus.operatingState !== 'preparing') {
        return 'Robot is not ready';
      }
      if (this.robotStatus.batteryPercent < 20) return 'Battery too low';
      if (this.robotStatus.health.emergencyStopActive) return 'Emergency stop is active';
      const module = this.robotStatus.attachedModule;
      if (!module || module.readinessState !== 'ready') return 'Module not ready';
      const expected =
        mission.config.operationType === 'laser_weeding' ? 'laser_weeding' : 'precision_spraying';
      if (module.type !== expected) return 'Incorrect module attached';
      return null;
    });
  }

  async pauseMission(missionId: string): Promise<CommandResult> {
    return this.executeCommand('pause', missionId);
  }

  async resumeMission(missionId: string): Promise<CommandResult> {
    return this.executeCommand('resume', missionId);
  }

  async stopMission(missionId: string): Promise<CommandResult> {
    return this.executeCommand('stop', missionId);
  }

  async returnToBase(_robotId: string): Promise<CommandResult> {
    return this.executeCommand('return_to_base');
  }

  async requestOperator(_robotId: string): Promise<CommandResult> {
    this.emitAlert({
      alertId: uid(),
      robotId: MOCK_ROBOT.robotId,
      missionId: this.activeMissionId ?? undefined,
      severity: 'warning',
      type: 'operator_assistance_required',
      message: 'Operator assistance requested',
      timestamp: now(),
      acknowledged: false,
      recommendedAction: 'Proceed to the field and assess the robot',
    });
    this.updateStatus({ operatingState: 'operator_required' });
    return this.executeCommand('request_operator');
  }

  async getMissionStatus(missionId: string): Promise<Mission> {
    await delay(100);
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error('Mission not found');
    return { ...mission };
  }

  async getMissionResults(missionId: string): Promise<MissionResult> {
    await delay(300);
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error('Mission not found');
    return this.buildMissionResult(mission);
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    await delay(100);
    const alert = this.alerts.find((a) => a.alertId === alertId);
    if (alert) alert.acknowledged = true;
  }

  async setAttachedModule(moduleId: string): Promise<void> {
    await delay(200);
    const mod = MOCK_MODULES[moduleId];
    if (mod) {
      this.updateStatus({
        attachedModule: { ...mod },
        health: { ...this.robotStatus.health, moduleStatus: mod.readinessState },
      });
      log('Module attached', moduleId);
    }
  }

  subscribeToTelemetry(_robotId: string, callback: (telemetry: RobotTelemetry) => void): UnsubscribeFunction {
    this.telemetrySubscribers.add(callback);
    callback({ ...this.telemetry });
    return () => this.telemetrySubscribers.delete(callback);
  }

  subscribeToAlerts(_robotId: string, callback: (alert: RobotAlert) => void): UnsubscribeFunction {
    this.alertSubscribers.add(callback);
    return () => this.alertSubscribers.delete(callback);
  }

  subscribeToStatus(_robotId: string, callback: (status: RobotStatus) => void): UnsubscribeFunction {
    this.statusSubscribers.add(callback);
    callback({ ...this.robotStatus });
    return () => this.statusSubscribers.delete(callback);
  }

  private startMissionSimulation(missionId: string) {
    const mission = this.missions.get(missionId);
    if (!mission) return;

    const isResume = mission.status === 'paused';
    this.activeMissionId = missionId;
    mission.status = 'running';
    if (!isResume) {
      mission.startedAt = now();
      mission.progressPercent = 0;
      this.missionStartBattery = this.robotStatus.batteryPercent;
      this.deterministicStep = 0;
      log('Mission started', missionId);
    }

    this.updateStatus({ operatingState: 'operating' });

    const route = mission.config.plannedRoute;
    let elapsed = this.telemetry.runtimeSeconds;

    this.stopTelemetryStream();
    this.telemetryInterval = setInterval(() => {
      const m = this.missions.get(missionId);
      if (!m || m.status !== 'running') return;

      elapsed += appConfig.deterministicDemo ? 2 : 1.5;
      const progressIncrement = appConfig.deterministicDemo ? 4 : 2 + Math.random() * 2;
      m.progressPercent = Math.min(100, m.progressPercent + progressIncrement);
      m.estimatedTimeRemainingSeconds = Math.max(
        0,
        Math.round((100 - m.progressPercent) * (mission.config.estimatedDurationMinutes * 60) / 100),
      );

      const routeIndex = Math.min(
        route.length - 1,
        Math.floor((m.progressPercent / 100) * route.length),
      );
      const point = route[routeIndex];
      const nextPoint = route[Math.min(routeIndex + 1, route.length - 1)];
      const heading = Math.atan2(
        nextPoint.longitude - point.longitude,
        nextPoint.latitude - point.latitude,
      ) * (180 / Math.PI);

      const batteryDrain = (this.missionStartBattery - 15) / 100;
      const battery = Math.max(15, this.missionStartBattery - m.progressPercent * batteryDrain / 100 * 100);

      this.telemetry = {
        robotId: MOCK_ROBOT.robotId,
        missionId,
        timestamp: now(),
        position: {
          latitude: point.latitude,
          longitude: point.longitude,
          headingDegrees: heading,
        },
        speedMetersPerSecond: 0.8 + Math.random() * 0.4,
        batteryPercent: battery,
        connectionQualityPercent: this.connectionLost ? 12 : 85 + Math.random() * 10,
        runtimeSeconds: elapsed,
        distanceTraveledMeters: (m.progressPercent / 100) * mission.config.plannedRoute.length * 80,
        areaCompletedSquareMeters: (m.progressPercent / 100) * mission.config.targetArea.areaSquareMeters,
        moduleTelemetry: {
          moduleId: mission.config.moduleId,
          status: 'ready',
          targetsDetected: Math.floor(m.progressPercent * 3),
          targetsTreated: Math.floor(m.progressPercent * 2.8),
          consumableLevelPercent: mission.config.operationType === 'laser_weeding'
            ? 100
            : Math.max(10, 72 - m.progressPercent * 0.5),
          tankLevelLiters: mission.config.operationType === 'precision_spraying'
            ? Math.max(5, 180 - m.progressPercent * 1.5)
            : undefined,
        },
      };

      this.updateStatus({
        batteryPercent: battery,
        health: { ...this.robotStatus.health, batteryPercent: battery },
      });
      this.notifyTelemetry();

      this.runProfileTriggers(m, battery);

      if (m.progressPercent >= 100 && this.profile !== 'partial_mission') {
        this.completeMission(missionId, 'completed');
      } else if (this.profile === 'partial_mission' && m.progressPercent >= 65) {
        this.completeMission(missionId, 'partially_completed');
      }
    }, appConfig.deterministicDemo ? 2000 : 1500);
  }

  private runProfileTriggers(mission: Mission, battery: number) {
    if (appConfig.deterministicDemo) {
      this.deterministicStep++;
      if (this.profile === 'low_battery_warning' && this.deterministicStep === 5) {
        this.emitAlert(this.makeAlert('low_battery', 'Battery below 20% — consider returning to base'));
      }
      if (this.profile === 'obstacle_detected' && this.deterministicStep === 8) {
        this.emitAlert(this.makeAlert('obstacle_detected', 'Obstacle detected ahead — robot slowing'));
        mission.status = 'paused';
        this.updateStatus({ operatingState: 'paused' });
      }
      if (this.profile === 'connection_loss' && this.deterministicStep === 6) {
        this.connectionLost = true;
        this.emitAlert(this.makeAlert('connection_interrupted', 'Connection interrupted — telemetry delayed'));
        setTimeout(() => {
          this.connectionLost = false;
          this.updateStatus({ connectionState: 'online' });
        }, 8000);
      }
      if (this.profile === 'module_fault' && this.deterministicStep === 7) {
        this.emitAlert(this.makeAlert('module_fault', 'Module fault detected — operation paused'));
        mission.status = 'paused';
        this.updateStatus({ operatingState: 'paused' });
      }
      if (this.profile === 'emergency_stop' && this.deterministicStep === 10) {
        this.updateStatus({
          operatingState: 'emergency_stopped',
          health: { ...this.robotStatus.health, emergencyStopActive: true },
        });
        this.emitAlert(this.makeAlert('emergency_stop_activated', 'Emergency stop activated'));
        this.stopMissionSimulation(mission.missionId);
      }
      return;
    }

    if (this.profile === 'low_battery_warning' && battery < 20 && mission.progressPercent > 30) {
      this.emitAlert(this.makeAlert('low_battery', 'Battery below 20%'));
      this.profile = 'successful_mission';
    }
  }

  private makeAlert(type: RobotAlert['type'], message: string): RobotAlert {
    const severity: RobotAlert['severity'] =
      type === 'emergency_stop_activated' || type === 'module_fault' ? 'critical' : 'warning';
    return {
      alertId: uid(),
      robotId: MOCK_ROBOT.robotId,
      missionId: this.activeMissionId ?? undefined,
      severity,
      type,
      message,
      timestamp: now(),
      acknowledged: false,
      recommendedAction: 'Review the situation and take appropriate action',
    };
  }

  private pauseMissionSimulation(missionId: string) {
    const mission = this.missions.get(missionId);
    if (!mission) return;
    mission.status = 'paused';
    this.updateStatus({ operatingState: 'paused' });
    this.stopTelemetryStream();
    log('Mission paused', missionId);
  }

  private resumeMissionSimulation(missionId: string) {
    const mission = this.missions.get(missionId);
    if (!mission) return;
    log('Mission resumed', missionId);
    this.startMissionSimulation(missionId);
  }

  private stopMissionSimulation(missionId: string) {
    const mission = this.missions.get(missionId);
    if (!mission) return;
    mission.status = 'aborted';
    mission.completedAt = now();
    this.completeMission(missionId, 'aborted');
  }

  private returnToBaseSimulation() {
    this.stopTelemetryStream();
    this.updateStatus({ operatingState: 'returning_to_base', location: 'En route to base' });
    setTimeout(() => {
      this.updateStatus({ operatingState: 'ready', location: 'Base station' });
      this.activeMissionId = null;
    }, 3000);
  }

  private completeMission(missionId: string, status: Mission['status'] | 'partially_completed') {
    const mission = this.missions.get(missionId);
    if (!mission || mission.status === 'completed') return;

    this.stopTelemetryStream();
    mission.status = status === 'partially_completed' ? 'completed' : (status as Mission['status']);
    mission.progressPercent = status === 'partially_completed' ? 65 : 100;
    mission.completedAt = now();
    mission.estimatedTimeRemainingSeconds = 0;

    this.updateStatus({
      operatingState: 'completed',
      batteryPercent: this.telemetry.batteryPercent,
    });
    log('Mission completed', missionId);
  }

  private stopTelemetryStream() {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }
  }

  private buildMissionResult(mission: Mission): MissionResult {
    const field = MOCK_FIELDS.find((f) => f.fieldId === mission.config.fieldId);
    const module = this.robotStatus.attachedModule ?? MOCK_MODULES[mission.config.moduleId];
    const progress = mission.progressPercent / 100;
    const isPartial = mission.progressPercent < 100 && mission.status === 'completed';

    const base: MissionResult = {
      missionId: mission.missionId,
      robotId: MOCK_ROBOT.robotId,
      robotName: MOCK_ROBOT.name,
      module,
      operationType: mission.config.operationType,
      fieldName: field?.name ?? 'Unknown field',
      startTime: mission.startedAt ?? mission.createdAt,
      endTime: mission.completedAt ?? now(),
      durationSeconds: mission.startedAt
        ? Math.round((new Date(mission.completedAt ?? now()).getTime() - new Date(mission.startedAt).getTime()) / 1000)
        : 0,
      completionStatus: isPartial ? 'partially_completed' : mission.status === 'aborted' ? 'aborted' : 'completed',
      areaCoveredSquareMeters: mission.config.targetArea.areaSquareMeters * progress,
      distanceTraveledMeters: this.telemetry.distanceTraveledMeters,
      batteryUsedPercent: this.missionStartBattery - this.telemetry.batteryPercent,
      alertCount: this.alerts.filter((a) => a.missionId === mission.missionId).length,
      completedRoute: mission.config.plannedRoute.slice(
        0,
        Math.ceil(mission.config.plannedRoute.length * progress),
      ),
      skippedZones: field?.restrictedZones ?? [],
    };

    if (mission.config.operationType === 'laser_weeding') {
      base.weedingResult = {
        weedsDetected: Math.round(340 * progress),
        weedsTreated: Math.round(325 * progress),
        treatmentSuccessRatePercent: 95.6,
        missedTargets: Math.round(15 * progress),
        cropSafetyIncidents: 0,
        areaTreatedSquareMeters: base.areaCoveredSquareMeters,
        energyUsedKwh: 2.4 * progress,
      };
    } else {
      base.sprayingResult = {
        areaTreatedSquareMeters: base.areaCoveredSquareMeters,
        productUsedLiters: 45 * progress,
        liquidVolumeUsedLiters: 45 * progress,
        applicationRateLitersPerHectare: 120,
        coveragePercent: 96.2 * progress,
        skippedZones: isPartial ? 1 : 0,
        tankRemainingLiters: 135 - 45 * progress,
      };
    }

    return base;
  }

  // Demo controls
  async resetSimulation(): Promise<void> {
    this.stopTelemetryStream();
    this.missions.clear();
    this.alerts = [];
    this.activeMissionId = null;
    this.connectionLost = false;
    this.forceCommandFailure = false;
    this.profile = 'successful_mission';
    this.robotStatus = this.buildInitialStatus();
    this.telemetry = this.buildInitialTelemetry();
    this.notifyStatus();
    this.notifyTelemetry();
    log('Simulation reset');
  }

  async completeMissionImmediately(): Promise<void> {
    if (!this.activeMissionId) return;
    const mission = this.missions.get(this.activeMissionId);
    if (mission) {
      mission.progressPercent = 100;
      this.completeMission(this.activeMissionId, 'completed');
    }
  }

  async setMissionProgress(percent: number): Promise<void> {
    if (!this.activeMissionId) return;
    const mission = this.missions.get(this.activeMissionId);
    if (mission) {
      mission.progressPercent = Math.min(100, Math.max(0, percent));
    }
  }

  async triggerAlert(type: RobotAlert['type']): Promise<void> {
    this.emitAlert(this.makeAlert(type, `Simulated ${type.replace(/_/g, ' ')} alert`));
  }

  async triggerConnectionLoss(): Promise<void> {
    this.connectionLost = true;
    this.updateStatus({ connectionState: 'communication_error' });
    this.emitAlert(this.makeAlert('connection_interrupted', 'Simulated connection loss'));
    setTimeout(() => {
      this.connectionLost = false;
      this.updateStatus({ connectionState: 'online' });
    }, 6000);
  }

  async triggerCommandFailure(): Promise<void> {
    this.forceCommandFailure = true;
  }

  async setBatteryLevel(percent: number): Promise<void> {
    this.updateStatus({
      batteryPercent: percent,
      health: { ...this.robotStatus.health, batteryPercent: percent },
    });
    this.telemetry = { ...this.telemetry, batteryPercent: percent };
    this.notifyTelemetry();
  }

  async setRobotState(state: RobotStatus['operatingState']): Promise<void> {
    this.updateStatus({ operatingState: state });
  }

  async selectSimulationProfile(profile: SimulationProfile): Promise<void> {
    this.profile = profile;
    log('Simulation profile selected', profile);
  }
}
