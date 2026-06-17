import { create } from 'zustand';
import { appConfig } from '../config/appConfig';
import type {
  CommandResult,
  RobotAlert,
  RobotStatus,
  RobotTelemetry,
} from '../models/robot';
import type {
  FieldBoundary,
  Mission,
  MissionConfig,
  MissionResult,
  PlannedRoute,
  SafetyChecklistItem,
} from '../models/mission';
import { getRobotService } from '../services/robot';
import { DEFAULT_SAFETY_CHECKLIST } from '../validation/missionValidation';

export type CommandHistoryEntry = {
  command: string;
  submittedAt: string;
  result: CommandResult;
  missionId?: string;
  robotId: string;
};

export type TelemetryHealth = 'live' | 'delayed' | 'unstable' | 'unavailable';

type RobotStore = {
  robotId: string;
  robotStatus: RobotStatus | null;
  telemetry: RobotTelemetry | null;
  telemetryHealth: TelemetryHealth;
  lastTelemetryAt: number | null;
  fields: FieldBoundary[];
  selectedFieldId: string | null;
  plannedRoute: PlannedRoute | null;
  missionConfig: Partial<MissionConfig> | null;
  currentMission: Mission | null;
  missionResult: MissionResult | null;
  alerts: RobotAlert[];
  safetyChecklist: SafetyChecklistItem[];
  commandHistory: CommandHistoryEntry[];
  pendingCommand: CommandResult | null;
  loading: boolean;
  error: string | null;
  reviewNote: string;

  initialize: () => Promise<void>;
  loadFields: () => Promise<void>;
  selectField: (fieldId: string) => void;
  setMissionConfig: (config: Partial<MissionConfig>) => void;
  loadRoute: () => Promise<void>;
  createMission: () => Promise<Mission | null>;
  startMission: () => Promise<CommandResult | null>;
  pauseMission: () => Promise<CommandResult | null>;
  resumeMission: () => Promise<CommandResult | null>;
  stopMission: () => Promise<CommandResult | null>;
  returnToBase: () => Promise<CommandResult | null>;
  requestOperator: () => Promise<CommandResult | null>;
  loadMissionResult: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  toggleSafetyCheck: (id: string) => void;
  setReviewNote: (note: string) => void;
  clearError: () => void;
  resetWorkflow: () => void;
};

const robotService = getRobotService();

async function runCommand(
  label: string,
  fn: () => Promise<CommandResult>,
  get: () => RobotStore,
  set: (partial: Partial<RobotStore> | ((s: RobotStore) => Partial<RobotStore>)) => void,
): Promise<CommandResult | null> {
  const state = get();
  if (state.pendingCommand?.status === 'pending') return null;

  set({ pendingCommand: { commandId: '', commandType: 'start', status: 'pending', submittedAt: new Date().toISOString() }, error: null });

  try {
    const result = await fn();
    const { robotId, currentMission } = get();

    set((s) => ({
      pendingCommand: ['pending', 'acknowledged'].includes(result.status) ? result : null,
      commandHistory: [
        {
          command: label,
          submittedAt: result.submittedAt,
          result,
          missionId: currentMission?.missionId,
          robotId,
        },
        ...s.commandHistory,
      ],
      error:
        result.status === 'rejected' || result.status === 'failed'
          ? (result.errorMessage ?? 'Command failed')
          : null,
    }));

    if (currentMission) {
      const updated = await robotService.getMissionStatus(currentMission.missionId);
      set({ currentMission: updated });
    }

    return result;
  } catch (e) {
    set({ error: e instanceof Error ? e.message : 'Command failed', pendingCommand: null });
    return null;
  }
}

export const useRobotStore = create<RobotStore>((set, get) => ({
  robotId: appConfig.defaultRobotId,
  robotStatus: null,
  telemetry: null,
  telemetryHealth: 'live',
  lastTelemetryAt: null,
  fields: [],
  selectedFieldId: null,
  plannedRoute: null,
  missionConfig: null,
  currentMission: null,
  missionResult: null,
  alerts: [],
  safetyChecklist: DEFAULT_SAFETY_CHECKLIST.map((item) => ({ ...item })),
  commandHistory: [],
  pendingCommand: null,
  loading: false,
  error: null,
  reviewNote: '',

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      const { robotId } = get();
      const status = await robotService.getRobotStatus(robotId);
      const telemetry = await robotService.getTelemetry(robotId);
      set({
        robotStatus: status,
        telemetry,
        lastTelemetryAt: Date.now(),
        telemetryHealth: 'live',
        loading: false,
      });

      robotService.subscribeToStatus(robotId, (s) => set({ robotStatus: s }));
      robotService.subscribeToTelemetry(robotId, (t) => {
        set({
          telemetry: t,
          lastTelemetryAt: Date.now(),
          telemetryHealth: 'live',
        });
      });
      robotService.subscribeToAlerts(robotId, (alert) => {
        set((state) => ({ alerts: [alert, ...state.alerts] }));
      });

      setInterval(() => {
        const { lastTelemetryAt } = get();
        if (!lastTelemetryAt) return;
        const age = Date.now() - lastTelemetryAt;
        if (age > appConfig.telemetryStaleThresholdMs * 2) {
          set({ telemetryHealth: 'unavailable' });
        } else if (age > appConfig.telemetryStaleThresholdMs) {
          set({ telemetryHealth: 'delayed' });
        }
      }, 1000);

      await get().loadFields();
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to initialize' });
    }
  },

  loadFields: async () => {
    const fields = await robotService.getFields();
    set({ fields });
  },

  selectField: (fieldId) => set({ selectedFieldId: fieldId }),

  setMissionConfig: (config) =>
    set((state) => ({
      missionConfig: { ...state.missionConfig, ...config },
    })),

  loadRoute: async () => {
    const { missionConfig } = get();
    if (!missionConfig?.fieldId || !missionConfig?.operationType) return;
    set({ loading: true });
    try {
      const route = await robotService.getPlannedRoute(
        missionConfig.fieldId,
        missionConfig.operationType,
      );
      set({
        plannedRoute: route,
        missionConfig: {
          ...missionConfig,
          plannedRoute: route.points,
          targetArea: {
            areaSquareMeters: route.estimatedDistanceMeters * 8,
            label: 'Treatment area',
          },
          estimatedDurationMinutes: route.estimatedDurationMinutes,
          estimatedBatteryUsagePercent: 25,
        },
        loading: false,
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load route',
      });
    }
  },

  createMission: async () => {
    const { missionConfig, robotId } = get();
    if (!missionConfig?.fieldId || !missionConfig?.operationType || !missionConfig.parameters) {
      return null;
    }
    set({ loading: true, error: null });
    try {
      const config: MissionConfig = {
        robotId,
        fieldId: missionConfig.fieldId,
        operationType: missionConfig.operationType,
        moduleId: missionConfig.moduleId ?? 'module-laser-01',
        targetArea: missionConfig.targetArea ?? { areaSquareMeters: 0, label: '' },
        plannedRoute: missionConfig.plannedRoute ?? [],
        parameters: missionConfig.parameters,
        operatingMode: missionConfig.operatingMode ?? 'autonomous',
        estimatedDurationMinutes: missionConfig.estimatedDurationMinutes ?? 45,
        estimatedBatteryUsagePercent: missionConfig.estimatedBatteryUsagePercent ?? 25,
      };

      const mission = await robotService.createMission(config);
      set({ currentMission: mission, loading: false });
      return mission;
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to create mission',
      });
      return null;
    }
  },

  startMission: async () => {
    const { currentMission } = get();
    if (!currentMission) return null;
    set({ loading: true });
    const result = await runCommand(
      'start',
      () => robotService.startMission(currentMission.missionId),
      get,
      set,
    );
    set({ loading: false });
    return result;
  },

  pauseMission: async () => {
    const { currentMission } = get();
    if (!currentMission) return null;
    return runCommand('pause', () => robotService.pauseMission(currentMission.missionId), get, set);
  },

  resumeMission: async () => {
    const { currentMission } = get();
    if (!currentMission) return null;
    return runCommand('resume', () => robotService.resumeMission(currentMission.missionId), get, set);
  },

  stopMission: async () => {
    const { currentMission } = get();
    if (!currentMission) return null;
    return runCommand('stop', () => robotService.stopMission(currentMission.missionId), get, set);
  },

  returnToBase: async () => {
    const { robotId } = get();
    return runCommand('return_to_base', () => robotService.returnToBase(robotId), get, set);
  },

  requestOperator: async () => {
    const { robotId } = get();
    return runCommand('request_operator', () => robotService.requestOperator(robotId), get, set);
  },

  loadMissionResult: async () => {
    const { currentMission } = get();
    if (!currentMission) return;
    set({ loading: true });
    try {
      const result = await robotService.getMissionResults(currentMission.missionId);
      set({ missionResult: result, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to load results' });
    }
  },

  acknowledgeAlert: async (alertId) => {
    await robotService.acknowledgeAlert(alertId);
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.alertId === alertId ? { ...a, acknowledged: true } : a,
      ),
    }));
  },

  toggleSafetyCheck: (id) =>
    set((state) => ({
      safetyChecklist: state.safetyChecklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    })),

  setReviewNote: (note) => set({ reviewNote: note }),

  clearError: () => set({ error: null }),

  resetWorkflow: () =>
    set({
      selectedFieldId: null,
      plannedRoute: null,
      missionConfig: null,
      currentMission: null,
      missionResult: null,
      safetyChecklist: DEFAULT_SAFETY_CHECKLIST.map((item) => ({ ...item })),
      pendingCommand: null,
      reviewNote: '',
      error: null,
    }),
}));
